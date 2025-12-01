import { Injectable, signal, computed } from '@angular/core';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { AstroCoreService } from '../astro-core/astro-core-service';

interface ScoreContext {
  date: string;   // '2025-12-01'
  lat: number | null; // arredondado para 0.1°
  lon: number | null;
}

interface StoredScores {
  context: ScoreContext;
  scores: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class TargetScoreService {

  private readonly STORAGE_KEY = 'astroplanner_target_scores';
  private readonly ALT_MIN = 30; // altura mínima "útil"
  private readonly STEP_MINUTES = 10;

  // signals
  private readonly scoresSignal = signal<Record<string, number>>({});
  readonly scores = computed(() => this.scoresSignal());

  private readonly contextSignal = signal<ScoreContext | null>(null);
  readonly context = computed(() => this.contextSignal());

  constructor(private astro: AstroCoreService) {
    const stored = this.loadFromStorage();
    if (stored) {
      this.scoresSignal.set(stored.scores);
      this.contextSignal.set(stored.context);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  initScoresForToday(
    targets: DeepSkyObject[],
    lat: number | null,
    lon: number | null
  ): void {
    const today = this.getTodayString();
    const roundedLat = this.roundCoord(lat);
    const roundedLon = this.roundCoord(lon);

    const stored = this.loadFromStorage();

    // Se já temos scores válidos
    if (
      stored &&
      this.isSameContext(stored.context, today, roundedLat, roundedLon)
    ) {
      this.scoresSignal.set(stored.scores);
      this.contextSignal.set(stored.context);
      return;
    }

    // Recalcula tudo
    const dateObj = new Date();
    const scores: Record<string, number> = {};

    for (const t of targets) {
      if (roundedLat == null || roundedLon == null) {
        scores[t.id] = 0;
      } else {
        scores[t.id] = this.computeScoreForTarget(
          t,
          dateObj,
          roundedLat,
          roundedLon
        );
      }
    }

    const newContext: ScoreContext = {
      date: today,
      lat: roundedLat,
      lon: roundedLon
    };

    this.saveToStorage({ context: newContext, scores });
    this.scoresSignal.set(scores);
    this.contextSignal.set(newContext);
  }

  getScore(id: string): number {
    return this.scoresSignal()[id] ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Score calculation core
  // ---------------------------------------------------------------------------

  private computeScoreForTarget(
    target: DeepSkyObject,
    date: Date,
    lat: number,
    lon: number
  ): number {
    const location = { latitude: lat, longitude: lon };

    // -----------------------------------------------
    // 1. Sun/Moon info (hoje e amanhã)
    // -----------------------------------------------
    const dailyToday = this.astro.getDailySkyInfo(date, location);
    const tomorrow = new Date(date.getTime() + 24 * 3600 * 1000);
    const dailyTomorrow = this.astro.getDailySkyInfo(tomorrow, location);

    const sunset = dailyToday.sun.sunset;
    const sunrise = dailyTomorrow.sun.sunrise;

    if (!sunset || !sunrise) return 0;

    // Noite útil (ignora crepúsculo alterando 1h)
    const nightStart = new Date(sunset.getTime() + 60 * 60 * 1000);
    const nightEnd = new Date(sunrise.getTime() - 60 * 60 * 1000);

    // -----------------------------------------------
    // 2. Converte RA/Dec do catálogo
    // -----------------------------------------------
    const [raH, raM, raS] = target.ra.split(' ').map(Number);
    const [dD, dM, dS] = target.dec.split(' ').map(Number);

    const targetEq = {
      raHours: this.astro.raHmsToHours(raH, raM, raS),
      decDegrees: this.astro.decDmsToDegrees(dD, dM, dS)
    };

    // -----------------------------------------------
    // 3. Curva de altitude da noite
    // -----------------------------------------------
    const samples = this.astro.getTargetAltitudeCurve(
      targetEq,
      nightStart,
      nightEnd,
      location,
      { stepMinutes: this.STEP_MINUTES }
    );

    if (!samples.length) return 0;

    const hasAboveHorizon = samples.some(s => s.altitude > 0);
    if (!hasAboveHorizon) {
      return 0;
    }

    // -----------------------------------------------
    // 4. Janela útil (visibilidade + altitude máxima)
    // -----------------------------------------------
    const total = samples.length;
    const visibleSamples = samples.filter(s => s.altitude >= this.ALT_MIN);
    const visibleFraction = total > 0 ? visibleSamples.length / total : 0;

    const culmination = this.astro.getCulmination(samples);
    const maxAltitude = culmination ? culmination.altitude : -90;

    const visibilityFactor = this.clamp(visibleFraction / 0.5, 0, 1);
    const altitudeFactor =
      maxAltitude <= this.ALT_MIN
        ? 0
        : this.clamp((maxAltitude - this.ALT_MIN) / (90 - this.ALT_MIN), 0, 1);

    // -----------------------------------------------
    // 5. Lua (iluminação + presença na janela útil)
    // -----------------------------------------------
    const illum = dailyToday.moon.illuminationPercent / 100;
    const moonrise = dailyToday.moon.moonrise;
    const moonset = dailyToday.moon.moonset;

    let moonOverlap = 0;

    for (const s of visibleSamples) {
      const t = s.time.getTime();
      const moonAbove =
        (moonrise && moonset && t >= moonrise.getTime() && t <= moonset.getTime()) ||
        (moonrise && !moonset && t >= moonrise.getTime()) ||
        (!moonrise && moonset && t <= moonset.getTime());

      if (moonAbove) moonOverlap++;
    }

    const fractionMoonOverlap =
      visibleSamples.length > 0
        ? moonOverlap / visibleSamples.length
        : 0;

    const moonFactorRaw = 1 - (fractionMoonOverlap * illum);
    const moonFactor = this.clamp(moonFactorRaw, 0, 1);

    // -----------------------------------------------
    // 6. Janela dentro da noite (mid-night factor)
    // -----------------------------------------------
    let windowFactor = 0;
    if (visibleSamples.length > 0) {
      const avgVisibleTime =
        visibleSamples.map(s => s.time.getTime())
          .reduce((a, b) => a + b, 0) / visibleSamples.length;

      const mid = (nightStart.getTime() + nightEnd.getTime()) / 2;
      const halfSpan = (nightEnd.getTime() - nightStart.getTime()) / 2;

      const diff = Math.abs(avgVisibleTime - mid);
      windowFactor = 1 - this.clamp(diff / halfSpan, 0, 1);
    }

    // -----------------------------------------------
    // 7. Score final
    // -----------------------------------------------

    const score0to1 =
      0.45 * visibilityFactor +
      0.25 * altitudeFactor +
      0.20 * moonFactor +
      0.10 * windowFactor;

    return Math.round(score0to1 * 100);
  }


  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private clamp(x: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, x));
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private roundCoord(v: number | null): number | null {
    if (v == null) return null;
    return Math.round(v * 10) / 10; // arredonda para 0.1°
  }

  private isSameContext(ctx: ScoreContext, date: string, lat: number | null, lon: number | null): boolean {
    return (
      ctx.date === date &&
      ctx.lat === lat &&
      ctx.lon === lon
    );
  }

  private loadFromStorage(): StoredScores | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredScores;
    } catch {
      return null;
    }
  }

  private saveToStorage(data: StoredScores): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch { }
  }
}
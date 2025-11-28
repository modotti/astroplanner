import { Injectable } from '@angular/core';
import {
  AstroCoreService,
  ObserverLocation,
  TargetEquatorial,
  AltitudeSample,
  DailySkyInfo,
  TargetHorizontalPosition,
} from '../astro-core/astro-core-service';

import {
  AstroTime,
  Body,
  Equator,
  Horizon,
  Observer
} from 'astronomy-engine';

// -----------------------------
// Tipos de apoio
// -----------------------------

export interface VisibilityWindow {
  start: Date | null;
  end: Date | null;
}

export type MoonImpactLevel = 'low' | 'moderate' | 'high';

export interface MoonImpactInfo {
  level: MoonImpactLevel;
  separationDeg: number | null;   // separação alvo-Lua em graus (no auge)
  moonAltitudeDeg: number | null; // altitude da Lua em graus (no auge)
  description: string;            // texto pronto pra UI
}

export interface CapturePlan {
  targetId?: string;
  targetName?: string;
  date: Date;
  location: ObserverLocation;
  minAltitudeDeg: number;

  visibilityWindow: VisibilityWindow;   // janela acima de minAltitude
  culmination: AltitudeSample | null;   // ponto mais alto na noite
  sky: DailySkyInfo;                    // Sol + Lua do dia
  moonImpact: MoonImpactInfo;           // impacto da Lua no plano
  currentPosition: TargetHorizontalPosition; // posição “agora”
  altitudeCurve: AltitudeSample[];      // dados para gráfico 18h–06h
}

export interface CapturePlanOptions {
  minAltitudeDeg?: number;  // default: 30°
  stepMinutes?: number;     // default: 30
  currentTime?: Date;       // default: new Date()
}

@Injectable({ providedIn: 'root' })
export class PlanningService {

  constructor(private astro: AstroCoreService) { }

  // -------------------------------------------------------------------
  // API principal
  // -------------------------------------------------------------------

  getCapturePlan(
    date: Date,
    target: TargetEquatorial,
    location: ObserverLocation,
    options: CapturePlanOptions = {}
  ): CapturePlan {
    const minAlt = options.minAltitudeDeg ?? 30;
    const stepMinutes = options.stepMinutes ?? 30;
    const currentTime = options.currentTime ?? new Date();

    // 1) Janela da noite: 18h do dia -> 06h do dia seguinte
    const { start, end } = this.buildNightWindow(date);

    // 2) Curva Altitude x Tempo (18h–06h)
    const altitudeCurve = this.astro.getTargetAltitudeCurve(
      target,
      start,
      end,
      location,
      { stepMinutes }
    );

    // 3) Janela de visibilidade acima de minAlt (30°)
    const visibilityWindow = this.findVisibilityWindow(
      altitudeCurve,
      minAlt
    );

    // 4) Culminação (ponto mais alto)
    const culmination = this.astro.getCulmination(altitudeCurve);

    // 5) Condições do céu (Sol + Lua)
    const sky = this.astro.getDailySkyInfo(date, location);

    // 6) Posição atual do alvo (no horário "agora" ou passado via options)
    const currentPosition = this.astro.getTargetHorizontalPosition(
      target,
      currentTime,
      location
    );

    // 7) Impacto da Lua (usa o horário da culminação se existir)
    const moonImpact = this.computeMoonImpact(
      target,
      location,
      sky,
      culmination
    );

    return {
      targetId: target.id,
      targetName: target.name,
      date,
      location,
      minAltitudeDeg: minAlt,
      visibilityWindow,
      culmination,
      sky,
      moonImpact,
      currentPosition,
      altitudeCurve,
    };
  }

  // -------------------------------------------------------------------
  // Helpers internos
  // -------------------------------------------------------------------

  /** Janela fixa: 18h do dia -> 06h do dia seguinte. */
  private buildNightWindow(date: Date): { start: Date; end: Date } {
    const start = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      18, 0, 0, 0
    );

    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);

    return { start, end };
  }

  /** Encontra primeira e última amostra acima da altitude mínima. */
  private findVisibilityWindow(
    samples: AltitudeSample[],
    minAltitudeDeg: number
  ): VisibilityWindow {
    const visible = samples.filter(s => s.altitude >= minAltitudeDeg);

    if (!visible.length) {
      return { start: null, end: null };
    }

    return {
      start: visible[0].time,
      end: visible[visible.length - 1].time,
    };
  }

  /** Calcula separação angular em graus entre dois pontos em RA/Dec. */
  private angularSeparationDeg(
    ra1Hours: number,
    dec1Deg: number,
    ra2Hours: number,
    dec2Deg: number
  ): number {
    const deg2rad = Math.PI / 180;
    const ra1 = ra1Hours * 15 * deg2rad;
    const ra2 = ra2Hours * 15 * deg2rad;
    const dec1 = dec1Deg * deg2rad;
    const dec2 = dec2Deg * deg2rad;

    const cosD =
      Math.sin(dec1) * Math.sin(dec2) +
      Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

    const d = Math.acos(Math.min(1, Math.max(-1, cosD)));
    return d * 180 / Math.PI;
  }

  /** Constrói um Observer local (duplicado aqui para não “furar” o encapsulamento do AstroCore). */
  private buildObserver(location: ObserverLocation): Observer {
    return new Observer(
      location.latitude,
      location.longitude,
      location.elevationMeters ?? 0
    );
  }

  /** Calcula o impacto da Lua no plano, usando o horário da culminação. */
  private computeMoonImpact(
    target: TargetEquatorial,
    location: ObserverLocation,
    sky: DailySkyInfo,
    culmination: AltitudeSample | null
  ): MoonImpactInfo {
    // Se não temos culminação, ou a Lua está quase nova, impacto é baixo por definição.
    if (!culmination || sky.moon.illuminationFraction < 0.05) {
      return {
        level: 'low',
        separationDeg: null,
        moonAltitudeDeg: null,
        description: 'Low impact: dark sky or target never culminates in this window.',
      };
    }

    const observer = this.buildObserver(location);
    const time = new AstroTime(culmination.time);

    // 1) Posição do alvo na culminação (RA/Dec + Alt/Az)
    const targetAtCulm: TargetHorizontalPosition =
      this.astro.getTargetHorizontalPosition(target, culmination.time, location);

    // 2) Posição da Lua em RA/Dec nesse instante
    const moonEq = Equator(Body.Moon, time, observer, true, true);

    // 3) Altitude da Lua nesse instante
    const moonHor = Horizon(time, observer, moonEq.ra, moonEq.dec, 'normal');
    const moonAlt = moonHor.altitude;

    // 4) Separação alvo-Lua (usando RA/Dec)
    const separation = this.angularSeparationDeg(
      targetAtCulm.ra,
      targetAtCulm.dec,
      moonEq.ra,
      moonEq.dec
    );

    // 5) Classifica impacto (versão menos otimista)
    const illum = sky.moon.illuminationFraction; // 0..1
    const illumPct = Math.round(illum * 100);
    const sep = Math.round(separation);          // em graus
    const alt = moonAlt;                         // em graus

    let level: MoonImpactLevel = 'low';
    let description: string;

    // Lua abaixo do horizonte OU quase nova: impacto realmente baixo
    if (alt <= 0 || illumPct <= 10) {
      level = 'low';
      description = `<b>Low impact:</b> Moon ${alt <= 0 ? 'below the horizon' : 'almost new'} at culmination (illum ${illumPct}%).`;
    }

    // Impacto ALTO: bem mais fácil de acontecer
    else if (
      // Lua muito brilhante e relativamente próxima
      (illumPct >= 70 && sep <= 60 && alt >= 20) ||
      // Lua meio cheia mas bem perto e razoavelmente alta
      (illumPct >= 50 && sep <= 40 && alt >= 20) ||
      // Lua quase cheia, alta no céu, independentemente da separação
      (illumPct >= 90 && alt >= 40)
    ) {
      level = 'high';
      description = `<b>High impact:</b> bright Moon (${illumPct}%) about ${sep}° from target at altitude ${alt.toFixed(0)}° at culmination.`;
    }

    // Impacto MODERADO: entra em cena com Lua menos brilhante ou mais distante
    else if (
      // Lua de 30%+ relativamente próxima
      (illumPct >= 30 && sep <= 70 && alt >= 10) ||
      // Lua de 50%+ em boa altura, mesmo não tão próxima
      (illumPct >= 50 && alt >= 20) ||
      // Lua bem brilhante mas não tão próxima
      (illumPct >= 70 && sep <= 90)
    ) {
      level = 'moderate';
      description = `<b>Moderate impact:</b> Moon (${illumPct}%) about ${sep}° from target at altitude ${alt.toFixed(0)}° at culmination.`;
    }

    // Caso contrário: ainda consideramos baixo, mas com texto menos otimista
    else {
      level = 'low';
      description = `<b>Low impact:</b> Moon (${illumPct}%) is ${sep}° from target and at ${alt.toFixed(0)}° altitude at culmination. Some sky brightening is still expected.`;
    }

    return {
      level,
      separationDeg: separation,
      moonAltitudeDeg: moonAlt,
      description,
    };
  }
}
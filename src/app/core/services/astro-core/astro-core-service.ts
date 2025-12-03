import { Injectable } from '@angular/core';
import {
  AstroTime,
  Body,
  DefineStar,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  Refraction,
  SearchRiseSet,
} from 'astronomy-engine';
import { DeepSkyObject } from '../../models/deep-sky-object.model';
import { UserLocation } from '../../models/location.model';

// ---------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevationMeters?: number;
}

export interface TargetEquatorial {
  id?: string;
  name?: string;
  raHours: number;      // RA já convertido para horas decimais
  decDegrees: number;   // Dec já convertido para graus decimais
}

export interface TargetHorizontalPosition {
  time: Date;
  altitude: number;
  azimuth: number;
  direction: string;    // N, NE, E, SE, etc.
  ra: number;
  dec: number;
}

export interface AltitudeSample {
  time: Date;
  altitude: number;
  azimuth: number;
  direction: string;
}

export interface AltitudeCurveOptions {
  stepMinutes?: number;
}

export interface MoonDayInfo {
  phaseAngleDeg: number;
  phaseName: string;
  illuminationFraction: number;
  illuminationPercent: number;
  moonrise?: Date | null;
  moonset?: Date | null;
}

export interface SunDayInfo {
  sunrise?: Date | null;
  sunset?: Date | null;
}

export interface DailySkyInfo {
  date: Date;
  moon: MoonDayInfo;
  sun: SunDayInfo;
}

// ---------------------------------------------------------------------
// Service principal
// ---------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class AstroCoreService {

  // -------------------------------------------------------------------
  // Helpers básicos
  // -------------------------------------------------------------------

  raHmsToHours(h: number, m: number, s: number): number {
    return h + m / 60 + s / 3600;
  }

  decDmsToDegrees(deg: number, min: number, sec: number): number {
    const sign = deg < 0 ? -1 : 1;
    return sign * (Math.abs(deg) + min / 60 + sec / 3600);
  }

  toObserver(loc: ObserverLocation): Observer {
    return new Observer(
      loc.latitude,
      loc.longitude,
      loc.elevationMeters ?? 0
    );
  }

  private getCardinalDirection(azimuth: number): string {
    // 16 setores de 22.5°
    const dirs = [
      'N', 'NNE', 'NE', 'ENE',
      'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW',
      'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(azimuth / 22.5) % 16;
    return dirs[index];
  }

  private getMoonPhaseName(angle: number): string {
    if (angle < 22.5 || angle >= 337.5) return 'New Moon';
    if (angle < 67.5) return 'Waxing Crescent';
    if (angle < 112.5) return 'First Quarter';
    if (angle < 157.5) return 'Waxing Gibbous';
    if (angle < 202.5) return 'Full Moon';
    if (angle < 247.5) return 'Waning Gibbous';
    if (angle < 292.5) return 'Last Quarter';
    return 'Waning Crescent';
  }

  // -------------------------------------------------------------------
  // Posição instantânea do alvo
  // -------------------------------------------------------------------

  getTargetHorizontalPosition(
    target: TargetEquatorial,
    when: Date,
    location: ObserverLocation
  ): TargetHorizontalPosition {

    const observer = this.toObserver(location);
    const time = new AstroTime(when);

    // Registrar o alvo como "estrela fixa"
    DefineStar(Body.Star1, target.raHours, target.decDegrees, 1000);

    const eq = Equator(Body.Star1, time, observer, true, true);
    const hor = Horizon(time, observer, eq.ra, eq.dec, 'normal');

    return {
      time: when,
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      direction: this.getCardinalDirection(hor.azimuth),
      ra: eq.ra,
      dec: eq.dec,
    };
  }

  // -------------------------------------------------------------------
  // Curva Altitude × Tempo (gráfico estilo Telescopius)
  // -------------------------------------------------------------------

  getTargetAltitudeCurve(
    target: TargetEquatorial,
    startTime: Date,
    endTime: Date,
    location: ObserverLocation,
    options: AltitudeCurveOptions = {}
  ): AltitudeSample[] {

    const step = options.stepMinutes ?? 10;
    const observer = this.toObserver(location);

    DefineStar(Body.Star1, target.raHours, target.decDegrees, 1000);

    const samples: AltitudeSample[] = [];
    const current = new Date(startTime.getTime());

    while (current <= endTime) {
      const t = new AstroTime(current);
      const eq = Equator(Body.Star1, t, observer, true, true);
      const hor = Horizon(t, observer, eq.ra, eq.dec, 'normal');

      samples.push({
        time: new Date(current.getTime()),
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        direction: this.getCardinalDirection(hor.azimuth),
      });

      current.setMinutes(current.getMinutes() + step);
    }

    return samples;
  }

  // -------------------------------------------------------------------
  // Culminação (ponto mais alto)
  // -------------------------------------------------------------------

  getCulmination(samples: AltitudeSample[]) {
    if (samples.length === 0) return null;
    return samples.reduce((max, s) =>
      s.altitude > max.altitude ? s : max
    );
  }

  // -------------------------------------------------------------------
  // Infos diárias: Sol + Lua
  // -------------------------------------------------------------------

  getDailySkyInfo(date: Date, location: ObserverLocation): DailySkyInfo {
    const observer = this.toObserver(location);

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    );
    const time = new AstroTime(startOfDay);

    // -------------------- LUA --------------------
    const phaseAngleDeg = MoonPhase(time);
    const illum = Illumination(Body.Moon, time);

    const moonrise = SearchRiseSet(Body.Moon, observer, 1, time, 1);
    const moonset = SearchRiseSet(Body.Moon, observer, -1, time, 1);

    const moon: MoonDayInfo = {
      phaseAngleDeg,
      phaseName: this.getMoonPhaseName(phaseAngleDeg),
      illuminationFraction: illum.phase_fraction,
      illuminationPercent: illum.phase_fraction * 100,
      moonrise: moonrise ? moonrise.date : null,
      moonset: moonset ? moonset.date : null,
    };

    // -------------------- SOL --------------------
    const sunrise = SearchRiseSet(Body.Sun, observer, 1, time, 1);
    const sunset = SearchRiseSet(Body.Sun, observer, -1, time, 1);

    const sun: SunDayInfo = {
      sunrise: sunrise ? sunrise.date : null,
      sunset: sunset ? sunset.date : null,
    };

    return {
      date: startOfDay,
      moon,
      sun,
    };
  }

  // -------------------------------------------------------------------
  // Utils
  // -------------------------------------------------------------------

  mapObjectToTargetEquatorial(object: DeepSkyObject, location: UserLocation): TargetEquatorial {
    const name = object.familiarName || object.catalogueEntry;
    const id = object.id;

    // -------------------------
    // Planetas: usar Astronomy-Engine
    // -------------------------
    if (object.group?.toLowerCase() === 'planet') {
      const body = this.getPlanetBodyFromObject(object);
      const time = new AstroTime(new Date());

      // Equatorial "of date" (coordenadas aparentes para o momento atual)
      const equ = Equator(body, time, this.toObserver(location), true, true);

      return {
        id,
        name,
        raHours: equ.ra,      // já vem em horas
        decDegrees: equ.dec   // já vem em graus
      };
    }

    // -------------------------
    // Demais objetos: usar RA/DEC fixos do catálogo
    // -------------------------
    if (!object.ra || !object.dec) {
      throw new Error(`RA/DEC ausentes para o objeto não-planetário: ${object.id}`);
    }

    const [raH, raM, raS] = object.ra.trim().split(/\s+/).map(Number);
    const [decD, decM, decS] = object.dec.trim().split(/\s+/).map(Number);

    return {
      id,
      name,
      raHours: this.raHmsToHours(raH, raM, raS),
      decDegrees: this.decDmsToDegrees(decD, decM, decS)
    };
  }

  private getPlanetBodyFromObject(object: DeepSkyObject): Body {
    const raw =
      (object.familiarName || object.catalogueEntry || object.id || '')
        .trim()
        .toLowerCase();

    if (raw.includes('mercury')) return Body.Mercury;
    if (raw.includes('venus')) return Body.Venus;
    if (raw.includes('earth')) return Body.Earth;
    if (raw.includes('mars')) return Body.Mars;
    if (raw.includes('jupiter')) return Body.Jupiter;
    if (raw.includes('saturn')) return Body.Saturn;
    if (raw.includes('uranus')) return Body.Uranus;
    if (raw.includes('neptune')) return Body.Neptune;
    if (raw.includes('pluto')) return Body.Pluto;

    // Se você também tiver Sol ou Lua como "planet"
    if (raw.includes('sun') || raw.includes('sol')) return Body.Sun;
    if (raw.includes('moon') || raw.includes('lua')) return Body.Moon;

    throw new Error(`Planeta não suportado ou não reconhecido: "${raw}"`);
  }
}
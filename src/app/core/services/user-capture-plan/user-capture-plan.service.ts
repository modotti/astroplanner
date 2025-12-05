import { Injectable } from '@angular/core';
import { UserCapturePlan } from '../../models/user-capture-plan.model';

@Injectable({ providedIn: 'root' })
export class UserCapturePlanService {
  private readonly STORAGE_KEY = 'ap_user_capture_plans';
  private readonly BORTLE_KEY = 'ap_last_bortle';

  // -------------------------------
  // Helpers de storage
  // -------------------------------
  private loadPlans(): UserCapturePlan[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as UserCapturePlan[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private savePlans(plans: UserCapturePlan[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
  }

  // -------------------------------
  // API pública
  // -------------------------------
  getAll(): UserCapturePlan[] {
    return this.loadPlans();
  }

  getById(id: string): UserCapturePlan | undefined {
    return this.loadPlans().find(p => p.id === id);
  }

  getNext(): UserCapturePlan | undefined {
    const loaded = this.getAll().sort((a, b) => {
      return a.date.localeCompare(b.date);
    });
    return loaded[0];
  }

  save(plan: UserCapturePlan): UserCapturePlan {
    const plans = this.loadPlans();
    const idx = plans.findIndex(p => p.id === plan.id);

    if (idx >= 0) {
      plans[idx] = { ...plans[idx], ...plan };
    } else {
      plans.push(plan);
    }

    this.savePlans(plans);

    // persiste o último Bortle usado
    if (plan.bortle) {
      localStorage.setItem(this.BORTLE_KEY, String(plan.bortle));
    }

    return plan;
  }

  delete(id: string): void {
    const plans = this.loadPlans().filter(p => p.id !== id);
    this.savePlans(plans);
  }

  getLastBortle(): number | null {
    const raw = localStorage.getItem(this.BORTLE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  }

  findForSession(
    targetId: string,
    date: string | Date,
    location: { latitude: number; longitude: number }
  ): UserCapturePlan | undefined {
    const plans = this.loadPlans();

    const targetDayKey = this.normalizeDateToDayKey(date);
    const { lat, lon } = this.normalizeLocation(location);

    return plans.find(plan => {
      if (plan.targetId !== targetId) return false;
      if (!plan.location) return false;

      const planDayKey = this.normalizeDateToDayKey(plan.date);
      if (planDayKey !== targetDayKey) return false;

      const { lat: pLat, lon: pLon } = this.normalizeLocation(plan.location);
      return pLat === lat && pLon === lon;
    });
  }

  // -------------------------------
  // Helpers
  // -------------------------------

  private normalizeDateToDayKey(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // chave de dia no formato yyyy-MM-dd (UTC)
    return d.toISOString().slice(0, 10);
  }

  private normalizeLocation(loc: { latitude: number; longitude: number }) {
    // arredonda pra ~1–2 km de precisão (ajuste se quiser mais “solto”)
    return {
      lat: +loc.latitude.toFixed(2),
      lon: +loc.longitude.toFixed(2),
    };
  }
}
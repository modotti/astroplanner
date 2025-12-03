import { Injectable } from '@angular/core';
import { CapturePlan } from '../planning/planning-service';

@Injectable({ providedIn: 'root' })
export class CapturePlanContextService {
  private currentPlan?: CapturePlan;

  setPlan(plan: CapturePlan): void {
    this.currentPlan = plan;
  }

  getPlan(): CapturePlan | undefined {
    return this.currentPlan;
  }

  clear(): void {
    this.currentPlan = undefined;
  }
}
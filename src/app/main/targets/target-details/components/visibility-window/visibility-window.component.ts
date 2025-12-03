
import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AltitudeSample } from 'src/app/core/services/astro-core/astro-core-service';
import { CapturePlan, VisibilityWindow } from 'src/app/core/services/planning/planning-service';
import { AltitudeChartComponent } from '../altitude-chart/altitude-chart.component';

@Component({
  selector: 'app-visibility-window',
  templateUrl: 'visibility-window.component.html',
  styleUrls: ['visibility-window.component.scss'],
  imports: [CommonModule, AltitudeChartComponent]
})
export class VisibilityWindowComponent {
  @Input('plan') plan: CapturePlan | undefined;

  constructor() { }

  get minAltitudeDeg(): string {
    return this.plan?.minAltitudeDeg.toString() || '';
  }

  get visibilityWindow(): VisibilityWindow | undefined {
    return this.plan?.visibilityWindow;
  }

  get culmination(): AltitudeSample | null | undefined {
    return this.plan?.culmination;
  }

  get currentPosition(): AltitudeSample | null | undefined {
    return this.plan?.currentPosition;
  }

  get altitudeCurve(): AltitudeSample[] {
    if (this.plan?.altitudeCurve)
      return this.plan?.altitudeCurve
    return [];
  }

}

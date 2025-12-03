import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DailySkyInfo, MoonDayInfo } from 'src/app/core/services/astro-core/astro-core-service';
import { MoonIconComponent } from 'src/app/shared/components/moon-icon/moon-icon.component';

@Component({
  selector: 'app-moon-status',
  templateUrl: 'moon-status.component.html',
  styleUrls: ['moon-status.component.scss'],
  imports: [CommonModule, MoonIconComponent]
})
export class MoonStatusComponent implements OnInit {
  @Input('sky') sky: DailySkyInfo | undefined;

  constructor() { }

  ngOnInit(): void { }

  get moonIlluminationPercent(): number {
    return this.sky?.moon?.illuminationPercent ?? 0;
  }

  get isWaxingMoon(): boolean {
    const angle = this.sky?.moon?.phaseAngleDeg;
    if (angle === undefined || angle === null) return true;
    // 0° = nova, 90° = quarto crescente, 180° = cheia, 270° = quarto minguante
    return angle < 180;
  }

  get moon(): MoonDayInfo | undefined {
    return this.sky?.moon;
  }

  get moonPhaseName(): string {
    return this.moon?.phaseName ?? '';
  }
}

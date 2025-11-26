import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoonIconComponent } from 'src/app/shared/components/moon-icon/moon-icon.component';
import { AstroCoreService, DailySkyInfo, MoonDayInfo, SunDayInfo } from 'src/app/core/services/astro-core/astro-core-service';
import { LocationService } from 'src/app/core/services/location/location.service';

@Component({
  selector: 'app-today-widget',
  templateUrl: 'today-widget.component.html',
  styleUrls: ['today-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, MoonIconComponent]
})
export class TodayWidgetComponent implements OnInit {
  loadingLocation = false;
  locationError: string | null = null;

  dailySkyInfo?: DailySkyInfo;

  constructor(private astroCoreService: AstroCoreService, private locationService: LocationService) { }

  async ngOnInit(): Promise<void> {
    await this.loadTodayFromCurrentLocation();
  }

  private async loadTodayFromCurrentLocation(): Promise<void> {
    const location = await this.locationService.getCurrentLocation();
    const now = new Date();
    this.dailySkyInfo = this.astroCoreService.getDailySkyInfo(now, location);
  }

  get moon(): MoonDayInfo | undefined {
    return this.dailySkyInfo?.moon;
  }

  get sun(): SunDayInfo | undefined {
    return this.dailySkyInfo?.sun;
  }

  get date(): Date | undefined {
    return this.dailySkyInfo?.date;
  }

  get moonIllumination(): number {
    return this.moon?.illuminationFraction ?? 0;
  }

  get moonIlluminationPercent(): number {
    return this.moon?.illuminationPercent ?? 0;
  }

  get moonPhaseName(): string {
    return this.moon?.phaseName ?? '';
  }

  get isWaxingMoon(): boolean {
    const angle = this.moon?.phaseAngleDeg;
    if (angle === undefined || angle === null) return true;
    // 0° = nova, 90° = quarto crescente, 180° = cheia, 270° = quarto minguante
    return angle < 180;
  }
}
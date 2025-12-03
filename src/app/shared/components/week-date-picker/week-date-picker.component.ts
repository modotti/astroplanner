import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserLocation } from 'src/app/core/models/location.model';
import { AstroCoreService, DailySkyInfo, MoonDayInfo } from 'src/app/core/services/astro-core/astro-core-service';
import { LocationService } from 'src/app/core/services/location/location.service';
import { MoonIconComponent } from '../moon-icon/moon-icon.component';

export interface WeekDayCell {
  date: Date;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  skyInfo: DailySkyInfo;

  // Derivados já prontos pro template
  moonIllumination: number;        // 0–1 (para o ícone)
  moonIlluminationPercent: number; // 0–100
  moonPhaseName: string;
  waxingMoon: boolean;
  moonrise: Date | null;
  moonset: Date | null;
}

@Component({
  selector: 'app-week-date-picker',
  templateUrl: './week-date-picker.component.html',
  styleUrls: ['./week-date-picker.component.scss'],
  imports: [CommonModule, DatePipe, MoonIconComponent]
})
export class WeekDatePickerComponent implements OnInit {
  /** Data mínima – default = hoje (sem horas) */
  @Input() minDate: Date = new Date();

  /** Data inicialmente selecionada */
  @Input() initialDate: Date | null = null;

  /** Emite quando o usuário escolhe um dia */
  @Output() dateSelected = new EventEmitter<Date>();

  weekDays: WeekDayCell[] = [];
  weekLabel = '';

  private location: UserLocation = {
    latitude: 0,
    longitude: 0
  };
  private today!: Date;            // sempre zerado (00:00)
  private selectedDate!: Date;     // sempre zerado (00:00)
  private currentWeekStart!: Date; // Monday 00:00 da semana atual
  private readonly weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(private astroCoreService: AstroCoreService, private locationService: LocationService) { }

  async ngOnInit(): Promise<void> {
    this.today = this.startOfDay(new Date());
    this.minDate = this.startOfDay(this.minDate || this.today);
    this.selectedDate = this.startOfDay(this.initialDate ?? this.today);
    this.location = await this.locationService.getCurrentLocation();

    const base = this.selectedDate < this.minDate ? this.minDate : this.selectedDate;
    this.currentWeekStart = this.getWeekStart(base);
    this.buildWeek();
  }

  // -----------------------------------------------------
  // Navegação
  // -----------------------------------------------------

  nextWeek(): void {
    this.currentWeekStart = this.addDays(this.currentWeekStart, 7);
    this.buildWeek();
  }

  prevWeek(): void {
    // não deixa voltar para antes da semana que contém hoje
    const minWeekStart = this.getWeekStart(this.minDate);
    const previous = this.addDays(this.currentWeekStart, -7);

    if (previous >= minWeekStart) {
      this.currentWeekStart = previous;
      this.buildWeek();
    }
  }

  canGoPrevWeek(): boolean {
    const minWeekStart = this.getWeekStart(this.minDate);
    const previous = this.addDays(this.currentWeekStart, -7);
    return previous >= minWeekStart;
  }

  // -----------------------------------------------------
  // Seleção
  // -----------------------------------------------------

  onSelect(day: WeekDayCell): void {
    if (day.disabled) return;

    this.selectedDate = this.startOfDay(day.date);
    this.dateSelected.emit(new Date(this.selectedDate)); // cópia
    this.buildWeek(); // atualiza highlight
  }

  // -----------------------------------------------------
  // Helpers de datas
  // -----------------------------------------------------

  private buildWeek(): void {
    const days: WeekDayCell[] = [];
    const observer = this.astroCoreService.toObserver(this.location);

    for (let i = 0; i < 7; i++) {
      const date = this.addDays(this.currentWeekStart, i);
      const dateClean = this.startOfDay(date);

      const disabled = dateClean < this.minDate;
      const isToday = dateClean.getTime() === this.today.getTime();
      const isSelected = dateClean.getTime() === this.selectedDate.getTime();

      const skyInfo = this.astroCoreService.getDailySkyInfo(date, observer);
      const moon = skyInfo.moon;

      const illumination = moon?.illuminationFraction ?? 0;
      const illuminationPercent = moon?.illuminationPercent ?? 0;
      const phaseName = moon?.phaseName ?? '';

      const angle = moon?.phaseAngleDeg;
      const waxingMoon = angle == null ? true : angle < 180;

      days.push({
        date: dateClean,
        disabled,
        isToday,
        isSelected,
        skyInfo,
        moonIllumination: illumination,
        moonIlluminationPercent: illuminationPercent,
        moonPhaseName: phaseName,
        waxingMoon,
        moonrise: moon?.moonrise ?? null,
        moonset: moon?.moonset ?? null,
      });
    }

    this.weekDays = days;

    const start = this.weekDays[0].date;
    const end = this.weekDays[6].date;
    this.weekLabel = `${this.formatShort(start)} - ${this.formatShort(end)}`;
  }

  private getWeekStart(date: Date): Date {
    const d = this.startOfDay(date);
    const jsDay = d.getDay(); // 0 = Sun ... 6 = Sat

    // Queremos Monday como início: 0 = Mon, 6 = Sun
    const diffToMonday = (jsDay + 6) % 7;
    return this.addDays(d, -diffToMonday);
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private formatShort(date: Date): string {
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    });
  }

  get weekDayHeaders(): string[] {
    return this.weekDayLabels;
  }
}
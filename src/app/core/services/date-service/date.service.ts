import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private date = new Date();

  constructor() { }

  resetDate(): void {
    this.date = new Date();
  }

  getDate(): string {
    return this.date.toDateString();
  }

  setDate(newDate: string | number): void {
    this.date = new Date(newDate);
  }
}
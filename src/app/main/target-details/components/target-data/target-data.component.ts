import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';

@Component({
  selector: 'app-target-data',
  templateUrl: 'target-data.component.html',
  styleUrls: ['target-data.component.scss'],
  imports: [CommonModule]
})
export class TargetDataComponent {
  @Input('target') target: DeepSkyObject | undefined;

  constructor() { }

  get constellation(): string {
    return this.target?.constellation || '';
  }

  get ra(): string {
    return this.target?.ra || '';
  }

  get dec(): string {
    return this.target?.dec || '';
  }

  get size(): string {
    return this.target?.size || '';
  }

  get magnitude(): string {
    return this.target?.magnitude?.toString() || '';
  }

  get surfaceBrightness(): string {
    return this.target?.surfaceBrightness?.toString() || '';
  }

  get score(): string {
    return this.target?.score?.toString() || '';
  }
}

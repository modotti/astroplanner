import { Component, Input } from '@angular/core';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { TARGET_ICON_MAP } from 'src/app/main/constants/target-icon-map';
import { TargetIconPipe } from 'src/app/main/pipes/target-icon.pipe';

@Component({
  selector: 'app-target-title',
  templateUrl: 'target-title.component.html',
  styleUrls: ['target-title.component.scss'],
  imports: [TargetIconPipe]
})
export class TargetTileComponent {
  @Input('target') target: DeepSkyObject | undefined;

  constructor() { }

  getIconForType(type: string): string {
    return `assets/image/${TARGET_ICON_MAP[type] ?? 'open.svg'}`;
  }

  get catalogueEntry(): string {
    return this.target?.catalogueEntry || '';
  }

  get familiarName(): string {
    return this.target?.familiarName || '';
  }

  get type(): string {
    return this.target?.type || '';
  }
}

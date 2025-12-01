import { Pipe, PipeTransform } from '@angular/core';
import { TARGET_ICON_MAP } from '../constants/target-icon-map';

@Pipe({
  name: 'targetIcon',
  standalone: true
})
export class TargetIconPipe implements PipeTransform {

  transform(type: string | null | undefined): string {
    if (!type) return 'assets/image/open.svg';
    const filename = TARGET_ICON_MAP[type] ?? 'open.svg';
    return `assets/image/${filename}`;
  }

}
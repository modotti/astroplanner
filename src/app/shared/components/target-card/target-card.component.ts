import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { IonItem, IonLabel } from '@ionic/angular/standalone';
import { DeepSkyObject } from "src/app/core/models/deep-sky-object.model";
import { TargetIconPipe } from "src/app/main/pipes/target-icon.pipe";

@Component({
  selector: 'app-target-card',
  templateUrl: './target-card.component.html',
  styleUrls: ['./target-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, TargetIconPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TargetCardComponent {
  @Input() target: DeepSkyObject | undefined;
  @Output() targetSelected = new EventEmitter<DeepSkyObject>();
  @Output() targetLiked = new EventEmitter<DeepSkyObject>();

  selectTarget(target: DeepSkyObject | undefined): void {
    if (target) {
      this.targetSelected.emit(target);
    }
  }

  likeTarget(target: DeepSkyObject | undefined): void {
    if (target) {
      this.targetLiked.emit(target);
    }
  }
}
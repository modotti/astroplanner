import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import { DeepSkyObject } from "src/app/core/models/deep-sky-object.model";
import { UserCapturePlan } from "src/app/core/models/user-capture-plan.model";
import { TargetIconPipe } from "src/app/main/pipes/target-icon.pipe";

@Component({
  selector: 'app-plan-card',
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonButton, TargetIconPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanCardComponent {
  @Input() target: DeepSkyObject | undefined;
  @Input() userPlan: UserCapturePlan | undefined;
  @Input() enableDeletion: boolean = false;

  @Output() userPlanSelect = new EventEmitter<UserCapturePlan>();
  @Output() userPlanDelete = new EventEmitter<UserCapturePlan>();

  selectPlan(): void {
    this.userPlanSelect.emit(this.userPlan);
  }

  deletePlan(): void {
    this.userPlanDelete.emit(this.userPlan);
  }
}
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { IonItem, IonLabel, IonButton, IonAlert } from '@ionic/angular/standalone';
import { DeepSkyObject } from "src/app/core/models/deep-sky-object.model";
import { UserCapturePlan } from "src/app/core/models/user-capture-plan.model";
import { TargetIconPipe } from "src/app/main/pipes/target-icon.pipe";

@Component({
  selector: 'app-plan-card',
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonButton, IonAlert, TargetIconPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanCardComponent {
  @Input() target: DeepSkyObject | undefined;
  @Input() userPlan: UserCapturePlan | undefined;

  @Output() userPlanSelect = new EventEmitter<UserCapturePlan>();
  @Output() userPlanDelete = new EventEmitter<UserCapturePlan>();

  public confirmDeleteButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => { },
    },
    {
      text: 'Yes',
      role: 'confirm',
      handler: (plan: any) => {
        this.deletePlan();
      },
    },
  ];

  selectPlan(): void {
    this.userPlanSelect.emit(this.userPlan);
  }

  deletePlan(): void {
    this.userPlanDelete.emit(this.userPlan);
  }

}
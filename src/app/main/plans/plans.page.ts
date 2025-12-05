import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonAlert, AlertController } from '@ionic/angular/standalone';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { UserCapturePlan } from 'src/app/core/models/user-capture-plan.model';
import { AstroCoreService } from 'src/app/core/services/astro-core/astro-core-service';
import { CapturePlanContextService } from 'src/app/core/services/capture-plan-context/capture-plan-context.service';
import { CapturePlan, PlanningService } from 'src/app/core/services/planning/planning-service';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { UserCapturePlanService } from 'src/app/core/services/user-capture-plan/user-capture-plan.service';
import { PlanCardComponent } from 'src/app/shared/components/plan-card/plan-card.component';

interface PlanListItem {
  plan: UserCapturePlan;
  target?: DeepSkyObject;
}

@Component({
  selector: 'app-plans',
  templateUrl: 'plans.page.html',
  styleUrls: ['plans.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonAlert, PlanCardComponent]
})
export class PlansPage implements OnInit {

  plans = signal<UserCapturePlan[]>([]);
  planItems = computed<PlanListItem[]>(() => {
    return this.plans().map(plan => ({
      plan,
      target: this.catalogService.getById(plan.targetId)
    }));
  });

  constructor(
    private router: Router,
    private userCapturePlanService: UserCapturePlanService,
    private catalogService: TargetCatalogService,
    private astroCoreService: AstroCoreService,
    private planningService: PlanningService,
    private capturePlanContextService: CapturePlanContextService,
    private alertController: AlertController
  ) { }

  ngOnInit(): void { }

  ionViewWillEnter(): void {
    this.loadUserPlans();
  }

  loadUserPlans(): void {
    const loaded = this.userCapturePlanService.getAll().sort((a, b) => {
      return a.date.localeCompare(b.date);
    });
    this.plans.set(loaded);
  }

  openUserCapturePlan(userPlan: UserCapturePlan): void {
    const capturePlan = this.buildCapturePlanFromUserPlan(userPlan);

    if (!capturePlan) {
      return;
    }

    this.capturePlanContextService.setPlan(capturePlan);
    this.router.navigate(['/main/plans', userPlan.id]);
  }

  private buildCapturePlanFromUserPlan(userPlan: UserCapturePlan): CapturePlan | undefined {
    const { location, date: dateIso, targetId, id: userPlanId } = userPlan;

    const target = this.catalogService.getById(targetId);
    if (!target) {
      return;
    }

    const date = new Date(dateIso);
    if (isNaN(date.getTime())) {
      return;
    }

    const equatorialTarget = this.astroCoreService.mapObjectToTargetEquatorial(
      target,
      location
    );

    return this.planningService.getCapturePlan(date, equatorialTarget, location, {
      minAltitudeDeg: 30,
      stepMinutes: 10,
    });
  }

  async deleteUserCapturePlan(userPlan: UserCapturePlan): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Plan Deletion',
      message: 'Do you really want to delete this capture plan? All information for this plan will be permanently removed.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { },
        },
        {
          text: 'Yes',
          role: 'confirm',
          handler: (plan: any) => {
            this.userCapturePlanService.delete(userPlan.id);
            this.loadUserPlans();
          },
        },
      ],
    });

    await alert.present();
  }
}
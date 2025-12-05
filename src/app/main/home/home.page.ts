import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { LocationWidgetComponent } from 'src/app/shared/components/location-widget/location-widget.component';
import { TodayWidgetComponent } from './components/today-widget/today-widget.component';
import { UserCapturePlan } from 'src/app/core/models/user-capture-plan.model';
import { UserCapturePlanService } from 'src/app/core/services/user-capture-plan/user-capture-plan.service';
import { PlanCardComponent } from 'src/app/shared/components/plan-card/plan-card.component';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { TargetCardComponent } from 'src/app/shared/components/target-card/target-card.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CapturePlanContextService } from 'src/app/core/services/capture-plan-context/capture-plan-context.service';
import { AstroCoreService } from 'src/app/core/services/astro-core/astro-core-service';
import { CapturePlan, PlanningService } from 'src/app/core/services/planning/planning-service';
import { LocationService } from 'src/app/core/services/location/location.service';

interface NextPlanItem {
  plan: UserCapturePlan | undefined;
  target?: DeepSkyObject;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    LocationWidgetComponent,
    TodayWidgetComponent,
    PlanCardComponent,
    TargetCardComponent
  ],
})
export class HomePage {

  public nextPlan: NextPlanItem | undefined;
  public topTargets: DeepSkyObject[] = [];

  constructor(
    private router: Router,
    private userCapturePlanService: UserCapturePlanService,
    private catalogService: TargetCatalogService,
    private capturePlanContextService: CapturePlanContextService,
    private astroCoreService: AstroCoreService,
    private planningService: PlanningService,
    private locatonService: LocationService,
  ) { }

  ionViewWillEnter(): void {
    this.loadNextUserPlan();
    this.loadTopTargets();
  }

  loadNextUserPlan(): void {
    const userPlan = this.userCapturePlanService.getNext();
    if (userPlan) {
      this.nextPlan = {
        plan: userPlan,
        target: this.catalogService.getById(userPlan?.targetId)
      }
    }
  }

  loadTopTargets(): void {
    this.topTargets = this.catalogService.getAll().slice(0, 3);
  }

  openTarget(target: DeepSkyObject) {
    this.router.navigate(['/main/targets/details', target.id]);
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

  async goSkyConditions(): Promise<void> {
    const location = await this.locatonService.getCurrentLocation();
    const lat = location.latitude.toFixed(2);
    const lon = location.longitude.toFixed(2);

    window.open(
      `https://clearoutside.com/forecast/${lat}/${lon}`,
      '_blank'
    );
  }
}

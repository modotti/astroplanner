import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton, IonFooter, IonModal, ActionSheetController } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { DateLocationWidgetComponent } from 'src/app/shared/components/date-location-widget/date-location-widget.component';
import { TargetTileComponent } from './components/target-title/target-title.component';
import { TargetDataComponent } from './components/target-data/target-data.component';
import { MoonStatusComponent } from './components/moon-status/moon-status.component';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { UserLocation } from 'src/app/core/models/location.model';
import { LocationService } from 'src/app/core/services/location/location.service';
import { CapturePlan, PlanningService } from 'src/app/core/services/planning/planning-service';
import { AstroCoreService } from 'src/app/core/services/astro-core/astro-core-service';
import { MoonImpactComponent } from './components/moon-impact/moon-impact.component';
import { VisibilityWindowComponent } from './components/visibility-window/visibility-window.component';
import { CommonModule } from '@angular/common';
import { DateService } from 'src/app/core/services/date-service/date.service';
import { WeekDatePickerComponent } from 'src/app/shared/components/week-date-picker/week-date-picker.component';
import { TargetScoreService } from 'src/app/core/services/target-score/target-score-service';
import { CapturePlanContextService } from 'src/app/core/services/capture-plan-context/capture-plan-context.service';
import { UserCapturePlanService } from 'src/app/core/services/user-capture-plan/user-capture-plan.service';

@Component({
  selector: 'app-target-details',
  templateUrl: 'target-details.page.html',
  styleUrls: ['target-details.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonFooter,
    IonModal,
    DateLocationWidgetComponent,
    TargetTileComponent,
    TargetDataComponent,
    MoonStatusComponent,
    MoonImpactComponent,
    VisibilityWindowComponent,
    WeekDatePickerComponent
  ]
})
export class TargetDetailsPage {
  public target: DeepSkyObject | undefined;
  public date: Date = new Date(Date.now());
  public location: UserLocation | undefined;
  public plan: CapturePlan | undefined;

  public updatedScore: number = 0;

  isDateModalOpen = false;

  hasPlanForSession = false;
  planIdForSession?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private dateService: DateService,
    private targetCatalogService: TargetCatalogService,
    private locationService: LocationService,
    private planningService: PlanningService,
    private astroCoreService: AstroCoreService,
    private targetScoreService: TargetScoreService,
    private capturePlanContext: CapturePlanContextService,
    private userCapturePlanService: UserCapturePlanService,
  ) { }

  ionViewWillEnter(): void {
    this.dateService.resetDate();

    const targetId = this.route.snapshot.paramMap.get('id');
    if (targetId) {
      this.target = this.targetCatalogService.getById(targetId);
      this.loadPlan();
    }
  }

  async loadPlan(): Promise<void> {
    this.location = await this.locationService.getCurrentLocation();
    this.date = new Date(this.dateService.getDate());

    if (this.target && this.location) {
      const object = this.astroCoreService.mapObjectToTargetEquatorial(this.target, this.location);

      this.plan = this.planningService.getCapturePlan(this.date, object, this.location, {
        minAltitudeDeg: 30,
        stepMinutes: 10,
      });

      this.updatedScore = this.targetScoreService.computeScoreForTarget(this.target, this.date, this.location.latitude, this.location.longitude);
    }

    this.checkExistingPlanForSession();
  }

  async openLinks(target: DeepSkyObject | undefined) {
    if (!target) return;

    const name = `${target.familiarName}`;
    const googleTerm =
      target.type === 'Bright Star' ?
        `${target.familiarName} ${target.catalogueEntry} astronomy` :
        `${target.familiarName} ${target.id} astronomy`;
    const telescopiusTerm = target.catalogueEntry.replace(/\s+/g, '-');
    const stellariumTerm = target.id;

    const googleSearchQuery = encodeURIComponent(googleTerm);

    const searchGoogleButton = {
      text: 'Search on Google',
      handler: () => {
        window.open(
          `https://www.google.com/search?q=${googleSearchQuery}`,
          '_blank'
        );
      },
    };

    const imageGoogleButton = {
      text: 'Images on Google',
      handler: () => {
        window.open(
          `https://www.google.com/search?tbm=isch&q=${googleSearchQuery}`,
          '_blank'
        );
      },
    };

    const telescopiusButton = {
      text: 'Telescopius',
      handler: () => {
        window.open(
          `https://telescopius.com/deep-sky-objects/${telescopiusTerm}/`,
          '_blank'
        );
      },
    };

    const stellariumButton = {
      text: 'Stellarium',
      handler: () => {
        window.open(
          `https://stellarium-web.org/skysource/${stellariumTerm}`,
          '_blank'
        );
      },
    };

    const cancelButton = {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => { }
    };

    let buttons = [searchGoogleButton, imageGoogleButton];
    if (target.type !== 'Bright Star' && target.group !== 'Planet') {
      buttons.push(telescopiusButton);
    }
    buttons.push(stellariumButton);
    buttons.push(cancelButton);

    const actionSheet = await this.actionSheetCtrl.create({
      header: `Links for ${name}`,
      buttons,
    });

    await actionSheet.present();
  }

  likeTarget(target: DeepSkyObject) {
    target.liked = !target.liked;
    this.targetCatalogService.toggleLike(target.id);
  }

  get isBrightObject(): boolean {
    if (this.target) {
      return this.target.type === 'Bright Star' || ['venus', 'jupiter', 'saturn'].includes(this.target.id);
    }
    return false;
  }

  openDatePicker(): void {
    this.isDateModalOpen = true;
  }

  closeDatePicker(): void {
    this.isDateModalOpen = false;
  }

  onDatePicked(date: Date): void {
    this.dateService.setDate(date.toDateString());
    this.loadPlan();
    this.isDateModalOpen = false;
  }

  createNewPlan() {
    if (this.plan) {
      this.capturePlanContext.setPlan(this.plan);
      this.router.navigate(['/main/plans/new']);
    }
  }

  openPlan() {
    if (this.plan) {
      this.capturePlanContext.setPlan(this.plan);
      this.router.navigate([`/main/plans/${this.planIdForSession}`]);
    }
  }

  checkExistingPlanForSession() {
    if (this.plan?.targetId && this.location) {
      const existing = this.userCapturePlanService.findForSession(
        this.plan.targetId,
        this.date,
        this.location
      );

      this.hasPlanForSession = !!existing;
      this.planIdForSession = existing?.id;
    }
  }
}

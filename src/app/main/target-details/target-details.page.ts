import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton, IonFooter, ActionSheetController } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { DateLocationWidgetComponent } from 'src/app/shared/components/date-location-widget/date-location-widget.component';
import { TargetTileComponent } from './components/target-title/target-title.component';
import { TargetDataComponent } from './components/target-data/target-data.component';
import { MoonStatusComponent } from './components/moon-status/moon-status.component';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { UserLocation } from 'src/app/core/models/location.model';
import { LocationService } from 'src/app/core/services/location/location.service';
import { CapturePlan, PlanningService } from 'src/app/core/services/planning/planning-service';
import { AstroCoreService, TargetEquatorial } from 'src/app/core/services/astro-core/astro-core-service';
import { MoonImpactComponent } from './components/moon-impact/moon-impact.component';
import { VisibilityWindowComponent } from './components/visibility-window/visibility-window.component';

@Component({
  selector: 'app-target-details',
  templateUrl: 'target-details.page.html',
  styleUrls: ['target-details.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonFooter,
    DateLocationWidgetComponent,
    TargetTileComponent,
    TargetDataComponent,
    MoonStatusComponent,
    MoonImpactComponent,
    VisibilityWindowComponent
  ]
})
export class TargetDetailsPage implements OnInit {
  public target: DeepSkyObject | undefined;
  public date: Date = new Date(Date.now());
  public location: UserLocation | undefined;
  public plan: CapturePlan | undefined;

  constructor(
    private route: ActivatedRoute,
    private actionSheetCtrl: ActionSheetController,
    private targetCatalogService: TargetCatalogService,
    private locationService: LocationService,
    private planningService: PlanningService,
    private astroCoreService: AstroCoreService) { }

  async ngOnInit(): Promise<void> {
    const targetId = this.route.snapshot.paramMap.get('id');
    this.location = await this.locationService.getCurrentLocation();

    if (targetId) {
      this.target = this.targetCatalogService.getById(targetId);

      if (this.target) {
        const object = this.mapDsoToTargetEquatorial(this.target);
        this.plan = this.planningService.getCapturePlan(this.date, object, this.location, {
          minAltitudeDeg: 30,
          stepMinutes: 10,
        });
      }
    }
  }

  private mapDsoToTargetEquatorial(dso: DeepSkyObject): TargetEquatorial {
    const [raH, raM, raS] = dso.ra.split(' ').map(Number);
    const [decD, decM, decS] = dso.dec.split(' ').map(Number);

    return {
      name: dso.familiarName,
      raHours: this.astroCoreService.raHmsToHours(raH, raM, raS),
      decDegrees: this.astroCoreService.decDmsToDegrees(decD, decM, decS)
    };
  }

  async openLinks(target: DeepSkyObject | undefined) {
    if (!target) return;

    const name = `${target.familiarName}`;
    const googleTerm = `${target.familiarName} ${target.id} astronomy`;
    const googleSearchQuery = encodeURIComponent(googleTerm);
    const telescopiusTerm = target.catalogueEntry.replace(/\s+/g, '-');
    const stellariumTerm = target.id;

    const actionSheet = await this.actionSheetCtrl.create({
      header: `Links for ${name}`,
      buttons: [
        {
          text: 'Search on Google',
          handler: () => {
            window.open(
              `https://www.google.com/search?q=${googleSearchQuery}`,
              '_blank'
            );
          },
        },
        {
          text: 'Images on Google',
          handler: () => {
            window.open(
              `https://www.google.com/search?tbm=isch&q=${googleSearchQuery}`,
              '_blank'
            );
          },
        },
        {
          text: 'Telescopius',
          handler: () => {
            window.open(
              `https://telescopius.com/deep-sky-objects/${telescopiusTerm}/`,
              '_blank'
            );
          },
        },
        {
          text: 'Stellarium',
          handler: () => {
            window.open(
              `https://stellarium-web.org/skysource/${stellariumTerm}`,
              '_blank'
            );
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  likeTarget(target: DeepSkyObject) {
    target.liked = !target.liked;
    this.targetCatalogService.toggleLike(target.id);
  }
}

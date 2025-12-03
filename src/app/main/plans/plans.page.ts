import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-plans',
  templateUrl: 'plans.page.html',
  styleUrls: ['plans.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class PlansPage {
  constructor() {}
}

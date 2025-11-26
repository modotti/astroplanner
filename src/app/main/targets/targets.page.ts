import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-targets',
  templateUrl: 'targets.page.html',
  styleUrls: ['targets.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class TargetsPage {

  constructor() { }

}

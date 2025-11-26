import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { LocationWidgetComponent } from 'src/app/shared/components/location-widget/location-widget.component';
import { TodayWidgetComponent } from './components/today-widget/today-widget.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, LocationWidgetComponent, TodayWidgetComponent],
})
export class HomePage {
  constructor() { }
}

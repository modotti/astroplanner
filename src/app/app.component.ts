import { Component, ViewChild } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Platform, NavController } from '@ionic/angular';
import { TargetCatalogService } from './core/services/target-catalog/target-catalog.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent {
  @ViewChild(IonRouterOutlet, { static: true })
  routerOutlet!: IonRouterOutlet;


  constructor(
    targetCatalogService: TargetCatalogService,
    private platform: Platform,
    private navCtrl: NavController
  ) {
    document.body.classList.add('dark');

    this.platform.ready().then(() => {
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setBackgroundColor({ color: '#000000' });
      StatusBar.setStyle({ style: Style.Dark });
    });

    this.initializeApp();
  }

  private initializeApp(): void {
    this.platform.ready().then(() => {
      App.addListener('backButton', ({ canGoBack }) => {
        if (this.routerOutlet && this.routerOutlet.canGoBack()) {
          this.navCtrl.back();
        }
      });
    });
  }
}

import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TargetCatalogService } from './core/services/target-catalog/target-catalog.service';
import { AstroCoreService } from './core/services/astro-core/astro-core-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  providers: [AstroCoreService]
})
export class AppComponent {
  constructor(targetCatalogService: TargetCatalogService, astroCoreService: AstroCoreService) {
    document.body.classList.add('dark');


    setTimeout(() => {

      //Busca de target
      console.log('--------------------------------');
      console.log('--------- BUSCA ----------------');
      console.log('--------------------------------');

      const target = targetCatalogService.searchByName('1893')[0];
      console.log(target);


      //Dados target
      console.log('--------------------------------');
      console.log('--------- TARGET ---------------');
      console.log('--------------------------------');

      const location = {
        latitude: -22.59170,
        longitude: -50.42120,
        elevationMeters: 600,
      };

      const ra = target.ra.split(' ');
      const dec = target.dec.split(' ');
      const m42 = {
        name: target.familiarName,
        raHours: astroCoreService.raHmsToHours(+ra[0], +ra[1], +ra[2]),
        decDegrees: astroCoreService.decDmsToDegrees(+dec[0], +dec[1], +dec[2])
      };

      const now = new Date();
      const time = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        21, 0, 0
      );
      const position = astroCoreService.getTargetHorizontalPosition(m42, time, location);

      console.log('Altitude:', position.altitude);
      console.log('Azimute:', position.azimuth);
      console.log('Direção:', position.direction);

      //Curva target
      console.log('--------------------------------');
      console.log('--------- CURVA ----------------');
      console.log('--------------------------------');

      const start = new Date();
      start.setHours(18, 0, 0, 0);

      const end = new Date(start);
      end.setHours(6 + 24, 0, 0, 0); // passa da meia-noite

      const curve = astroCoreService.getTargetAltitudeCurve(
        m42,
        start,
        end,
        location,
        { stepMinutes: 60 }
      );

      console.table(curve); // primeiros 5 pontos

      //Dados do dia
      console.log('--------------------------------');
      console.log('--------- DADOS DO DIA ---------');
      console.log('--------------------------------');

      const today = new Date();
      const sky = astroCoreService.getDailySkyInfo(today, location);

      console.log('--- Lua ---');
      console.log('Fase:', sky.moon.phaseName);
      console.log('Iluminação:', sky.moon.illuminationPercent.toFixed(1) + '%');
      console.log('Nascer:', sky.moon.moonrise?.toLocaleTimeString() ?? '—');
      console.log('Pôr:', sky.moon.moonset?.toLocaleTimeString() ?? '—');

      console.log('--- Sol ---');
      console.log('Nascer:', sky.sun.sunrise?.toLocaleTimeString() ?? '—');
      console.log('Pôr:', sky.sun.sunset?.toLocaleTimeString() ?? '—');

    }, 100);

  }
}

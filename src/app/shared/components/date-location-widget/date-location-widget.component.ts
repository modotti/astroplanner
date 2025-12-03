import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UserLocation } from 'src/app/core/models/location.model';
import { LocationService } from 'src/app/core/services/location/location.service';

@Component({
  selector: 'app-date-location-widget',
  templateUrl: 'date-location-widget.component.html',
  styleUrls: ['date-location-widget.component.scss'],
  imports: [DecimalPipe, DatePipe, LowerCasePipe]
})
export class DateLocationWidgetComponent implements OnInit {
  @Input() date = new Date();

  location: UserLocation | null = null;

  constructor(private locationService: LocationService) { }

  async ngOnInit(): Promise<void> {
    this.location = await this.locationService.getCurrentLocation();
  }

  get latitude(): number | undefined {
    return this.location?.latitude
  }

  get longitude(): number | undefined {
    return this.location?.longitude
  }
}

import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UserLocation } from 'src/app/core/models/location.model';
import { LocationService } from 'src/app/core/services/location/location.service';

@Component({
  selector: 'app-location-widget',
  templateUrl: 'location-widget.component.html',
  styleUrls: ['location-widget.component.scss'],
  imports: [DecimalPipe]
})
export class LocationWidgetComponent implements OnInit {
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

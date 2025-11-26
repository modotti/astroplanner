import { Injectable } from '@angular/core';
import { UserLocation } from '../../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor() { }

  async getCurrentLocation(): Promise<UserLocation> {
    //TODO: Implementar busca dinamica de localização
    return {
      latitude: -22.7767097,
      longitude: -50.2119874
    }
  }
}
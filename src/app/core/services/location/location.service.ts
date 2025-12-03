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
      latitude: -22.651401,
      longitude: -50.416037
    }
  }
}
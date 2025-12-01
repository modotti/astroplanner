import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DeepSkyCatalog, DeepSkyObject } from '../../models/deep-sky-object.model';
import { TargetScoreService } from '../target-score/target-score-service';
import { LocationService } from '../location/location.service';

@Injectable({ providedIn: 'root' })
export class TargetCatalogService {
  private readonly CATALOG_URL = 'assets/catalog/deep-sky-catalog.json';

  private readonly catalogSignal = signal<DeepSkyCatalog | null>(null);

  readonly objects = computed<DeepSkyObject[]>(() => {
    const catalog = this.catalogSignal();
    if (!catalog) return [];

    const scores = this.targetScoreService.scores();

    return catalog.objects
      .map(obj => ({
        ...obj,
        score: scores[obj.id] ?? 0
      }))
      .sort((a, b) => b.score - a.score);
  });

  constructor(
    private http: HttpClient,
    private locationService: LocationService,
    private targetScoreService: TargetScoreService
  ) {
    this.loadLocalCatalog();
  }

  private loadLocalCatalog(): void {
    this.http.get<DeepSkyCatalog>(this.CATALOG_URL).subscribe({
      next: (catalog) => {
        this.catalogSignal.set(catalog);
        this.locationService.getCurrentLocation().then(location => {
          const lat = +location.latitude.toFixed(1);
          const lon = +location.longitude.toFixed(1);
          this.targetScoreService.initScoresForToday(catalog.objects, lat, lon);
        });
      },
      error: (err) => {
        console.error('Error loading local catalog', err);
        this.catalogSignal.set({ version: 1, source: 'empty', objects: [] });
      }
    });
  }

  getAll(): DeepSkyObject[] {
    return this.objects();
  }

  getById(id: string): DeepSkyObject | undefined {
    return this.objects().find((o) => o.id === id);
  }

  searchByName(term: string): DeepSkyObject[] {
    const lower = term.toLowerCase();
    return this.objects().filter((o) =>
      o.catalogueEntry.toLowerCase().includes(lower) ||
      o.familiarName?.toLowerCase().includes(lower) ||
      o.altNames.some((alt) => alt.toLowerCase().includes(lower))
    );
  }
}
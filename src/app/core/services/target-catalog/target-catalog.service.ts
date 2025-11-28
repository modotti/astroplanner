import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DeepSkyCatalog, DeepSkyObject } from '../../models/deep-sky-object.model';

@Injectable({ providedIn: 'root' })
export class TargetCatalogService {
  private readonly CATALOG_URL = 'assets/catalog/deep-sky-catalog.json';

  private readonly catalogSignal = signal<DeepSkyCatalog | null>(null);
  readonly objects = computed<DeepSkyObject[]>(() => this.catalogSignal()?.objects ?? []);

  constructor(private http: HttpClient) {
    this.loadLocalCatalog();
  }

  private loadLocalCatalog(): void {
    this.http.get<DeepSkyCatalog>(this.CATALOG_URL).subscribe({
      next: (catalog) => this.catalogSignal.set(catalog),
      error: (err) => {
        console.error('Error loading local catalog', err);
        this.catalogSignal.set({ version: 1, source: 'empty', objects: [] });
      }
    });
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
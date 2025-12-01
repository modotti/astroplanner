import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, NavController } from '@ionic/angular/standalone';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { TargetIconPipe } from '../pipes/target-icon.pipe';

@Component({
  selector: 'app-targets',
  templateUrl: 'targets.page.html',
  styleUrls: ['targets.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    TargetIconPipe]
})
export class TargetsPage {

  // Signals
  private allTargets = signal<DeepSkyObject[]>([]);
  searchTerm = signal('');

  // Lista já filtrada automaticamente
  filteredTargets = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.allTargets();

    if (!term) return list;

    return list.filter(t =>
      t.familiarName.toLowerCase().includes(term) ||
      t.catalogueEntry.toLowerCase().includes(term)
    );
  });

  constructor(
    private catalogService: TargetCatalogService,
    private navCtrl: NavController
  ) { }

  ngOnInit(): void {
    // Carregar catálogo
    this.allTargets.set(this.catalogService.getAll());
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value ?? '');
  }

  openTarget(target: DeepSkyObject) {
    this.navCtrl.navigateForward(['/main/target-details', target.id]);
  }
}

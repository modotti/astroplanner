import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  NavController,
  IonSelect,
  IonSelectOption,
  IonButton,
} from '@ionic/angular/standalone';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';
import { TargetCatalogService } from 'src/app/core/services/target-catalog/target-catalog.service';
import { TargetIconPipe } from '../pipes/target-icon.pipe';
import { TargetCardComponent } from 'src/app/shared/components/target-card/target-card.component';

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
    TargetIconPipe,
    IonSelect,
    IonSelectOption,
    IonButton,
    TargetCardComponent
  ]
})
export class TargetsPage {

  // Quantidade de itens exibidos por "página"
  private readonly PAGE_SIZE = 60;

  // Signals
  private allTargets = signal<DeepSkyObject[]>([]);
  searchTerm = signal('');
  selectedGroups = signal<string[]>([]);
  visibleCount = signal(this.PAGE_SIZE);

  // Filtro para exibir apenas favoritos (liked = true)
  showOnlyLiked = signal(false);

  private opened: DeepSkyObject | undefined;

  targetGroups = computed(() => {
    const groups = new Set<string>();

    for (const t of this.allTargets()) {
      if (t.group) {
        groups.add(t.group);
      }
    }

    return Array.from(groups).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
  });

  // Lista já filtrada automaticamente (texto + grupos + liked)
  filteredTargets = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const groups = this.selectedGroups();
    const likedOnly = this.showOnlyLiked();
    const list = this.allTargets();

    return list.filter(t => {
      const familiarName = (t.familiarName ?? '').toLowerCase();
      const catalogueEntry = (t.catalogueEntry ?? '').toLowerCase();

      const matchesText =
        !term ||
        familiarName.includes(term) ||
        catalogueEntry.includes(term);

      const matchesGroup =
        !groups.length || groups.includes(t.group);

      const matchesLiked =
        !likedOnly || !!t.liked;

      return matchesText && matchesGroup && matchesLiked;
    });
  });

  // Subconjunto realmente exibido (paginação)
  visibleTargets = computed(() => {
    const results = this.filteredTargets();
    return results.slice(0, this.visibleCount());
  });

  constructor(
    private catalogService: TargetCatalogService,
    private navCtrl: NavController
  ) { }

  ngOnInit(): void {
    // Carregar catálogo
    this.allTargets.set(this.catalogService.getAll());
  }

  ionViewWillEnter(): void {
    if (this.opened) {
      const updatedTarget = this.catalogService.getById(this.opened.id);
      if (!updatedTarget) return;

      this.allTargets.update(list =>
        list.map(t => t.id === updatedTarget.id ? updatedTarget : t)
      );
      this.opened = undefined;
    }
  }

  onSearch(event: any) {
    const value = event.detail?.value ?? event.target?.value ?? '';
    this.searchTerm.set(value);
    this.visibleCount.set(this.PAGE_SIZE);
  }

  onGroupsChange(event: any) {
    this.selectedGroups.set(event.detail?.value ?? []);
    this.visibleCount.set(this.PAGE_SIZE);
  }

  loadMore(): void {
    const total = this.filteredTargets().length;
    const next = this.visibleCount() + this.PAGE_SIZE;
    this.visibleCount.set(Math.min(next, total));
  }

  openTarget(target: DeepSkyObject) {
    this.opened = target;
    this.navCtrl.navigateForward(['/main/target-details', target.id]);
  }

  likeTarget(target: DeepSkyObject) {
    target.liked = !target.liked;
    this.catalogService.toggleLike(target.id);
    // opcional: se quiser refletir na lista de forma imutável:
    this.allTargets.update(list =>
      list.map(t => t.id === target.id ? { ...t, liked: target.liked } : t)
    );
  }

  toggleLikedFilter(): void {
    this.showOnlyLiked.update(v => !v);
    this.visibleCount.set(this.PAGE_SIZE);
  }
}
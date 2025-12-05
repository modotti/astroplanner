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
import { Router } from '@angular/router';

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

  // Chave do localStorage para filtros
  private readonly FILTER_STORAGE_KEY = 'ap_targets_filter';

  // Signals
  private allTargets = signal<DeepSkyObject[]>([]);
  searchTerm = signal('');
  selectedGroup = signal('');
  visibleCount = signal(this.PAGE_SIZE);

  // Filtro para exibir apenas favoritos (liked = true)
  showOnlyLiked = signal(false);

  private opened: DeepSkyObject | undefined;

  // Grupos disponíveis
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
    const groups = this.selectedGroup();
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
    private router: Router,
    private catalogService: TargetCatalogService,
  ) { }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  ngOnInit(): void {
    // Carregar catálogo
    this.allTargets.set(this.catalogService.getAll());

    // Restaurar filtros do localStorage
    this.loadFiltersFromStorage();
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

  // -------------------------------------------------------
  // Handlers
  // -------------------------------------------------------

  onSearch(event: any) {
    const value = event.detail?.value ?? event.target?.value ?? '';
    this.searchTerm.set(value);
    this.visibleCount.set(this.PAGE_SIZE);
  }

  onGroupsChange(event: any) {
    this.selectedGroup.set(event.detail?.value ?? []);
    this.visibleCount.set(this.PAGE_SIZE);
    this.saveFiltersToStorage();
  }

  toggleLikedFilter(): void {
    this.showOnlyLiked.update(v => !v);
    this.visibleCount.set(this.PAGE_SIZE);
    this.saveFiltersToStorage();
  }

  loadMore(): void {
    const total = this.filteredTargets().length;
    const next = this.visibleCount() + this.PAGE_SIZE;
    this.visibleCount.set(Math.min(next, total));
  }

  openTarget(target: DeepSkyObject) {
    this.opened = target;
    this.router.navigate(['/main/targets/details', target.id]);
  }

  likeTarget(target: DeepSkyObject) {
    target.liked = !target.liked;
    this.catalogService.toggleLike(target.id);

    // refletir na lista de forma imutável
    this.allTargets.update(list =>
      list.map(t => t.id === target.id ? { ...t, liked: target.liked } : t)
    );
  }

  // -------------------------------------------------------
  // Persistência de filtros
  // -------------------------------------------------------

  private saveFiltersToStorage(): void {
    try {
      const data = {
        group: this.selectedGroup(),
        likedOnly: this.showOnlyLiked()
      };
      localStorage.setItem(this.FILTER_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Erro ao salvar filtros de targets no localStorage', err);
    }
  }

  private loadFiltersFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.FILTER_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        group?: string;
        likedOnly?: boolean;
      };

      if (parsed.group) {
        this.selectedGroup.set(parsed.group);
      }

      if (typeof parsed.likedOnly === 'boolean') {
        this.showOnlyLiked.set(parsed.likedOnly);
      }

      // sempre que mudamos filtros, faz sentido resetar a paginação
      this.visibleCount.set(this.PAGE_SIZE);
    } catch (err) {
      console.warn('Erro ao restaurar filtros de targets do localStorage', err);
    }
  }
}
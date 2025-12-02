import { Injectable, computed, signal } from '@angular/core';
import { DeepSkyObject } from '../../models/deep-sky-object.model';

const STORAGE_KEY = 'astroplanner_liked_targets';

@Injectable({
  providedIn: 'root'
})
export class LikedTargetsService {

  /** Mantém só os IDs dos alvos curtidos */
  private readonly _likedIds = signal<Set<string>>(new Set<string>());

  /** Versão em array (caso queira usar num template, etc.) */
  readonly likedIds = computed(() => Array.from(this._likedIds()));

  constructor() {
    this.loadFromStorage();
  }

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as string[];
      this._likedIds.set(new Set(parsed));
    } catch (e) {
      console.warn('[LikedTargetsService] Error loading liked ids from storage', e);
    }
  }

  private saveToStorage(): void {
    try {
      const ids = Array.from(this._likedIds());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('[LikedTargetsService] Error saving liked ids to storage', e);
    }
  }

  // ---------------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------------

  /** Verifica se um alvo está curtido */
  isLiked(targetId: string): boolean {
    return this._likedIds().has(targetId);
  }

  /** Dá toggle no like de um alvo (pode receber ID ou o próprio objeto) */
  toggleLike(target: DeepSkyObject | string): void {
    const id = typeof target === 'string' ? target : target.id;

    const current = new Set(this._likedIds()); // cria nova instância pra signal reagir

    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }

    this._likedIds.set(current);
    this.saveToStorage();
  }

  /** Define explicitamente o estado de like de um alvo */
  setLiked(targetId: string, liked: boolean): void {
    const current = new Set(this._likedIds());

    if (liked) {
      current.add(targetId);
    } else {
      current.delete(targetId);
    }

    this._likedIds.set(current);
    this.saveToStorage();
  }

  /** Limpa todos os likes (caso você queira em configurações, etc.) */
  clearAll(): void {
    this._likedIds.set(new Set());
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // Integração com o catálogo
  // ---------------------------------------------------------------------------

  /**
   * Marca os alvos do catálogo com a propriedade `liked`
   * de acordo com o que está salvo no storage.
   *
   * Pode ser chamada sempre que você carregar/atualizar o catálogo.
   */
  applyLikesToTargets(targets: DeepSkyObject[]): DeepSkyObject[] {
    const likedIds = this._likedIds();

    return targets.map(t => ({
      ...t,
      liked: likedIds.has(t.id)
    }));
  }

  /**
   * Retorna somente os alvos curtidos, com base na lista completa.
   * Útil se você quiser uma aba "Favoritos".
   */
  getLikedTargets(allTargets: DeepSkyObject[]): DeepSkyObject[] {
    const likedIds = this._likedIds();
    return allTargets.filter(t => likedIds.has(t.id));
  }
}
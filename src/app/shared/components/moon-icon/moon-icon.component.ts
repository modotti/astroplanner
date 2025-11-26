import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

let nextId = 0;

@Component({
  selector: 'app-moon-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moon-icon.component.html',
  styleUrls: ['./moon-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoonIconComponent {
  /** Fração iluminada: 0 = nova, 1 = cheia */
  @Input() illumination = 0.3;

  /** true = waxing (crescente, luz à direita) / false = waning (minguante, luz à esquerda) */
  @Input() waxing = true;

  /** tamanho em px */
  @Input() size = 96;

  readonly radius = 50;
  readonly id = `moon-${nextId++}`;

  /** posição X do centro da sombra */
  get shadowCx(): number {
    const r = this.radius;
    const i = Math.min(Math.max(this.illumination, 0), 1); // clamp 0–1

    // deslocamento entre centros dos círculos (0 = nova, r = meia-lua, 2r = cheia)
    const d = 2 * r * i;

    // Waxing: sombra vai pra esquerda -> luz fica à direita
    // Waning: sombra vai pra direita -> luz fica à esquerda (minguante)
    return this.waxing ? r - d : r + d;
  }

  get clipId(): string {
    return `moon-clip-${this.id}`;
  }
}
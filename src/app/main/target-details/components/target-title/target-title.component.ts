import { Component, Input } from '@angular/core';
import { DeepSkyObject } from 'src/app/core/models/deep-sky-object.model';

@Component({
  selector: 'app-target-title',
  templateUrl: 'target-title.component.html',
  styleUrls: ['target-title.component.scss']
})
export class TargetTileComponent {
  @Input('target') target: DeepSkyObject | undefined;

  constructor() { }

  private readonly iconMap: Record<string, string> = {
    // Aglomerados
    'Open Cluster': 'open.svg',
    'Globular Cluster': 'globular.svg',

    // Galáxias
    'Galaxy': 'galaxy.svg',
    'Spiral Galaxy': 'galaxy.svg',
    'Elliptical Galaxy': 'galaxy.svg',
    'Group of Galaxies': 'galaxy.svg',
    'Irregular Galaxy': 'galaxy.svg',
    'Lenticular Galaxy': 'galaxy.svg',
    'Peculiar Galaxy': 'galaxy.svg',
    'Pulsar': 'galaxy.svg', //TODO

    // Nebulosas → todas caem no mesmo ícone
    'Nebula': 'nebula.svg',
    'Emission Nebula': 'nebula.svg',
    'Reflection Nebula': 'nebula.svg',
    'Dark Nebula': 'nebula.svg',
    'Planetary Nebula': 'nebula.svg',
    'HII Region': 'nebula.svg',
    'Interstellar Matter': 'nebula.svg', //TODO
    
    // Estrelas
    'Star': 'star.svg',
    'Supernova Remnant': 'star.svg', //TODO

    // Planetas
    'Planet': 'planet.svg',
    'Exoplanet': 'planet.svg',

    // Cometas
    'Comet': 'comet.svg'
  };

  getIconForType(type: string): string {
    return `assets/image/${this.iconMap[type] ?? 'open.svg'}`;
  }

  get catalogueEntry(): string {
    return this.target?.catalogueEntry || '';
  }

  get familiarName(): string {
    return this.target?.familiarName || '';
  }

  get type(): string {
    return this.target?.type || '';
  }
}

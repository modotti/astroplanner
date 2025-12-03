import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MoonImpactInfo } from 'src/app/core/services/planning/planning-service';

@Component({
  selector: 'app-moon-impact',
  templateUrl: 'moon-impact.component.html',
  styleUrls: ['moon-impact.component.scss'],
  imports: [DecimalPipe]
})
export class MoonImpactComponent implements OnInit {
  @Input('impact') impact: MoonImpactInfo | undefined;

  constructor() { }

  ngOnInit(): void { }

  get impactText(): string {
    return this.impact?.description ?? '';
  }
}

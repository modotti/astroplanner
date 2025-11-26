import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetsPage } from './targets.page';

describe('TargetsPage', () => {
  let component: TargetsPage;
  let fixture: ComponentFixture<TargetsPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TargetsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

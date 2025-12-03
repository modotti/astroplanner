import { Routes } from '@angular/router';

export const TARGETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./targets.page').then((m) => m.TargetsPage),
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./target-details/target-details.page').then((m) => m.TargetDetailsPage),
  },
];
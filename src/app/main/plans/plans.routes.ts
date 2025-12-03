import { Routes } from '@angular/router';

export const PLAN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./plans.page').then((m) => m.PlansPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./user-capture-plan/user-capture-plan.page').then(m => m.UserCapturePlanPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-capture-plan/user-capture-plan.page').then(m => m.UserCapturePlanPage),
  }
];
import { Routes } from '@angular/router';
import { MainPage } from './main.page';

export const routes: Routes = [
  {
    path: 'main',
    component: MainPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../main/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'targets',
        loadComponent: () =>
          import('../main/targets/targets.page').then((m) => m.TargetsPage),
      },
      {
        path: 'target-details/:id',
        loadComponent: () =>
          import('../main/target-details/target-details.page').then((m) => m.TargetDetailsPage),
      },
      {
        path: 'plans',
        loadChildren: () =>
          import('../main/plans/plans.routes').then(m => m.PLAN_ROUTES),
      },
      {
        path: '',
        redirectTo: '/main/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/main/home',
    pathMatch: 'full',
  },
];

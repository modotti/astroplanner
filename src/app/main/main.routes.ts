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
        path: 'tab3',
        loadComponent: () =>
          import('../main/tab3/tab3.page').then((m) => m.Tab3Page),
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

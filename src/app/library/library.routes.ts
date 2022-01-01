import { DeskRoute } from '../core/desk.route';

import { LibraryContextComponent } from './library-context.component';
import { LibraryItemViewComponent } from './library-item-view.component';
import { LibraryViewComponent } from './library.component';

export const libraryRoutes: DeskRoute[] = [
  {
    path: 'library',
    sideComponent: LibraryContextComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LibraryViewComponent,
      },
      {
        path: ':type',
        component: LibraryViewComponent,
      },
      {
        path: ':type/:scope',
        component: LibraryViewComponent,
      },
      {
        path: ':type/:scope/:itemId',
        component: LibraryItemViewComponent,
      },
    ],
  },
];

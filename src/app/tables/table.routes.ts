import { DeskRoute } from '../core/desk.route';
import { LibraryContextComponent } from '../library/library-context.component';

import { TableCreateComponent } from './table-create.component';
import { TableEditComponent } from './table-edit.component';
import { TableVersionListComponent } from './table-version-list.component';
import { ITable } from './table.interface';

export const tableRoutes: DeskRoute[] = [
  {
    path: 'library/tables/create',
    component: TableCreateComponent,
    sideComponent: LibraryContextComponent,
    data: { mode: ITable.EditMode.CREATE },
  },
  {
    path: 'library/tables/:scope/:itemId/edit',
    component: TableEditComponent,
    sideComponent: LibraryContextComponent,
    data: { mode: ITable.EditMode.EDIT },
  },
  {
    path: 'library/tables/:itemId/edit',
    component: TableEditComponent,
    sideComponent: LibraryContextComponent,
    data: { mode: ITable.EditMode.EDIT },
  },
  {
    path: 'library/tables/:itemId/versions',
    component: TableVersionListComponent,
    sideComponent: LibraryContextComponent,
  },
  {
    path: 'library/tables/:scope/:itemId/versions',
    component: TableVersionListComponent,
    sideComponent: LibraryContextComponent,
  },
];

// import { HasUnsavedDataGuard } from '../core/core.guards';
import { DeskRoute } from '../core/desk.route';

import { PmeApproverListComponent } from './pme-approver-list.component';
import { PmeContextComponent } from './pme-context.component';
import { PmeEditComponent } from './pme-edit.component';
import { PmeListComponent } from './pme-list.component';
import { PmeAgComponent } from './pme.ag.component';
import { QuotationCreateComponent } from './quotation-create.component';
import { QuotationDistributorCreateComponent } from './quotation-distributor-create.component';
import { QuotationFileComponent } from './quotation-file.component';
import { QuotationListComponent } from './quotation-list.component';

export const pmeRoutes: DeskRoute[] = [
  {
    path: 'pme',
    sideComponent: PmeContextComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'manage',
      },
      {
        path: 'manage',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: PmeAgComponent,
          },
          {
            path: 'ag',
            pathMatch: 'full',
            component: PmeListComponent,
          },
          {
            path: 'approver/list',
            component: PmeApproverListComponent,
            // canDeactivate: [HasUnsavedDataGuard],
          },
          {
            path: 'quotation/list',
            component: QuotationListComponent,
            // canDeactivate: [HasUnsavedDataGuard],
          },
          {
            path: 'quotation/create',
            component: QuotationCreateComponent,
            // canDeactivate: [HasUnsavedDataGuard],
          },
          {
            path: 'quotation/file',
            component: QuotationFileComponent,
          },
          {
            path: 'quotation/create-distributor',
            component: QuotationDistributorCreateComponent,
            // canDeactivate: [HasUnsavedDataGuard],
          },
        ],
      },
      {
        path: 'manage/:userId',
        component: PmeEditComponent,
        // canDeactivate: [HasUnsavedDataGuard],
      },
    ],
  },
];

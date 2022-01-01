import { HasUnsavedDataGuard } from '../core/core.guards';
import { DeskRoute } from '../core/desk.route';
import { IAsset } from '../core/interfaces/common.interface';

import { DCProjectCreateComponent } from './dc-project-create.component';
import { DcProjectFilesComponent } from './dc-project-files.component';
import { DcProjectPackagesComponent } from './dc-project-packages.component';
import { DCProjectViewComponent } from './dc-project-view.component';
import { DevelopContextComponent } from './develop-context.component';
import { PackagesListContainerComponent } from './packages-list-container.component';

export const developRoutes: DeskRoute[] = [
  {
    path: 'develop',
    sideComponent: DevelopContextComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'projects',
      },
      {
        path: 'projects',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'create',
          },
          {
            path: 'create',
            component: DCProjectCreateComponent,
          },
          {
            path: ':projectId',
            component: DCProjectViewComponent,
          },
          {
            path: ':projectId/files',
            component: DcProjectFilesComponent,
            canDeactivate: [HasUnsavedDataGuard],
          },
          {
            path: ':projectId/packages',
            component: DcProjectPackagesComponent,
          },
        ],
      },
      {
        path: 'packages',
        component: PackagesListContainerComponent,
      },
    ],
  },
];

export const developModuleAssetURLMap = {
  [IAsset.Type.DC_PROJECT]: ['/desk', 'develop', 'projects'],
};

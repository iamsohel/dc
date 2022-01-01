import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import config from '../config';
import { CoreUIModule } from '../core-ui/core-ui.module';
import { CoreModule } from '../core/core.module';
import { ASSET_BASE_ROUTE, IAsset } from '../core/interfaces/common.interface';
import { IEvent } from '../core/services/event.service';
import { LIBRARY_SECTIONS, LibrarySectionDefinition } from '../library/library.interface';

import { BinaryViewerComponent } from './binary-viewer.component';
import { BuildDcProjectModalComponent } from './build-dc-project-modal.component';
import { CodeEditorComponent } from './code-editor.component';
import { DCProjectCreateComponent } from './dc-project-create.component';
import { DcProjectFilesComponent } from './dc-project-files.component';
import { DcProjectPackagesComponent } from './dc-project-packages.component';
import { DCProjectSessionComponent } from './dc-project-session.component';
import { DCProjectViewComponent } from './dc-project-view.component';
import { IDCProject } from './dc-project.interfaces';
import { DCProjectService } from './dc-project.service';
import { DevelopContextComponent } from './develop-context.component';
import { developModuleAssetURLMap } from './develop.routes';
import { ImageViewerComponent } from './image-viewer.component';
import { NotebookViewerComponent } from './notebook-viewer.component';
import { PackageDetailsModalComponent } from './package-details-modal.component';
import { PackageOperationsComponent } from './package-operations.component';
import { PackageOperatorsListComponent } from './package-operators-list.component';
import { PackagePrimitivesListComponent } from './package-primitives-list.component';
import { PackageService } from './package.service';
import { PackagesListContainerComponent } from './packages-list-container.component';
import { PackagesListComponent } from './packages-list.component';
import { PublishDcProjectModalComponent } from './publish-dc-project-modal.component';

@NgModule({
  imports: [
    RouterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    // deep cortex modules
    CoreModule,
    CoreUIModule,
  ],
  declarations: [
    DevelopContextComponent,
    DCProjectCreateComponent,
    DCProjectViewComponent,
    DCProjectSessionComponent,
    PackagesListComponent,
    PackageOperationsComponent,
    PackagesListContainerComponent,
    DcProjectFilesComponent,
    DcProjectPackagesComponent,
    PackageDetailsModalComponent,
    PackageOperatorsListComponent,
    PackagePrimitivesListComponent,
    PackagesListComponent,
    PublishDcProjectModalComponent,
    BuildDcProjectModalComponent,
    NotebookViewerComponent,
    ImageViewerComponent,
    CodeEditorComponent,
    BinaryViewerComponent,
  ],
  entryComponents: [
    PublishDcProjectModalComponent,
    BuildDcProjectModalComponent,
  ],
})
export class DevelopModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: DevelopModule,
      providers: [
        DCProjectService,
        PackageService,
        {
          provide: LIBRARY_SECTIONS,
          deps: [DCProjectService],
          useFactory: (service: DCProjectService): LibrarySectionDefinition<IDCProject> => {
            return {
              service,
              assetType: IAsset.Type.DC_PROJECT,
              icon: 'glyphicon glyphicon-picture',
              inProjects: true,
              actions: {
                'files': {
                  name: 'Files',
                  iconClass: 'imgaction imgaction-files',
                },
                'packages': {
                  name: 'Packages',
                  iconClass: 'imgaction imgaction-packages',
                },
              },
              baseRoute: ['/desk', 'develop', 'projects'],
              reloadOn: IEvent.Type.UPDATE_DC_PROJECT_LIST,
              statusesDefinition: config.dcProject.status,
              completeStatus: IDCProject.Status.IDLE, // should be updated when the new statuses are added
              columns: [
                {name: 'Name', get: (_: IDCProject) => _.name, style: 'width: 12%'},
              ],
              selectorColumns: [
                {name: 'Name', get: (_: IDCProject) => _.name, style: 'width: 12%'},
              ],
              sharable: false,
              sidebarActions: [
                {
                  caption: 'Create DC Project',
                  navigateTo: ['/desk', 'develop', 'projects', 'create'],
                },
              ],
              bulkOperations: [
                {
                  name: 'Build',
                  iconClass: 'imgaction imgaction-build',
                  isAvailable: (items) => service.isBuildingAvailable(items),
                  modalClass: BuildDcProjectModalComponent,
                },
                {
                  name: 'Publish',
                  iconClass: 'imgaction imgaction-publish',
                  isAvailable: (items) => service.isPublishingAvailable(items),
                  modalClass: PublishDcProjectModalComponent,
                },
              ],
            };
          },
          multi: true,
        },
        {
          provide: ASSET_BASE_ROUTE,
          useValue: developModuleAssetURLMap,
          multi: true,
        },
      ],
    };
  }
}

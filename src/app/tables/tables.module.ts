import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AgGridModule} from '@ag-grid-community/angular';

import config from '../config';
import { CoreModule } from '../core/core.module';
import { IAsset } from '../core/interfaces/common.interface';
import { Feature } from '../core/interfaces/feature-toggle.interface';
import { IEvent } from '../core/services/event.service';
import { LIBRARY_SECTIONS, LibrarySectionDefinition } from '../library/library.interface';

import { TableColumnHistogramDirective } from './table-column-histogram.directive';
import { TableCreateComponent } from './table-create.component';
import { TableEditComponent } from './table-edit.component';
import { TableHeaderTooltipComponent } from './table-header-tooltip.component';
import { TableItemDeleteModalComponent } from './table-item-delete-modal.component';
import { TableScatterPlotMatrixComponent } from './table-scatter-plot-matrix.component';
import { TableSetColumnNameModalComponent } from './table-set-column-name-modal.component';
import { TableUploadModalComponent } from './table-upload-modal.component';
import { TableVersionListComponent } from './table-version-list.component';
import { TableViewEmbeddableComponent } from './table-view-embed.component';
import { TableViewComponent } from './table-view.component';
import { ITable } from './table.interface';
import { TableService } from './table.service';
import { TableColumnDisplayNamePipe, TableColumnSelectOptionsPipe, TableNumberTitlePipe } from './tables.pipes';

@NgModule({
  imports: [
    RouterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    // deep cortex modules
    CoreModule,
    AgGridModule.withComponents([TableHeaderTooltipComponent]),
  ],
  declarations: [
    // Components
    TableViewComponent,
    TableViewEmbeddableComponent,
    TableUploadModalComponent,
    TableScatterPlotMatrixComponent,
    TableEditComponent,
    TableSetColumnNameModalComponent,
    TableItemDeleteModalComponent,
    TableCreateComponent,
    TableVersionListComponent,
    TableHeaderTooltipComponent,
    // Directives
    TableColumnHistogramDirective,
    // Pipes
    TableColumnSelectOptionsPipe,
    TableColumnDisplayNamePipe,
    TableNumberTitlePipe,
  ],
  exports: [
    // Components
    TableViewEmbeddableComponent,
    // Pipes
    TableColumnSelectOptionsPipe,
    TableColumnDisplayNamePipe,
    TableNumberTitlePipe,
  ],
  entryComponents: [
    TableViewComponent,
    TableUploadModalComponent,
  ],
})
export class TablesModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: TablesModule,
      providers: [
        TableService,
        {
          provide: LIBRARY_SECTIONS,
          deps: [TableService],
          useFactory: (service: TableService): LibrarySectionDefinition<ITable> => {
            return {
              service,
              assetType: IAsset.Type.TABLE,
              icon: 'iconapp iconapp-tables',
              inProjects: true,
              actions: {},
              reloadOn: IEvent.Type.UPDATE_TABLE_LIST,
              statusesDefinition: config.table.status,
              completeStatus: ITable.Status.ACTIVE,
              features: [Feature.TABLES_MODULE],
              columns: [
                { name: 'Type', get: (_: ITable) => config.table.datasetType.labels[_.datasetType], style: 'width: 12%' },
              ],
              sharable: true,
              viewComponent: TableViewComponent,
              sidebarActions: [
                {
                  caption: 'Create Table',
                  navigateTo: ['/desk', 'library', 'tables', 'create'],
                },
                {
                  caption: 'Import Table',
                  modalClass: TableUploadModalComponent,
                },
              ],
            };
          },
          multi: true,
        },
      ],
    };
  }
}

// Features
declare module '../core/interfaces/feature-toggle.interface' {
  export const enum Feature {
    TABLES_MODULE = 'TABLES_MODULE',
    UPLOAD_TABLE = 'UPLOAD_TABLE',
  }
}

import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { CoreUIModule } from '../core-ui/core-ui.module';
import { CoreModule } from '../core/core.module';
import { CUSTOM_COMPONENTS_INJECTOR_TOKEN } from '../pipelines/custom-components/custom-component.service';
import { TablesModule } from '../tables/tables.module';
import { VisualizeModule } from '../visualize/visualize.module';

import { InspectionSelectorComponent } from './inspection-selector.component';
import { TableInspectionComponent } from './table-inspection.component';
import { TableInspectionChartBasicsComponent } from './table-inspection/chart-basics.component';
import { TableInspectionChartViewComponent } from './table-inspection/chart-view.component';
import { TableInspectionTableViewComponent } from './table-inspection/table-view.component';

@NgModule({
  imports: [
    RouterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    // deepcortex modules
    CoreModule,
    CoreUIModule,
    TablesModule,
    VisualizeModule,
  ],
  declarations: [
    TableInspectionComponent,
    TableInspectionTableViewComponent,
    TableInspectionChartViewComponent,
    TableInspectionChartBasicsComponent,
    InspectionSelectorComponent,
  ],
  entryComponents: [
    TableInspectionComponent,
    InspectionSelectorComponent,
  ],
  providers: [
  ],
})
export class CustomComponentsModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CustomComponentsModule,
      providers: [
        {
          provide: CUSTOM_COMPONENTS_INJECTOR_TOKEN,
          useValue: {
            name: 'deepcortex-tabular-eda',
            component: TableInspectionComponent,
          },
          multi: true,
        },
        {
          provide: CUSTOM_COMPONENTS_INJECTOR_TOKEN,
          useValue: {
            name: 'deepcortex-inspection-selector',
            component: InspectionSelectorComponent,
          },
          multi: true,
        },
      ],
    };
  }
}

import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import * as _ from 'lodash';

import { maybe } from '../../lib/maybe';
import { AlbumsModule } from '../albums/albums.module';
import config from '../config';
import { CoreUIModule } from '../core-ui/core-ui.module';
import { PluralizePipe } from '../core-ui/core-ui.pipes';
import { CoreModule } from '../core/core.module';
import { IAsset } from '../core/interfaces/common.interface';
import { IEvent } from '../core/services/event.service';
import { EXPERIMENT_TYPES, ExperimentType, ExperimentTypeDefinition } from '../experiments/experiment.interfaces';
import { ExperimentService } from '../experiments/experiment.service';
import { ExperimentsModule } from '../experiments/experiments.module';
import { LIBRARY_SECTIONS, LibrarySectionDefinition } from '../library/library.interface';
import { TablesModule } from '../tables/tables.module';
import { TrainModule } from '../train/train.module';
import { VisualizeModule } from '../visualize/visualize.module';

import { CanvasContextComponent } from './canvas-context.component';
import { PipelineCanvasUpgradeButtonComponent } from './canvas-upgrade-button.component';
import { CanvasComponent } from './canvas.component';
import { CustomComponentService } from './custom-components/custom-component.service';
import { CustomEdaComponent } from './custom-eda.component';
import { CustomOperatorParamsComponent } from './custom-operator-params.component';
import { CustomParameterValueControlComponent } from './custom-parameter-value-control.component';
import { OperatorInfoModalComponent } from './operator-info-modal.component';
import { OperatorParamsComponent } from './operator-params.component';
import { PipelineOperatorPositioningService } from './operator-positioning.service';
import { PipelineContextComponent } from './pipeline-context.component';
import { PipelineCreateComponent } from './pipeline-create.component';
import { PipelineExperimentCreateComponent } from './pipeline-experiment-create.component';
import { PipelineExperimentInteractiveContextComponent } from './pipeline-experiment-interactive-context.component';
import { PipelineExperimentInteractiveComponent } from './pipeline-experiment-interactive.component';
import { PipelineExperimentStepResultComponent } from './pipeline-experiment-step-result.component';
import { PipelineExperimentViewResultComponent } from './pipeline-experiment-view-result.component';
import { PipelineExperimentViewComponent } from './pipeline-experiment-view.component';
import { PipelineRunModalComponent } from './pipeline-run-modal.component';
import { PipelineComponent } from './pipeline.component';
import { IGenericExperiment, Pipeline } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';
import { SideOperatorsListComponent } from './side-operators-list.component';
import { TableSummarySaveButtonComponent } from './table-summary-save-button.component';
import { TableSummaryComponent } from './table-summary.component';

@NgModule({
  imports: [
    RouterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    // deep cortex modules
    CoreModule,
    CoreUIModule,
    TablesModule,
    AlbumsModule,
    TrainModule,
    ExperimentsModule,
    VisualizeModule,
  ],
  declarations: [
    PipelineComponent,
    CanvasComponent,
    PipelineCreateComponent,
    PipelineContextComponent,
    CanvasContextComponent,
    PipelineExperimentInteractiveContextComponent,
    SideOperatorsListComponent,
    PipelineExperimentCreateComponent,
    PipelineExperimentInteractiveComponent,
    PipelineExperimentViewComponent,
    PipelineRunModalComponent,
    OperatorInfoModalComponent,
    OperatorParamsComponent,
    CustomOperatorParamsComponent,
    CustomParameterValueControlComponent,
    CustomEdaComponent,
    TableSummaryComponent,
    TableSummarySaveButtonComponent,
    PipelineExperimentStepResultComponent,
    PipelineExperimentViewResultComponent,
    PipelineCanvasUpgradeButtonComponent,
  ],
  entryComponents: [
    PipelineExperimentCreateComponent,
    PipelineExperimentInteractiveComponent,
    PipelineExperimentInteractiveContextComponent,
    PipelineExperimentViewComponent,
    PipelineRunModalComponent,
  ],
  exports: [],
})
export class PipelineModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PipelineModule,
      providers: [
        PipelineService,
        PluralizePipe,
        PipelineOperatorPositioningService,
        CustomComponentService,
        {
          provide: EXPERIMENT_TYPES,
          useFactory: (): ExperimentTypeDefinition => {
            return {
              type: ExperimentType.GenericExperiment,
              name: 'Generic Experiment',
              allowExecutionTarget: true,
              pipelineComponent: PipelineExperimentCreateComponent,
              resultComponent: PipelineExperimentViewComponent,
              resultComponentHandlesErrors: true,
              interactive: {
                mainComponent: PipelineExperimentInteractiveComponent,
                sideComponent: PipelineExperimentInteractiveContextComponent,
              },
              features: [],
            };
          },
          multi: true,
        },
        {
          provide: LIBRARY_SECTIONS,
          deps: [PipelineService],
          useFactory: (service: PipelineService): LibrarySectionDefinition<Pipeline> => {
            return {
              service,
              assetType: IAsset.Type.PIPELINE,
              icon: 'glyphicon glyphicon-random',
              inProjects: true,
              actions: {
              },
              baseRoute: ['/desk', 'pipelines'],
              reloadOn: IEvent.Type.UPDATE_PIPELINE_LIST,
              statusesDefinition: config.pipeline.status,
              completeStatus: null,
              columns: [
              ],
              selectorColumns: [
              ],
              sharable: false,
              sidebarActions: [
                {
                  caption: 'Create Pipeline',
                  navigateTo: ['/desk', 'pipelines'],
                },
              ],
              bulkOperations: [
                {
                  name: 'Run',
                  iconClass: 'glyphicon glyphicon-play',
                  isAvailable: (items) => items.length === 1,
                  modalClass: PipelineRunModalComponent,
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

ExperimentService.registerChildAssetsExtractor(ExperimentType.GenericExperiment, experiment => {
  const pipeline = <IGenericExperiment.Pipeline> experiment.pipeline;
  const result = maybe(<IGenericExperiment.Result> experiment.result);

  return [
    ...(pipeline.assets || []),
    ...(result.map(res => _.flatten(res.steps.map(step => {
      return [...step.assets];
    }))).get() || []),
  ];
});

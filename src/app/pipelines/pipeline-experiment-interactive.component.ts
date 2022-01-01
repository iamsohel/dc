import { Component, EventEmitter, HostBinding, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { IExperimentResultView } from '../experiments/experiment-result.component';
import {
  ExperimentType,
  IExperiment,
  IExperimentAdditionalAction,
  IExperimentFull,
} from '../experiments/experiment.interfaces';
import { ExperimentService } from '../experiments/experiment.service';
import { ReactiveLoader } from '../utils/reactive-loader';

import { InteractiveExperiment } from './experiment-interactive-session.class';
import { IGenericExperiment, Pipeline, PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

@Component({
  selector: 'pipeline-experiment-interactive',
  template: `
    <app-tabs [tabs]="['Pipeline', 'Results']" [(active)]="_activeTab"></app-tabs>
    <div class="flex-static" [hidden]="_activeTab !== 0">
      <div class="panel">
        <div class="panel-body">
          <app-spinner [visibility]="loader.active | async"></app-spinner>
          <app-pipeline-canvas
            *ngIf="loader.loaded"
            [isEditMode]="true"
            [steps]="experiment.pipeline.steps"
            [availableOperators]="_operators"
            [interactiveSession]="_session"
            (canvasUpdated)="_updatePipeline($event)"
          ></app-pipeline-canvas>
        </div>
      </div>
    </div>
    <div class="flex-static" [hidden]="_activeTab !== 1">
      <div class="panel">
        <div class="panel-body">
          <pipeline-experiment-view-result
            *ngIf="(_session && _session.pipelineResult | async) as result"
            [pipeline]="{ steps: _pipelineSteps, assets: [] }"
            [result]="result"
            [operators]="_operators"
          ></pipeline-experiment-view-result>
        </div>
      </div>
    </div>
  `,
})
export class PipelineExperimentInteractiveComponent
  implements IExperimentResultView<IGenericExperiment.Pipeline, IGenericExperiment.Result>, OnDestroy {
  @HostBinding('class') _cssClass = 'app-spinner-box';
  public experimentActions: EventEmitter<IExperimentAdditionalAction[]> = new EventEmitter();

  protected _pipelineSteps: Pipeline.Step[];
  protected _operators: PipelineOperator[] = [];
  private _experiment: IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result>;
  private _process: IProcess = null;
  private subscription = new Subscription();
  private loader: ReactiveLoader<PipelineOperator[], TObjectId>;
  private _session: InteractiveExperiment.Session;
  private _activeTab: number = 0;

  constructor(
    private pipelineService: PipelineService,
    private experimentService: ExperimentService,
  ) {
    this.loader = new ReactiveLoader(experimentId => {
      return this.pipelineService.listAllOperators().shareReplay(1);
    });
    this.subscription.add(this.loader.subscribe((operators) => {
      this._operators = operators;
    }));
  }

  public get experiment(): IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result> {
    return this._experiment;
  }

  public set experiment(experiment: IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result>) {
    this.loader.load(experiment.id);
    this._openNewInteractiveSession(experiment, this._process);
    this._experiment = experiment;
    this._pipelineSteps = experiment.pipeline.steps;
  }

  public set process(process: IProcess) {
    this._openNewInteractiveSession(this._experiment, process);
    this._process = process;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this._closeExistingInteractiveSession();
  }

  private _openNewInteractiveSession(
    experiment?: IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result>,
    process?: IProcess,
  ) {
    if (!process || !experiment || !this._experiment || (this._experiment.id !== experiment.id)) {
      this._closeExistingInteractiveSession();
    }
    if (!this._session && process && experiment) {
      this._session = this.experimentService.connectInteractive(experiment.id, process);
    }
  }

  private _closeExistingInteractiveSession() {
    if (this._session) {
      this._session.close();
      this._session = null;
    }
  }

  private _updatePipeline(steps: Pipeline.StepInfo[]) {
    if (this._experiment && this._experiment.status === IExperiment.Status.RUNNING && this._experiment.isInteractive) {
      this._pipelineSteps = steps;
      this.experimentService.updatePipeline(this.experiment.id, {
        type: ExperimentType.GenericExperiment,
        pipeline: {steps},
      });
    }
  }
}

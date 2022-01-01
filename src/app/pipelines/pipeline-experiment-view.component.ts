import { Component, OnDestroy } from '@angular/core';

import { forkJoin } from 'rxjs/observable/forkJoin';
import { Subscription } from 'rxjs/Subscription';

import { IAsset, TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { ProcessService } from '../core/services/process.service';
import { IExperimentResultView } from '../experiments/experiment-result.component';
import { IExperiment, IExperimentFull } from '../experiments/experiment.interfaces';
import { ExperimentService } from '../experiments/experiment.service';
import { ReactiveLoader } from '../utils/reactive-loader';

import { InteractiveExperiment } from './experiment-interactive-session.class';
import { IGenericExperiment, PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

@Component({
  selector: 'pipeline-experiment-view',
  template: `
    <ng-template #inProgress>
      <process-indicator
        [process]="process"
      ></process-indicator>
    </ng-template>
    <ng-container *ngIf="experiment.status !== '${IExperiment.Status.RUNNING}' || _session?.connected else inProgress">
      <app-tabs [tabs]="['Pipeline', 'Results']" [(active)]="activeTab"></app-tabs>
      <div class="flex-static" [hidden]="activeTab !== 0">
        <div class="panel">
          <div class="panel-body">
            <app-spinner [visibility]="_loader.active | async"></app-spinner>
            <app-pipeline-canvas
              *ngIf="_loader.loaded"
              [steps]="experiment.pipeline.steps"
              [availableOperators]="availableOperators"
              [result]="experiment.result || null"
              [interactiveSession]="_session"
              [selectedAssets]="experiment.pipeline.assets"
              [pipelineEditor]="false"
            ></app-pipeline-canvas>
          </div>
        </div>
      </div>
      <div class="flex-static" [hidden]="activeTab !== 1">
        <ng-template #noResults>
          <div class="alert alert-warning">No results to display</div>
        </ng-template>
        <div class="panel">
          <div class="panel-body" [ngSwitch]="experiment.status">
            <error-indicator
              *ngSwitchCase="'${IExperiment.Status.ERROR}'"
              caption="Failed"
              message="This experiment failed"
            ></error-indicator>
            <error-indicator
              *ngSwitchCase="'${IExperiment.Status.CANCELLED}'"
              [caption]="'Cancelled'"
              [message]="'This experiment has been cancelled'"
            ></error-indicator>
            <ng-container *ngIf="!!_session || !!experiment.result else noResults">
              <pipeline-experiment-view-result
                *ngIf="!!_session ? (_session.pipelineResult | async) : experiment.result as result"
                [result]="result"
                [operators]="availableOperators"
                [pipeline]="experiment.pipeline"
              ></pipeline-experiment-view-result>
            </ng-container>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class PipelineExperimentViewComponent
  implements IExperimentResultView<IGenericExperiment.Pipeline, IGenericExperiment.Result>, OnDestroy {
  protected _experiment: IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result>;
  protected activeTab: number = 0;
  protected availableOperators: PipelineOperator[] = [];
  protected experimentProcess: IProcess = null;
  protected readonly _loader: ReactiveLoader<[PipelineOperator[], IProcess], TObjectId>;
  private _subscriptions: Subscription[] = [];
  private _session: InteractiveExperiment.Session;

  constructor(
    private _pipelineService: PipelineService,
    private _experimentService: ExperimentService,
    private _processService: ProcessService,
  ) {
    const operators$ = this._pipelineService.listAllOperators().shareReplay(1);
    this._loader = new ReactiveLoader((experimentId: TObjectId) => {
      return forkJoin(
        operators$,
        this._processService.getByTarget(experimentId, IAsset.Type.EXPERIMENT),
      );
    });
    const loaderSubscription = this._loader.subscribe(
      ([operators, process]: [PipelineOperator[], IProcess]) => {
        this.experimentProcess = process;
        this.availableOperators = operators;
        if (this.experiment.status === IExperiment.Status.RUNNING) {
          this._openNewInteractiveSession(this.experiment, this.experimentProcess);
        }
      },
    );
    this._subscriptions.push(loaderSubscription);
  }

  public get experiment(): IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result> {
    return this._experiment;
  }

  public set experiment(experiment: IExperimentFull<IGenericExperiment.Pipeline, IGenericExperiment.Result>) {
    this._closeExistingInteractiveSession();
    this._loader.load(experiment.id);
    this._experiment = experiment;
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(_ => _.unsubscribe());
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
      this._session = this._experimentService.connectInteractive(experiment.id, process);
    }
  }

  private _closeExistingInteractiveSession() {
    if (this._session) {
      this._session.close();
      this._session = null;
    }
  }
}

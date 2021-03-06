import { Component, HostBinding, Inject, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Dictionary, keyBy } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { IAsset, TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { ProcessService } from '../core/services/process.service';
import { ActivityObserver } from '../utils/activity-observer';
import { AppFormGroup } from '../utils/forms';
import { ReactiveLoader } from '../utils/reactive-loader';

import {
  EXPERIMENT_TYPES,
  ExperimentTypeDefinition,
  IExperiment,
  IExperimentAdditionalAction,
  IExperimentFull,
} from './experiment.interfaces';
import { ExperimentService } from './experiment.service';

@Component({
  selector: 'experiment-view',
  template: `
    <app-spinner [visibility]="_experimentLoader.active | async"></app-spinner>
    <asset-operations
      [type]="config.asset.values.EXPERIMENT"
      [selectedItems]="[experiment]"
      (onDelete)="onExperimentDeleted()"
    ></asset-operations>
    <ng-container *ngIf="experiment">
      <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit()">
        <div class="row">
          <div class="col-md-6">
            <app-input [label]="'Experiment Name'" [control]="form.controls.name"></app-input>
          </div>
          <div class="col-md-6">
            <div class="pull-right">
              <ng-container *ngIf="_experimentActions">
                <button
                  *ngFor="let action of _experimentActions"
                  type="button"
                  class="btn btn-md btn-success"
                  [disabled]="action.disabled"
                  (click)="action.action()"
                  style="margin-right: 5px;"
                >
                  {{action.title}}
                </button>
              </ng-container>
              <button
                type="submit"
                class="btn btn-md btn-success"
                [disabled]="!form.valid || (isSaving$ | async)"
              >
                Save
              </button>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <app-description [control]="form.controls.description"></app-description>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <app-input
              [label]="'Type'"
              [value]="types[experiment.type]?.name"
              [disabled]="true"
            ></app-input>
          </div>
        </div>
      </form>
      <ng-template #processInProgress>
        <experiment-result
          [withInteractivity]="_withInteractivity"
          [type]="experiment.type"
          [experiment]="experiment"
          [process]="experimentProcess"
          (availableActions)="_experimentActions = $event"
        ></experiment-result>
      </ng-template>
      <ng-template #resultsWithErrorsView>
        <experiment-result
          [type]="experiment.type"
          [experiment]="experiment"
          [process]="experimentProcess"
        ></experiment-result>
      </ng-template>
      <ng-container *ngIf="experiment.status !== '${IExperiment.Status.RUNNING}' else processInProgress">
        <ng-container *ngIf="!types[experiment.type]?.resultComponentHandlesErrors else resultsWithErrorsView">
          <ng-container [ngSwitch]="experiment.status">
            <error-indicator
              *ngSwitchCase="'${IExperiment.Status.CANCELLED}'"
              [caption]="'Cancelled'"
              [message]="'This experiment has been cancelled'"
            ></error-indicator>
            <error-indicator
              *ngSwitchCase="'${IExperiment.Status.ERROR}'"
              [process]="experimentProcess"
            ></error-indicator>
            <experiment-result
              *ngSwitchCase="'${IExperiment.Status.COMPLETED}'"
              [type]="experiment.type"
              [experiment]="experiment"
            ></experiment-result>
          </ng-container>
        </ng-container>
      </ng-container>
    </ng-container>
  `,
})
export class ExperimentViewComponent implements OnDestroy {
  @HostBinding('class') _cssClass = 'app-spinner-box';

  config = config;
  experiment: IExperimentFull;
  form: AppFormGroup<{
    name: FormControl;
    description: FormControl;
  }>;

  experimentProcess: IProcess;

  readonly types: Dictionary<ExperimentTypeDefinition>;

  private _experimentActions: IExperimentAdditionalAction[] = [];
  private _subscription = new Subscription();
  private processSubscription: Subscription;

  private readonly _withInteractivity: boolean;
  private readonly _experimentLoader: ReactiveLoader<IExperimentFull, TObjectId>;
  private readonly _savingObserver: ActivityObserver = new ActivityObserver();

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _experimentService: ExperimentService,
    private _eventService: EventService,
    private _processService: ProcessService,
    @Inject(EXPERIMENT_TYPES) typeDefinitions: ExperimentTypeDefinition[],
  ) {
    this._experimentLoader = new ReactiveLoader(experimentId => this._experimentService.get(experimentId));
    this.types = keyBy(typeDefinitions, _ => _.type);

    this._subscription.add(this._eventService.subscribe((event: IEvent) => {
      if (event.type === IEvent.Type.DELETE_EXPERIMENT && this.experiment && this.experiment.id === event.data.id) {
        this.onExperimentDeleted();
      }
    }));
    this._withInteractivity = this._router.url.endsWith('interactive');
    this._subscription.add(this._experimentLoader.subscribe(experiment => {
      this.experiment = experiment;
      if (this._withInteractivity && (experiment.status !== IExperiment.Status.RUNNING || !experiment.isInteractive)) {
        this._router.navigate(['/desk', 'experiments', experiment.id]);
        return;
      }
      this._createForm();
      this.processSubscription && this.processSubscription.unsubscribe();
      this.processSubscription = this._experimentService.getActiveProcess(experiment)
        .do(process => {
          this.experimentProcess = process; // processService will update this process object status
        })
        .filter(_ => !!_)
        .flatMap(process => {
          return this._processService.observe(process);
        })
        .subscribe(() => {
          this._experimentLoader.load(experiment.id);
        });
      if (experiment.status === IExperiment.Status.ERROR) {
        this._processService.getByTarget(experiment.id, IAsset.Type.EXPERIMENT).subscribe( process => {
          this.experimentProcess = process;
        });
      }
    }));

    this._subscription.add(this._route.params.subscribe((params) => {
      const experimentId = params['experimentId'];
      if (experimentId) {
        this._experimentActions = [];
        this._experimentLoader.load(experimentId);
      } else {
        this._router.navigate(['/desk', 'experiments', 'create']);
      }
    }));
  }

  get isSaving$(): Observable<boolean> {
    return this._savingObserver.active;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  onExperimentDeleted(): void {
    this._router.navigate(['/desk', 'experiments', 'create']);
  }

  onSubmit(): void {
    const { name, description } = this.form.value;
    this._savingObserver.observe(this._experimentService.update(this.experiment.id, { name, description }))
      .subscribe(experiment => {
        this._experimentLoader.load(this.experiment.id);
      });
  }

  private _createForm(): void {
    this.form = new AppFormGroup({
      name: new FormControl(this.experiment.name, Validators.required),
      description: new FormControl(this.experiment.description),
    });
  }
}

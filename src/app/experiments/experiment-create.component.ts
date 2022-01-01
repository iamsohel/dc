import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { FeatureToggleService } from '../core/services/feature-toggle.service';
import { ActivityObserver } from '../utils/activity-observer';
import { AppFormGroup } from '../utils/forms';
import { AppValidators } from '../utils/validators';

import { ExperimentPipelineComponent } from './experiment-pipeline.component';
import {
  EXPERIMENT_TYPES,
  ExperimentType,
  ExperimentTypeDefinition,
  IExperimentFull,
} from './experiment.interfaces';
import { ExperimentService } from './experiment.service';

export type ExperimentCreateForm =  AppFormGroup<{
  name: FormControl;
  description: FormControl;
  serviceId: FormControl;
  targetId: FormControl;
  type: FormControl;
  isInteractive: FormControl;
  useGpu: FormControl;
}>;

@Component({
  selector: 'experiment-create',
  template: `
    <asset-operations [type]="config.asset.values.EXPERIMENT" [selectedItems]="[]"></asset-operations>
    <form [formGroup]="form" (ngSubmit)="isFormsValid && onSubmit()">
      <div class="row">
        <div class="col-md-6">
          <app-input [label]="'Experiment Name'" [control]="form.controls.name"></app-input>
        </div>
        <div class="col-md-6">
          <div class="pull-right">
            <button
              type="submit"
              class="btn btn-md btn-success"
              [disabled]="!isFormsValid || (isSaving$ | async)"
            >
              Create
            </button>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <app-description [control]="form.controls.description" [editMode]="true"></app-description>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <app-select
            [label]="'Experiment Type'"
            [control]="form.controls.type"
            [options]="typeOptions"
          ></app-select>
        </div>
        <div class="col-md-2" *ngIf="form.controls.isInteractive.enabled">
          <app-check
            [label]="'Run interactively'"
            [control]="form.controls.isInteractive"
          ></app-check>
        </div>
        <div class="col-md-2" *ngIf="form.controls.useGpu.enabled">
          <app-check
            [label]="'Run using GPU'"
            [control]="form.controls.useGpu"
          ></app-check>
        </div>
      </div>
      <div class="row" *ngIf="_showExecutionTarget | call: form.controls.type.value: enabledTypeDefinitions">
        <div class="col-md-6">
          <execution-target-selector
            label="Execute on"
            [serviceIdControl]="form.controls.serviceId"
            [targetIdControl]="form.controls.targetId"
          ></execution-target-selector>
        </div>
      </div>
      <experiment-pipeline
        #experimentPipelineComponent
        [type]="form.controls.type.value"
        [experimentCreateForm]="form"
        (validityChange)="isPipelineValid = $event"
      ></experiment-pipeline>
    </form>
  `,
})
export class ExperimentCreateComponent implements OnDestroy {
  @ViewChild('experimentPipelineComponent') pipelineComponent: ExperimentPipelineComponent;
  form: ExperimentCreateForm;
  enabledTypeDefinitions: ExperimentTypeDefinition[];
  typeOptions: AppSelectOptionData[];

  isPipelineValid: boolean = false;

  config = config;

  private _subscription = new Subscription();
  private readonly _savingObserver: ActivityObserver = new ActivityObserver();

  constructor(
    private _router: Router,
    private _experimentService: ExperimentService,
    featureService: FeatureToggleService,
    @Inject(EXPERIMENT_TYPES) typeDefinitions: ExperimentTypeDefinition[],
  ) {
    this.enabledTypeDefinitions = typeDefinitions
      .filter(_ => !!_.pipelineComponent)
      .filter(_ => featureService.areFeaturesEnabled(_.features));
    this.typeOptions = this.enabledTypeDefinitions
      .map(typeDefinition => ({
        id: typeDefinition.type,
        text: typeDefinition.name,
      }));
    this._createForm();
  }

  get isSaving$(): Observable<boolean> {
    return this._savingObserver.active;
  }

  get isFormsValid(): boolean {
    return this.form.valid && this.isPipelineValid;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  onSubmit(): void {
    this._subscription.add(
      this._savingObserver
        .observe(this._save())
        .do(experiment => this._router.navigate(this._experimentViewRoute(experiment)))
        .subscribe(),
    );
  }

  private _experimentViewRoute(experiment: IExperimentFull): string[] {
    if (experiment.type === ExperimentType.GenericExperiment && experiment.isInteractive) {
      return ['/desk', 'experiments', experiment.id, 'interactive'];
    }
    return ['/desk', 'experiments', experiment.id];
  }

  private _createForm(): void {
    this.form = new AppFormGroup({
      name: new FormControl(null, Validators.required),
      description: new FormControl(null),
      serviceId: new FormControl(null),
      targetId: new FormControl(null),
      type: new FormControl(this.typeOptions.length === 1 ? this.typeOptions[0].id : null, Validators.required),
      isInteractive: new FormControl(false),
      useGpu: new FormControl(false),
    });
    this.form.controls.isInteractive.disable();
    this.form.controls.useGpu.disable();
    this._subscription.add(AppValidators.crossValidate(
      this.form.controls.type,
      [this.form.controls.isInteractive, this.form.controls.useGpu],
      (type: ExperimentType) => {
        const definition = this.enabledTypeDefinitions.find(_ => _.type === type);
        return definition && definition.interactive ? Validators.required : Validators.nullValidator;
      },
      (type: ExperimentType) => {
        const definition = this.enabledTypeDefinitions.find(_ => _.type === type);
        return !!(definition && definition.interactive);
      },
    ));
    this._subscription.add(AppValidators.crossValidate(
      this.form.controls.type,
      [this.form.controls.serviceId, this.form.controls.targetId],
      (type: ExperimentType) => Validators.nullValidator,
      (type: ExperimentType) => {
        const definition = this.enabledTypeDefinitions.find(_ => _.type === type);
        return !!(definition && definition.allowExecutionTarget);
      },
    ));
  }

  private _showExecutionTarget(type: ExperimentType, definitions: ExperimentTypeDefinition[]): boolean {
    const definition = definitions.find(_ => _.type === type);
    return !!(definition && definition.allowExecutionTarget);
  }

  private _save(): Observable<IExperimentFull> {
    return this.pipelineComponent.getPipeline()
      .pipe(
        mergeMap(pipeline => this._experimentService.create({ ...this.form.value, pipeline: pipeline })),
      );
  }
}

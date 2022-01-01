import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { Subscription } from 'rxjs/Subscription';

import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';
import { TObjectId } from '../core/interfaces/common.interface';
import { ParameterDefinition, ParameterValues } from '../core/interfaces/params.interface';
import { ExperimentType, IExperimentFull } from '../experiments/experiment.interfaces';
import { ExperimentService } from '../experiments/experiment.service';
import { ActivityObserver } from '../utils/activity-observer';
import { AppFormGroup } from '../utils/forms';

import { getPipelineParameters } from './pipeline.helpers';
import { IGenericExperiment, Pipeline, PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

@Component({
  selector: 'pipeline-run-modal',
  template: `
    <app-modal #modal
      [captionPrefix]="'Run pipeline'"
      [caption]="pipeline?.name"
      [buttons]="[
        { id: 'isInteractive', class: 'run-interactively-checkbox', title: 'Run interactively', checkbox: true, checked: form.controls.isInteractive.value },
        { id: 'useGpu', class: 'use-gpu-checkbox', title: 'Run using GPU', checkbox: true, checked: form.controls.useGpu.value },
        { id: 'run', class: 'btn-apply', disabled: form.invalid || (isSaving$ | async), title: 'Run' },
        { id: 'cancel', class: 'btn-clear', title: 'Cancel' }
      ]"
      (buttonClick)="onButtonClick($event)">
      <app-spinner [visibility]="!pipeline || (isSaving$ | async)"></app-spinner>
      <ng-container *ngIf="pipeline">
        <form [formGroup]="form">
          <div class="form-group">
            <app-input
              [label]="'Experiment Name'"
              [control]="form.controls.name">
            </app-input>
          </div>
          <div class="form-group">
            <app-input
              [label]="'Description'"
              [control]="form.controls.description">
            </app-input>
          </div>
          <div class="form-group">
            <execution-target-selector
              label="Execute on"
              [serviceIdControl]="form.controls.serviceId"
              [targetIdControl]="form.controls.targetId"
            ></execution-target-selector>
          </div>
          <div class="form-group" *ngFor="let stepId of (pipelineParameters | keys)">
            <ng-container *ngVar="(pipeline | apply: _getStepById: stepId) as step">
              <pipeline-operator-params
                *ngIf="pipelineParameters[stepId].length"
                [parameters]="pipelineParameters[stepId]"
                [partial]="true"
                [operator]="step.operator | apply: _getOperatorById: operators"
                [step]="step"
                [value]="step.params"
                (valueChange)="updateStepParams(step, $event)"
              ></pipeline-operator-params>
            </ng-container>
          </div>
        </form>
      </ng-container>
    </app-modal>
  `,
})
export class PipelineRunModalComponent implements OnDestroy {
  @ViewChild('modal') modal: ModalComponent;

  form: AppFormGroup<{
    name: FormControl,
    description: FormControl,
    serviceId: FormControl,
    targetId: FormControl,
    isInteractive: FormControl,
    useGpu: FormControl,
  }>;
  pipeline: Pipeline;
  operators: PipelineOperator[] = null;
  pipelineParameters: {[stepId: string]: ParameterDefinition[]} = {};
  private _subscription = new Subscription();
  private readonly _savingObserver: ActivityObserver = new ActivityObserver();

  constructor(
    private _pipelineService: PipelineService,
    private _experimentService: ExperimentService,
    private _router: Router,
  ) {
    this.form = new AppFormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl(''),
      serviceId: new FormControl(null),
      targetId: new FormControl(null),
      isInteractive: new FormControl(false),
      useGpu: new FormControl(false),
    });
  }

  get isSaving$(): Observable<boolean> {
    return this._savingObserver.active;
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  open(pipelines: Pipeline[]): Observable<void> {
    if (pipelines.length !== 1) {
      throw new Error('Something went wrong');
    }

    this.pipeline = null;
    this.form.reset({
      name: '',
      description: '',
      serviceId: null,
      targetId: null,
      isInteractive: false,
      useGpu: false,
    });

    const pipeline = pipelines[0];

    const pipeline$ = pipeline.steps ? of(_.clone(pipeline)) : this._pipelineService.get(pipeline.id);
    const operators$ = this._pipelineService.listAllOperators();

    this._subscription.add(
      forkJoin(pipeline$, operators$).subscribe(
        ([pipeline, operators]) => {
          this.operators = operators;
          this.pipeline = pipeline;
          this.pipelineParameters = getPipelineParameters(pipeline, operators);
        },
      ),
    );

    return this.modal.show();
  }

  updateStepParams(step: Pipeline.Step, values: Partial<ParameterValues>): void {
    _.extend(step.params, values);
  }

  onButtonClick(button: IModalButton): void {
    if (button.id === 'run') {
      if (this.form.valid && this.pipeline) {
        this._subscription.add(
          this._savingObserver
            .observe(this._save())
            .do((experiment: IExperimentFull) => {
              this.modal.hide();
              const redirectRoute = ['/desk', 'experiments', experiment.id];
              if (experiment.isInteractive) {
                redirectRoute.push('interactive');
              }
              // wait until modal hided
              setTimeout(() => this._router.navigate(redirectRoute), 500);
            })
            .subscribe(),
        );
      }
    } else if (button.id === 'isInteractive') {
      this.form.controls.isInteractive.setValue(button.checked);
    } else if (button.id === 'useGpu') {
      this.form.controls.useGpu.setValue(button.checked);
    } else if (button.id === 'cancel') {
      this.modal.hide();
    }
  }

  private _getStepById(pipeline: Pipeline, stepId: string): Pipeline.StepInfo {
    return pipeline.steps.find(_ => _.id === stepId);
  }

  private _getOperatorById(operatorId: TObjectId, operators: PipelineOperator[]): PipelineOperator {
    return operators.find(_ => _.id === operatorId);
  }

  private _save(): Observable<IExperimentFull> {
    return this._experimentService.create({
      ...this.form.value,
      type: ExperimentType.GenericExperiment,
      pipeline: <IGenericExperiment.Pipeline> {
        steps: this.pipeline.steps.map(step => {
          const stepOperator = this._getOperatorById(step.operator, this.operators);
          if (!stepOperator) {
            throw Error('Unknown operator in step ' + step.id);
          }
          const availableParams = stepOperator.params
            .filter(param => this._pipelineService.isParameterAvailable(param, step.params))
            .map(param => param.name);

          return {
            ...step,
            params: _.pick(step.params, ...availableParams),
          };
        }),
      },
    });
  }
}

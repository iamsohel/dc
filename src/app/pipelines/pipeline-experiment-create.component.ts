import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';
import { LibrarySelectorValue } from '../core/components/library-selector.component';
import { IAsset, TObjectId } from '../core/interfaces/common.interface';
import { ParameterDefinition, ParameterValues } from '../core/interfaces/params.interface';
import { ExperimentCreateForm } from '../experiments/experiment-create.component';
import { IExperimentPipelineForm } from '../experiments/experiment-pipeline.component';
import { AppFormGroup } from '../utils/forms';
import { ReactiveLoader } from '../utils/reactive-loader';

import { getPipelineParameters } from './pipeline.helpers';
import { IGenericExperiment, Pipeline, PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

@Component({
  selector: 'pipeline-experiment-create',
  template: `
    <app-modal
      #pipelineParametersModal
      [captionPrefix]="'Run pipeline'"
      [caption]="pipeline?.name"
      [buttons]="[
        { id: 'ok', title: 'Create', class: 'btn-apply', disabled: !_areAllPipelineParametersValid },
        { id: 'cancel', title: 'Cancel', class: 'btn-clear' }
      ]"
      (buttonClick)="_onModalClick($event)"
    >
      <app-spinner [visibility]="initialDataLoader.active | async"></app-spinner>
      <div class="row" *ngIf="pipeline && initialDataLoader.loaded">
        <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <div class="form-group" *ngFor="let stepId of (_pipelineParameters | keys)">
            <ng-container *ngVar="(pipeline | apply: _getStepById: stepId) as step">
              <pipeline-operator-params
                *ngIf="_pipelineParameters[stepId].length"
                [parameters]="_pipelineParameters[stepId]"
                [partial]="true"
                [operator]="step.operator | apply: _getOperatorById: operators"
                [step]="step"
                [value]="step.params"
                (valueChange)="_updateStepParams(step, $event)"
                (validityChange)="_updateStepParamsValidity(step, $event)"
              ></pipeline-operator-params>
            </ng-container>
          </div>
        </div>
      </div>
    </app-modal>
    <div class="app-spinner-box">
      <div class="row">
        <div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
          <library-selector
            inputLabel="Template pipeline"
            caption="Select experiment template pipeline"
            [available]="[AssetTypes.PIPELINE]"
            [allowReset]="true"
            (valueChange)="_setPipeline($event)"
          ></library-selector>
        </div>
      </div>
      <app-spinner [visibility]="initialDataLoader.active | async"></app-spinner>
      <div class="row" *ngIf="pipeline && initialDataLoader.loaded">
        <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          <app-pipeline-canvas
            [isEditMode]="false"
            [steps]="pipelineSteps"
            [availableOperators]="operators"
            [pipelineEditor]="false"
            [interactiveSession]="null"
          ></app-pipeline-canvas>
        </div>
      </div>
    </div>
  `,
})
export class PipelineExperimentCreateComponent
  implements IExperimentPipelineForm<IGenericExperiment.Pipeline>, OnDestroy, OnInit {
  @Input() experimentCreateForm: ExperimentCreateForm;
  @Output() validityChange = new EventEmitter<boolean>();
  @ViewChild('pipelineParametersModal') pipelineParametersModal: ModalComponent;

  readonly AssetTypes = IAsset.Type;
  readonly config = config;

  readonly form: AppFormGroup<{
    steps: FormControl,
  }>;
  private readonly initialDataLoader: ReactiveLoader<PipelineOperator[], void>;
  private operators: PipelineOperator[] = null;
  private pipeline: Pipeline = null;
  private pipelineSteps: Pipeline.StepInfo[] = [];
  private _pipelineParameters: {[stepId: string]: ParameterDefinition[]} = {};
  private _pipelineParametersValidity: {[stepId: string]: boolean} = {};
  private _areAllPipelineParametersValid: boolean = true;
  private subscriptions: Subscription[] = [];
  private _isInteractive: boolean = false;
  private getPipeline$: Subject<IGenericExperiment.Pipeline> = null;

  constructor(
    private pipelineService: PipelineService,
  ) {
    this.initialDataLoader = new ReactiveLoader(() => this.pipelineService.listAllOperators());
    this.initialDataLoader.subscribe(operators => {
      this.operators = operators;
    });

    this.form = new AppFormGroup({
      steps: new FormControl([]),
    });

    this.initialDataLoader.load();

    this.subscriptions.push(this.form.statusChanges.subscribe(() => {
      this.validityChange.emit(this.form.valid);
    }));
  }

  ngOnInit(): void {
    this.subscriptions.push(this.experimentCreateForm.controls.isInteractive.valueChanges.subscribe(
      value => {
        this._isInteractive = value;
        this.form.controls.steps.setValidators(value ? Validators.nullValidator : Validators.required);
        this.form.controls.steps.updateValueAndValidity();
      },
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(_ => _.unsubscribe());
  }

  getPipeline(): Observable<IGenericExperiment.Pipeline> {
    if (this._havePipelineParams(this._pipelineParameters)) {
      if (!this.getPipeline$) {
        this.getPipeline$ = new Subject<IGenericExperiment.Pipeline>();
        this.pipelineParametersModal.show().subscribe(() => {
          this.getPipeline$.complete();
          this.getPipeline$ = null;
        });
      }
      return this.getPipeline$;
    }
    return of(this.form.value);
  }

  private _setPipeline(value: LibrarySelectorValue) {
    if (value) {
      this.pipeline = value.object as Pipeline;
      this.pipelineSteps = this.pipeline.steps;
      this._pipelineParameters = getPipelineParameters(this.pipeline, this.operators);
    } else {
      this.pipeline = null;
      this.pipelineSteps = [];
      this._pipelineParameters = {};
    }
    this._pipelineParametersValidity = {};
    Object.keys(this._pipelineParameters).forEach(stepId => {
      this._pipelineParametersValidity[stepId] = !this._pipelineParameters[stepId].length;
    });
    this._areAllPipelineParametersValid = Object.values(this._pipelineParametersValidity).every(_ => _);
    this.form.controls.steps.setValue(this._exportPipelineSteps());
  }

  private _updateStepParams(step: Pipeline.Step, values: Partial<ParameterValues>) {
    _.extend(step.params, values);
    this.form.controls.steps.setValue(this._exportPipelineSteps());
  }

  private _updateStepParamsValidity(step: Pipeline.Step, validity: boolean) {
    if (step.id in this._pipelineParametersValidity) {
      this._pipelineParametersValidity[step.id] = validity;
      this._areAllPipelineParametersValid = Object.values(this._pipelineParametersValidity).every(_ => _);
    }
  }

  private _getStepById(pipeline: Pipeline, stepId: string): Pipeline.StepInfo {
    return pipeline.steps.find(_ => _.id === stepId);
  }

  private _getOperatorById(operatorId: TObjectId, operators: PipelineOperator[]): PipelineOperator {
    return operators.find(_ => _.id === operatorId);
  }

  private _exportPipelineSteps(): Pipeline.Step[] {
    return this.pipelineSteps.map(step => {
      const stepOperator = this._getOperatorById(step.operator, this.operators);
      if (!stepOperator) {
        throw Error('Unknown operator in step ' + step.id);
      }
      const availableParams = stepOperator.params
        .filter(param => this.pipelineService.isParameterAvailable(param, step.params))
        .map(param => param.name);
      return {
        ...step,
        params: _.pick(step.params, ...availableParams),
      };
    });
  }

  private _havePipelineParams(p: {[stepId: string]: ParameterDefinition[]}): boolean {
    return Object.keys(p).reduce((acc, stepId) => acc + p[stepId].length, 0) > 0;
  }

  private _onModalClick(btn: IModalButton) {
    if (this.getPipeline$) {
      if (btn.id === 'ok') {
        this.getPipeline$.next(this.form.value);
      }
    }
    this.pipelineParametersModal.hide();
  }
}

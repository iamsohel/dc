import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ValidatorFn } from '@angular/forms';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { concat } from 'rxjs/observable/concat';
import { merge } from 'rxjs/observable/merge';
import { of } from 'rxjs/observable/of';
import { delay } from 'rxjs/operators/delay';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { ParameterValueControlComponent } from '../core/components/parameter-value-control.component';
import { ParameterDefinition, ParameterValueType, ParameterValues } from '../core/interfaces/params.interface';

import { CustomComponent } from './custom-components/custom-component.interfaces';
import { Pipeline, PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

@Component({
  selector: 'pipeline-operator-params',
  template: `
    <pipeline-custom-operator-params
      *ngIf="operator.customComponent && !partial"
      [componentData]="operator.customComponent"
      [operator]="operator"
      [step]="step"
      [invoker]="interactiveInspectionInvoker"
      [directInvoker]="interactiveDirectInspectionInvoker"
      [values]="inputValue"
      [disabled]="disabled"
      (valuesChange)="valueChange.next($event)"
      (validityChange)="validityChange.next($event)"
    ></pipeline-custom-operator-params>
    <ng-container *ngIf="(!operator.customComponent || partial) && !pipelineParametersEnabled">
      <div
        *ngFor="let parameter of parameters | filter: _isParameterVisible: _value: pipelineParameters"
        class="parameter" [ngClass]="{'pipeline-controls': pipelineParametersEnabled}"
      >
        <div class="parameter-control" *ngVar="form.controls[parameter.name] as control">
          <custom-parameter-value-control
            *ngIf="parameter.customComponent"
            [componentData]="parameter.customComponent"
            [parameter]="parameter"
            [operator]="operator"
            [step]="step"
            [invoker]="interactiveInspectionInvoker"
            [directInvoker]="interactiveDirectInspectionInvoker"
            [values]="inputValue"
            [value]="inputValue[parameter.name]"
            [disabled]="control.disabled"
            (valueChange)="_updateControlValue(parameter, $event)"
          ></custom-parameter-value-control>
          <parameter-value-control
            *ngIf="!parameter.customComponent"
            [parameter]="parameter"
            [control]="control"
          ></parameter-value-control>
        </div>
      </div>
    </ng-container>
    <ng-container *ngIf="(!operator.customComponent || partial) && pipelineParametersEnabled">
      <div class="row">
        <div class="col-md-6 col-md-offset-6">
          <app-check
            [(checked)]="definePipelineParameters" (checkedChange)="_toggleDefinePipelineParameters($event)"
            [disabled]="disabled"
            [helpText]="'Values for parameters marked as _Pipeline parameters_ are not required ' +
              'while constructing the pipeline and can be set later for each pipeline run'"
            label="Define Pipeline Parameters"
          ></app-check>
        </div>
      </div>
      <div
        *ngFor="let parameter of parameters | filter: _isParameterVisible: _value: pipelineParameters"
        class="row row-flex dropdown-overflow-fix"
      >
        <div *ngVar="form.controls[parameter.name] as control"
          [ngClass]="definePipelineParameters ? 'col-md-6' : 'col-md-12'" style="transition: width 0.3s">
          <custom-parameter-value-control
            *ngIf="parameter.customComponent"
            [componentData]="parameter.customComponent"
            [parameter]="parameter"
            [operator]="operator"
            [invoker]="interactiveInspectionInvoker"
            [directInvoker]="interactiveDirectInspectionInvoker"
            [step]="step"
            [values]="inputValue"
            [disabled]="control.disabled"
            [value]="inputValue[parameter.name]"
            (valueChange)="_updateControlValue(parameter, $event)"
          ></custom-parameter-value-control>
          <parameter-value-control
            *ngIf="!parameter.customComponent"
            [parameter]="parameter"
            [control]="control"
          ></parameter-value-control>
        </div>
        <ng-container *ngIf="definePipelineParameters">
          <div class="col-md-1">
            <app-check
              [checked]="parameter.name | apply: _isPipelineParameter: pipelineParameters"
              (checkedChange)="_togglePipelineParameter(parameter, $event)"
              [disabled]="disabled"
            ></app-check>
          </div>
          <div
            class="col-md-5"
          >
            <app-input
              label="Name"
              [type]="'text'"
              [disabled]="disabled || !(parameter.name | apply: _isPipelineParameter: pipelineParameters)"
              [value]="pipelineParameters ? pipelineParameters[parameter.name] : ''"
              (valueChange)="pipelineParameters[parameter.name] = $event"
            ></app-input>
          </div>
        </ng-container>
      </div>
    </ng-container>
    <ng-container *ngIf="!operator.customComponent && operator.customEdaComponents && !partial">
      <custom-eda
        *ngFor="let customEdaComponent of operator.customEdaComponents"
        [componentData]="customEdaComponent"
        [operator]="operator"
        [step]="step"
        [values]="inputValue"
        [invoker]="interactiveInspectionInvoker"
        [disabled]="disabled"
        [directInvoker]="interactiveDirectInspectionInvoker"
      ></custom-eda>
    </ng-container>
  `,
})
export class OperatorParamsComponent implements OnDestroy, OnChanges {
  config = config;

  @Input() operator: PipelineOperator = null;
  @Input() step: Pipeline.Step = null;
  @Input() parameters: PipelineOperator.OperatorParameterDefinition[]; // parameter definitions
  @Input('value') inputValue: ParameterValues = {}; // parameter values
  @Input() disabled: boolean = false;
  @Input() pipelineParameters: Pipeline.PipelineParameters = null;
  @Input() interactiveInspectionInvoker: CustomComponent.InspectionInvoker = null;
  @Input() interactiveDirectInspectionInvoker: CustomComponent.DirectInspectionInvoker = null;
  @Input() partial: boolean = false;
  @Output() valueChange = new EventEmitter<ParameterValues>();
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() pipelineParametersChange = new EventEmitter<Pipeline.PipelineParameters>();

  collapsed: boolean = false;
  form: FormGroup;

  protected definePipelineParameters: boolean = false;
  protected pipelineParametersEnabled: boolean = false;
  protected _value: ParameterValues = {};
  private formSubscriptions: Subscription[] = [];
  constructor(
    private _pipelineService: PipelineService,
  ) {
    this.interactiveInspectionInvoker = (...args: any[]) => Observable.throw('Interactive not initialized');
    this.interactiveDirectInspectionInvoker = (...args: any[]) => Observable.throw('Interactive not initialized');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (('parameters' in changes && this.parameters) || 'inputValue' in changes) {
      this.prepareForm();
    }
    if ('pipelineParameters' in changes && changes['pipelineParameters'].firstChange) {
      this.pipelineParametersEnabled = this.pipelineParameters !== null;
      if (this.pipelineParametersEnabled && this.pipelineParameters) {
        this.definePipelineParameters = Object.keys(this.pipelineParameters).length > 0;
      }
    }
  }

  _isPipelineParameter(parameterName: string, pipelineParameters: {[key: string]: string}): boolean {
    return pipelineParameters && parameterName in pipelineParameters;
  }

  _togglePipelineParameter(parameter: ParameterDefinition, checked: boolean): void {
    if (!this.pipelineParametersEnabled) {
      return;
    }
    const included = this.pipelineParameters && parameter.name in this.pipelineParameters;
    if (checked && !included) {
      this.pipelineParameters = {...this.pipelineParameters, [parameter.name]: parameter.caption || parameter.name};
    } else if (!checked && included) {
      this.pipelineParameters = _.omit(this.pipelineParameters, [parameter.name]);
    }
    this.pipelineParametersChange.emit(this.pipelineParameters);
  }

  _isParameterVisible = (
    definition: ParameterDefinition,
    values: ParameterValues,
    pipelineParameters: {[key: string]: string},
  ): boolean => this._pipelineService.isParameterAvailable(definition, values, pipelineParameters);

  ngOnDestroy() {
    this.formSubscriptions.forEach(_ => _.unsubscribe());
  }

  protected prepareForm() {
    this.formSubscriptions.forEach(_ => _.unsubscribe());

    const controls = this.parameters.reduce<{[name: string]: FormControl}>((acc, definition) => {
      const value = ParameterValueControlComponent.calculateParameterFormValue(definition, this.inputValue);
      acc[definition.name] = new FormControl(value);
      return acc;
    }, {});

    this.parameters.forEach(definition => {
      const control = controls[definition.name];
      this._applyParameterValidators(definition, control);
    });

    this.form = new FormGroup(controls);

    this.formSubscriptions.push(concat(of(this.form.value), this.form.valueChanges)
      .pipe(delay(0))
      .subscribe(rawValue => {
        const value = Object.keys(rawValue)
          .reduce((params, paramName) => {
            const definition: ParameterDefinition = this.parameters
              .filter(_ => _.name === paramName)[0];

            if (!definition) {
              return params;
            }

            return {
              ...params,
              [paramName]: ParameterValueControlComponent.calculateParameterValue(definition, rawValue[paramName]),
            };
          }, {});

        this._value = value;
        this.valueChange.next(value);
        window.setTimeout(() => this.validityChange.emit(this.form.valid), 0);
      }));
  }

  protected _toggleDefinePipelineParameters(enabled: boolean) {
    if (!enabled) {
      this.pipelineParameters = {};
      this.pipelineParametersChange.emit(this.pipelineParameters);
    }
  }

  private _validateParameter(definition: ParameterDefinition): ValidatorFn {
    return ParameterValueControlComponent.prepareParameterValidator(
      definition,
      () => !(definition.name in (this.pipelineParameters || {})),
    );
  }

  private _applyParameterValidators(
    definition: ParameterDefinition,
    control: FormControl,
  ): void {
    if (this.disabled) {
      control.disable();
      return;
    }

    control.setValidators(this._validateParameter(definition));

    if (definition.conditions) {
      const pipelineParamsTrigger = this.pipelineParametersChange
        .map(pipelineParams => _.some(Object.keys(definition.conditions), _ => pipelineParams.hasOwnProperty(_)))
        .pipe(distinctUntilChanged());

      const paramValuesTrigger = this.valueChange
        .map(value => _.pick(value, ...Object.keys(definition.conditions)))
        .pipe(distinctUntilChanged(_.isEqual));

      const subscription =
        merge(pipelineParamsTrigger, paramValuesTrigger)
        .subscribe(() => {
          if (this._isParameterVisible(definition, this._value, this.pipelineParameters)) {
            control.disabled && control.enable();
          } else {
            control.enabled && control.disable();
          }
        });

      this.formSubscriptions.push(subscription);
    }

    this.formSubscriptions.push(this.pipelineParametersChange.subscribe(() => {
      control.updateValueAndValidity();
    }));

    control.updateValueAndValidity();
  }

  private _updateControlValue(definition: ParameterDefinition, value: ParameterValueType) {
    const allValues = {...this.inputValue};
    allValues[definition.name] = value;
    const controlValue = ParameterValueControlComponent.calculateParameterFormValue(definition, allValues);
    this.form.controls[definition.name].setValue(controlValue);
  }
}

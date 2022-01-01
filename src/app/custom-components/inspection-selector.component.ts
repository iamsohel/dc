import { Component, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';
import { empty } from 'rxjs/observable/empty';

import { ParameterValueControlComponent } from '../core/components/parameter-value-control.component';
import { ParameterDefinition, ParameterValueType } from '../core/interfaces/params.interface';
import { CustomComponent } from '../pipelines/custom-components/custom-component.interfaces';
import { Pipeline } from '../pipelines/pipeline.interfaces';
import { ReactiveLoader } from '../utils/reactive-loader';


@Component({
  selector: 'inspection-selector',
  template: `
    <ng-template #loading>
      <app-input
        [label]="definition.caption || definition.name"
        [helpText]="definition.description"
        [disabled]="true"
        [value]="'Loading...'"
      ></app-input>
    </ng-template>
    <ng-container *ngIf="!(loader.active | async) else loading">
      <parameter-value-control
        [parameter]="definition | apply: _getDefinitionForControl: options"
        [control]="control"
      ></parameter-value-control>
    </ng-container>
  `,
})
export class InspectionSelectorComponent implements CustomComponent.IParameterComponent {
  public valueChange = new EventEmitter<ParameterValueType>();
  private definition: ParameterDefinition;
  private options: Array<number | string> | null = null;
  private value: ParameterValueType = null;
  private context: CustomComponent.IParameterContext;
  private inspectionName: string;
  private inspectionStepId: string;
  private inspectionOutputIndex: number;
  private targetInputName: string;
  private control: FormControl;
  private loader = new ReactiveLoader(() => {
    if (this.context.invoker && this.inspectionName && this.inspectionStepId && this.inspectionOutputIndex !== null) {
      return this.context.invoker(
        this.inspectionName,
        this.inspectionStepId,
        { target: { _outputIndex: this.inspectionOutputIndex } },
      );
    } else {
      return empty();
    }
  });

  constructor() {
    this.control = new FormControl();
    this.loader.subscribe((newOptions: Array<number | string>) => {
      if (Array.isArray(newOptions)) {
        this.options = newOptions;
        this.updateControlValue();
      } else {
        this.options = this.definition.multiple ? [] : null;
      }
    });
    this.control.valueChanges.subscribe(controlValue => {
      const value = ParameterValueControlComponent.calculateParameterValue(this.definition, controlValue);
      if (!_.isEqual(this.value, value)) {
        this.value = value;
        this.valueChange.emit(value);
      }
    });
  }

  configure(options?: { [p: string]: any }): void {
    this.inspectionName = null;
    if ('inspectionName' in options) {
      this.inspectionName = options['inspectionName'];
    }
    this.targetInputName = null;
    if ('targetInputName' in options) {
      this.targetInputName = options['targetInputName'];
    }
  }

  setContext(context: CustomComponent.IParameterContext): void {
    this.context = context;
    this.inspectionStepId = null;
    this.inspectionOutputIndex = null;
    if (this.targetInputName) {
      if (
        this.targetInputName
        && context.inputs
        && this.targetInputName in context.inputs
        && !Array.isArray(context.inputs[this.targetInputName])
      ) {
        this.inspectionStepId = (context.inputs[this.targetInputName] as Pipeline.OutputReference).stepId;
        this.inspectionOutputIndex = (context.inputs[this.targetInputName] as Pipeline.OutputReference).outputIndex;
      }
    }
    this.definition = context.parameter;
    const value = context.parameterValues[context.parameter.name];
    if (value !== undefined && !_.isEqual(value, this.value)) {
      this.value = value;
      this.updateControlValue();
    }
    if (context.disabled !== this.control.disabled) {
      if (context.disabled) {
        this.control.disable();
      } else {
        this.control.enable();
      }
    }
    this.loader.load();
  }

  private _getDefinitionForControl(definition: ParameterDefinition, options: Array<string | number>): ParameterDefinition {
    return <ParameterDefinition> {...definition, options};
  }

  private updateControlValue() {
    const value = ParameterValueControlComponent.calculateParameterFormValue(
      this._getDefinitionForControl(this.definition, this.options),
      this.context.parameterValues,
    );
    this.control.setValue(value);
  }
}

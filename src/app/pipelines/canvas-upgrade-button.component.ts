import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';

import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';
import { PluralizePipe } from '../core-ui/core-ui.pipes';
import { ParameterValueControlComponent } from '../core/components/parameter-value-control.component';
import { createComparerOfObjectsWithVersions } from '../core/core.helpers';
import { ParameterValues } from '../core/interfaces/params.interface';
import { NotificationService } from '../core/services/notification.service';

import { Pipeline, PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

const VERSION_COMPARER = createComparerOfObjectsWithVersions<PipelineOperator>('packageVersion');
const UNIQUE_IDENTIFIER = (o: PipelineOperator) => `${o.packageName}:${o.moduleName}.${o.className}`;

export type UpgradeData = {newSteps: Pipeline.StepInfo[], modifiedStepIds: string[]};

@Component({
  selector: 'canvas-upgrade-button',
  template: `
    <div
      *ngIf="_outdatedSteps.length"
      class="btn-group"
    >
      <button
        title="Upgrade operators to latest versions"
        (click)="upgradeOperators()"
        class="btn btn-upgrade"
      >
        <i class="glyphicon glyphicon-chevron-up"></i>
        Upgrade <span class="badge">{{_outdatedSteps.length}}</span>
      </button>
      <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"
        aria-expanded="false">
        <span class="caret"></span>
        <span class="sr-only">Toggle Dropdown</span>
      </button>
      <ul class="dropdown-menu" style="right:0;left:unset;">
        <li>
          <app-check
            class="pipeline-upgrade-checkbox"
            label="Display notifications"
            [(checked)]="emitOutdatedSteps"
            (checkedChange)="outdatedSteps.emit(emitOutdatedSteps ? _outdatedSteps : []);"
          ></app-check>
        </li>
      </ul>
    </div>
    <app-modal
      #modal
      [caption]="'Upgrade operators'"
      [buttons]="[
      { 'id': 'upgrade', 'class': 'btn-primary', 'title': 'Upgrade' },
      { 'id': 'cancel', 'class': 'btn-default', 'title': 'Cancel' }
    ]"
      (buttonClick)="onUpgradeModalButtonClick($event)"
    >
      <p>
        You have {{_outdatedSteps.length | pluralize: ({'1': '{} step', 'other': '{} steps'})}} with outdated operator.
        Do you want to upgrade {{_outdatedSteps.length | pluralize: 'it': 'them'}} to latest version?
      </p>
      <ng-template #operatorToDelete><i>delete</i></ng-template>
      <table class="table">
        <tr *ngFor="let diff of stepsToUpgrade">
          <td>{{diff.oldOperator.name}}</td>
          <td>
            {{diff.oldOperator.packageName}}
            {{diff.oldOperator.packageVersion}}
            <i class="glyphicon glyphicon-arrow-right"></i>
            <ng-container
              *ngIf="diff.newOperator else operatorToDelete">{{diff.newOperator.packageVersion}}</ng-container>
            <i
              *ngIf="diff.incompatibleParams.length"
              class="glyphicon glyphicon-warning-sign"
              [title]="'The following parameters will be reset to default/null values: ' + diff.incompatibleParams.join(', ')"
            ></i>
          </td>
        </tr>
      </table>
    </app-modal>
  `,
})
export class PipelineCanvasUpgradeButtonComponent implements OnChanges {
  @Input() operators: PipelineOperator[];
  @Input() steps: Pipeline.StepInfo[] = [];
  @Output() onUpgrade = new EventEmitter<UpgradeData>();
  @Output() outdatedSteps = new EventEmitter<Pipeline.StepInfo[]>();
  @ViewChild('modal') modal: ModalComponent;
  protected latestOperators: {[operatorKey: string]: PipelineOperator} = null;
  protected packagesLastVersions: {[packageId: string]: string} = null;
  protected emitOutdatedSteps: boolean = true;
  protected _outdatedSteps: Pipeline.StepInfo[] = [];
  protected stepsToUpgrade: {
    step: Pipeline.StepInfo,
    oldOperator: PipelineOperator,
    newOperator: PipelineOperator | null,
    incompatibleParams: string[],
  }[] = [];

  constructor(
    private readonly _pipelineService: PipelineService,
    private readonly _notificationService: NotificationService,
    private readonly pluralize: PluralizePipe,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('operators' in changes) {
      const getLatest = (soFar: PipelineOperator, item: PipelineOperator) => VERSION_COMPARER(soFar, item) > 0
        ? item : soFar;
      this.latestOperators = _.chain(this.operators)
        .groupBy(UNIQUE_IDENTIFIER)
        .mapValues(ops => ops.reduce(getLatest, ops[0]))
        .value();
      this.packagesLastVersions = _.chain(this.latestOperators)
        .groupBy(_ => _.packageName)
        .mapValues(ops => ops.reduce(getLatest, ops[0]).packageVersion)
        .value();
      if (!('steps' in changes)) {
        this.processSteps(this.steps);
      }
    }
    if ('steps' in changes && this.packagesLastVersions) {
      this.processSteps(changes['steps'].currentValue);
    }
  }

  protected processSteps(steps: Pipeline.StepInfo[]) {
    this._outdatedSteps = steps.filter(step => {
      const operator = this.operators.find(_ => _.id === step.operator);
      return operator.packageVersion !== this.packagesLastVersions[operator.packageName];
    });
    this.outdatedSteps.emit(this.emitOutdatedSteps ? this._outdatedSteps : []);
  }

  protected upgradeOperators() {
    this.stepsToUpgrade = this._outdatedSteps.map(step => {
      const oldOperator = this.operators.find(_ => _.id === step.operator);
      const k = UNIQUE_IDENTIFIER(oldOperator);
      const latestOp = this.latestOperators[k];
      const newOperator = latestOp && latestOp.packageVersion === this.packagesLastVersions[latestOp.packageName]
        ? latestOp
        : null;
      const incompatibleParams = newOperator
        ? _.difference(
          Object.keys(step.params),
          Object.keys(this._updateOperatorParameters(step.params, newOperator, oldOperator, step.pipelineParameters)),
        )
        : [];
      return { step, oldOperator, newOperator, incompatibleParams };
    });
    this.modal.show();
  }

  protected onUpgradeModalButtonClick(btn: IModalButton) {
    if (btn.id === 'upgrade') {
      let numberOfUpgradedOperators = 0;
      let numberOfDroppedInputs = 0;
      const modifiedStepIds = new Set();
      const newSteps: Pipeline.StepInfo[] = this.steps.map(step => {
        const currentOperator = this.operators.find(_ => _.id === step.operator);
        const latestOperator = this.latestOperators[UNIQUE_IDENTIFIER(currentOperator)];
        if (this.packagesLastVersions[latestOperator.packageName] !== latestOperator.packageVersion) {
          // Drop step if no new version for this operator
          numberOfDroppedInputs += Object.keys(step.inputs).length;
          numberOfUpgradedOperators += 1;
          modifiedStepIds.add(step.id);
          return null;
        }
        const newStep: Pipeline.StepInfo = {
          id: step.id,
          operator: currentOperator.id,
          inputs: step.inputs,
          params: step.params,
          coordinates: step.coordinates,
          pipelineParameters: step.pipelineParameters,
        };
        if (currentOperator.id !== latestOperator.id) {
          newStep.operator = latestOperator.id;

          // Check parameters
          newStep.params = this._updateOperatorParameters(
            step.params,
            latestOperator,
            currentOperator,
            step.pipelineParameters,
          );

          // Check pipeline parameters
          newStep.pipelineParameters = _.pickBy(step.pipelineParameters, (_, paramName) => {
            return !!latestOperator.params.find(_ => _.name === paramName);
          });

          modifiedStepIds.add(step.id);
          numberOfUpgradedOperators += 1;
        }
        return newStep;
      }).filter(_ => !!_).map((step, idx, steps) => {
        // cleanup inputs for steps that were not updated
        const operator = this.operators.find(_ => _.id === step.operator);
        const newInputs = this._updateOperatorInputs(step.inputs, operator, steps);
        if (Object.keys(newInputs).length !== Object.keys(step.inputs).length) {
          numberOfDroppedInputs += Object.keys(step.inputs).length - Object.keys(newInputs).length;
          modifiedStepIds.add(step.id);
          return {...step, inputs: newInputs};
        }
        return step;
      });
      this.onUpgrade.emit({newSteps, modifiedStepIds: Array.from(modifiedStepIds)});
      this._outdatedSteps = [];
      this.outdatedSteps.emit(this._outdatedSteps);
      let msg = this.pluralize.transform(
        numberOfUpgradedOperators,
        {'1': '{} operator was upgraded.', 'other': '{} operators were upgraded.'},
      );
      if (numberOfDroppedInputs) {
        msg += ' ' + this.pluralize.transform(
          numberOfDroppedInputs,
          {'1': '{} input was', 'other': '{} inputs were'},
        ) + ' dropped because of incompatibility with new version';
      }
      this._notificationService.create(msg);
    }
    this.modal.hide();
  }

  private _updateOperatorParameters(
    oldParams: ParameterValues,
    newOperator: PipelineOperator,
    oldOperator: PipelineOperator,
    pipelineParameters: Pipeline.PipelineParameters,
  ): ParameterValues {
    const newParams = {};
    for (const paramName of Object.keys(oldParams)) {
      const oldDefinition = oldOperator.params.find(_ => _.name === paramName);
      const newDefinition = newOperator.params.find(_ => _.name === paramName);
      const isPipelineParameter = pipelineParameters && paramName in pipelineParameters;
      if (newDefinition && oldDefinition) {
        const validator = ParameterValueControlComponent.prepareParameterValidator(newDefinition, !isPipelineParameter);
        const controlValue = ParameterValueControlComponent.calculateParameterFormValue(oldDefinition, oldParams);
        if (
          !validator(new FormControl(controlValue)) &&
          this._pipelineService.isParameterAvailable(newDefinition, oldParams, pipelineParameters)
        ) {
          newParams[paramName] =  ParameterValueControlComponent.calculateParameterValue(newDefinition, controlValue);
        }
      }
    }
    return newParams;
  }

  private _updateOperatorInputs(
    oldInputs: { [inputName: string]: Pipeline.OutputReference | Pipeline.OutputReference[] },
    newOperator: PipelineOperator,
    steps: Pipeline.StepInfo[],
  ): { [inputName: string]: Pipeline.OutputReference | Pipeline.OutputReference[] } {
    const newInputs = {};
    for (const [inputName, outputReference] of _.entries(oldInputs)) {
      if (Array.isArray(outputReference)) {
        newInputs[inputName] = [];
        outputReference.forEach(singleRef => {
          const outputStep = steps.find(s => s.id === singleRef.stepId);
          if (outputStep) {
            const outputStepOperator = this.operators.find(_ => _.id === outputStep.operator);
            const output = outputStepOperator.outputs[singleRef.outputIndex];
            const input = newOperator.inputs.find(input => input.name === inputName);
            if (input && this._pipelineService.dataTypesAreCompatible(output.type, input.type, input.covariate)) {
              newInputs[inputName].push(singleRef);
            }
          }
        });
      } else {
        const outputStep = steps.find(s => s.id === outputReference.stepId);
        if (outputStep) {
          const outputStepOperator = this.operators.find(_ => _.id === outputStep.operator);
          const output = outputStepOperator.outputs[outputReference.outputIndex];
          const input = newOperator.inputs.find(input => input.name === inputName);
          if (input && this._pipelineService.dataTypesAreCompatible(output.type, input.type, input.covariate)) {
            newInputs[inputName] = outputReference;
          }
        }
      }
    }
    return newInputs;
  }

}

import { Component, Input } from '@angular/core';

import { IAssetReference, TObjectId } from '../core/interfaces/common.interface';

import { getStepSelectedAssets } from './pipeline.helpers';
import { IGenericExperiment, Pipeline, PipelineOperator } from './pipeline.interfaces';

@Component({
  selector: 'pipeline-experiment-view-result',
  template: `
      <div *ngIf="!result.steps.length" class="alert alert-warning">No results to display</div>
      <div
        *ngFor="let data of result.steps | apply: getStepData: pipeline.steps"
        class="panel"
        [ngClass]="{
          'panel-danger': isErrorResult(data.result),
          'panel-primary': !isErrorResult(data.result)
        }"
      >
        <div class="panel-heading">
          <strong>
            {{data.step.operator | apply: getOperatorName: operators}}
          </strong>
        </div>

        <div class="panel-body">
          <ng-container *ngIf="isErrorResult(data.result)">
            <div class="row">
              <div class="col col-md-8 col-xs-12">
                <pre class="pre-scrollable auto-hide-scrollbar" style="border: none">{{data.result.errorMessage}}</pre>
              </div>

              <div class="col col-md-4 col-xs-12">
                <p><strong>Assets:</strong></p>
                <asset-list
                  [assetReferences]="data.result.assets"
                ></asset-list>
              </div>
            </div>
          </ng-container>

          <pipeline-experiment-step-result
            *ngIf="!isErrorResult(data.result)"
            [result]="data.result"
            [selectedAssets]="data.step | apply: getStepSelectedAssets: operators"
          ></pipeline-experiment-step-result>
        </div>
      </div>
      <ng-container *ngVar="(result.assets | apply: getOrphanAssets: result.steps) as orphanAssets">
        <div class="panel panel-primary" *ngIf="orphanAssets?.length">
          <div class="panel-heading">
            <strong>Orphan Assets:</strong>
            <i class="helpText glyphicon glyphicon-question-sign icon-suffix"
              tooltip
              data-toggle="tooltip"
              data-html="true"
              data-placement="top"
              [tooltipTitle]="'Orphan assets are assets created during the experiment run but not linked to a particular pipeline step.'"
            ></i>
          </div>
          <div class="panel-body">
            <asset-list
              [assetReferences]="orphanAssets"
            ></asset-list>
          </div>
        </div>
      </ng-container>
  `,
})
export class PipelineExperimentViewResultComponent {
  @Input() result: IGenericExperiment.Result;
  @Input() pipeline: IGenericExperiment.Pipeline;
  @Input() operators: PipelineOperator[];
  readonly getStepSelectedAssets = getStepSelectedAssets;

  getStepData = function(
    resultSteps: IGenericExperiment.StepResultSuccess[],
    steps: Pipeline.Step[],
  ): { step: Pipeline.Step, result: IGenericExperiment.StepResult }[] {
    return resultSteps.map(result => {
      return {
        step: steps.find(_ => result.stepId === _.id),
        result: result,
      };
    }).filter(_ => !!_.step).reverse();
  };


  getOrphanAssets = function (
    pipelineAssets: IAssetReference[],
    resultSteps: IGenericExperiment.StepResult[],
  ): IAssetReference[] {
    const stepAssets = [].concat(...resultSteps.map((_: IGenericExperiment.StepResult) => _.assets));
    return pipelineAssets.filter(
      (_: IAssetReference) => !stepAssets.some((data: IAssetReference) => (data.id === _.id && data.type === _.type)),
    );
  };

  getOperatorName = function (operatorId: TObjectId, operators: PipelineOperator[]): string {
    const operator = operators.find(_ => operatorId === _.id);
    return operator ? operator.name : `Unknown operator with ID "${operatorId}"`;
  };

  isErrorResult(result: IGenericExperiment.StepResultSuccess) {
    return 'errorMessage' in result;
  }
}

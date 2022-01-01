import { Component, Input } from '@angular/core';

import { IAlbum } from '../albums/album.interface';
import { IAssetReference } from '../core/interfaces/common.interface';

import { IGenericExperiment } from './pipeline.interfaces';

@Component({
  selector: 'pipeline-experiment-step-result',
  template: `
    <div class="row">
      <div class="col col-md-4 col-md-push-8 col-xs-12">
        <ng-container  *ngIf="result.assets?.length">
          <p><strong>Assets generated:</strong></p>
          <asset-list
            [assetReferences]="result.assets"
          ></asset-list>
        </ng-container>
        <ng-container *ngIf="selectedAssets?.length">
          <p><strong>Assets selected:</strong></p>
          <asset-list
            [assetReferences]="selectedAssets"
          ></asset-list>
        </ng-container>
      </div>

      <div class="col col-md-8 col-md-pull-4 col-xs-12">
        <p>
          <strong>Execution Time:</strong>
          {{result.executionTime | secondsToTime}}
        </p>

        <ng-container *ngIf="(result.outputValues | apply: objectKeys).length">
          <p><strong>Output values:</strong></p>
          <dl class="row" *ngFor="let key of result.outputValues | apply: objectKeys">
            <dd class="col-md-10">{{result.outputValues[key]}}</dd>
          </dl>
        </ng-container>

        <ng-container *ngIf="result.summaries?.length">
          <p><strong>Summary:</strong></p>
          <ng-container *ngFor="let summary of result.summaries">
            <ng-container *ngIf="isSummaryTypeSimple(summary)">
              <dl class="dl-horizontal">
                <ng-container *ngFor="let key of summary.values | apply: objectKeys">
                  <dt title="{{key}}">{{key}}</dt>
                  <dd>{{summary.values[key]}}</dd>
                </ng-container>
              </dl>
            </ng-container>
          </ng-container>
        </ng-container>
      </div>
    </div>

    <ng-container *ngFor="let summary of result.summaries">
      <div class="row" *ngIf="isSummaryTypeTable(summary)">
        <div class="col col-md-12 col-xs-12 col-lg-12">
          <table-summary [summary]="summary"></table-summary>
        </div>
      </div>
      <div class="row" *ngIf="isSummaryTypeConfusionMatrix(summary)">
        <div class="col col-md-12 col-xs-12 col-lg-12">
          <cv-confusion-matrix
            [labelMode]="'${IAlbum.LabelMode.LOCALIZATION}'"
            [labels]="summary.labels"
            [confusionMatrix]="summary.rows"
          ></cv-confusion-matrix>
        </div>
      </div>
    </ng-container>
  `,
})
export class PipelineExperimentStepResultComponent {
  @Input() result: IGenericExperiment.StepResultSuccess;
  @Input() selectedAssets: IAssetReference[];

  isSummaryTypeSimple(
    summary: IGenericExperiment.OperatorApplicationSummary,
  ): summary is IGenericExperiment.SimpleSummary {
    return summary.type === IGenericExperiment.SummaryType.SIMPLE;
  }

  isSummaryTypeTable(
    summary: IGenericExperiment.OperatorApplicationSummary,
  ): summary is IGenericExperiment.TableSummary {
    return summary.type === IGenericExperiment.SummaryType.TABLE;
  }

  isSummaryTypeConfusionMatrix(
    summary: IGenericExperiment.OperatorApplicationSummary,
  ): summary is IGenericExperiment.ConfusionMatrixSummary {
    return summary.type === IGenericExperiment.SummaryType.CONFUSION_MATRIX;
  }

  readonly objectKeys = function(o: any): string[] {
    return Object.keys(o || {}).sort();
  };
}

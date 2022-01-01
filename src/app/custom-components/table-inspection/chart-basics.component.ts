import { Component, EventEmitter, Input, Output } from '@angular/core';

import config from '../../config';
import { TabularDataRequest } from '../../visualize/visualize.interface';

@Component({
  selector: 'table-inspection-chart-basics',
  template: `
      <div class="btn-group btn-group-justified" role="group" aria-label="Chart Types">
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-default btn-lg "
          title="Line Chart"
          (click)="typeChange.emit(config.chart.type.values.LINE)"
          [ngClass]="{'active': type === config.chart.type.values.LINE}">
          <i class="fa fa-line-chart"></i></button>
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-default btn-lg"
          title="Bar Chart"
          (click)="typeChange.emit(config.chart.type.values.BAR)"
          [ngClass]="{'active': type === config.chart.type.values.BAR}">
          <i class="fa fa-bar-chart"></i></button>
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-default btn-lg"
          title="Pie Chart"
          (click)="typeChange.emit(config.chart.type.values.PIE)"
          [ngClass]="{'active': type === config.chart.type.values.PIE}">
          <i class="fa fa-pie-chart"></i></button>
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-default btn-lg"
          title="Scatter Plot"
          (click)="typeChange.emit(config.chart.type.values.SCATTER)"
          [ngClass]="{'active': type === config.chart.type.values.SCATTER}">
          <i class="fa fa-braille"></i></button>
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-default btn-lg"
          title="Geo Heat Map"
          (click)="typeChange.emit(config.chart.type.values.GEO)"
          [ngClass]="{'active': type === config.chart.type.values.GEO}">
          <i class="fa fa-map"></i></button>
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-default btn-lg"
          title="Table"
          (click)="typeChange.emit(config.chart.type.values.TABLE)"
          [ngClass]="{'active': type === config.chart.type.values.TABLE}">
          <i class="fa fa-table"></i></button>
      </div>
    </div>
    <ng-container *ngIf="selectedMetrics.length > 1">
      <h3>Metrics Order:</h3>
      <div
        class="list-group"
        style="cursor: move;"
        dnd-sortable-container
        [sortableData]="selectedMetrics"
      >
        <li
          *ngFor="let metric of selectedMetrics; let i = index"
          class="list-group-item"
          dnd-sortable
          [sortableIndex]="i"
          (onDragEnd)="selectedMetricsChange.emit(selectedMetrics)"
        >
          {{metric.columnName }}
        </li>
      </div>
    </ng-container>
    <ng-container *ngIf="selectedAttributes.length > 1">
      <h3>Attributes Order:</h3>
      <div
        class="list-group"
        style="cursor: move;"
        dnd-sortable-container
        [sortableData]="selectedAttributes"
      >
        <li
          *ngFor="let attr of selectedAttributes; let i = index"
          class="list-group-item"
          dnd-sortable
          [sortableIndex]="i"
          (onDragEnd)="selectedAttributesChange.emit(selectedAttributes)"
        >
          {{attr}}
        </li>
      </div>
    </ng-container>
`,
})
export class TableInspectionChartBasicsComponent {
  readonly config = config;
  @Input() type: string;
  @Output() typeChange = new EventEmitter<string>();
  @Input() selectedMetrics: TabularDataRequest.Aggregation[] = [];
  @Output() selectedMetricsChange = new EventEmitter<TabularDataRequest.Aggregation[]>();
  @Input() selectedAttributes: string[] = [];
  @Output() selectedAttributesChange = new EventEmitter<string[]>();
}

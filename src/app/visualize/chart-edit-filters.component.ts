import { Component, EventEmitter, Input, Output } from '@angular/core';

import 'rxjs/add/observable/of';

import config from '../config';
import { IDimensions } from '../tables/table.interface';

import { TWidgetFormGroup } from './dashboard-edit-state';
import { IDashboardXFilter } from './dashboard.interface';

@Component({
  selector: 'chart-edit-filters',
  template: `
    <table class="table table-striped">
      <thead>
      <tr>
        <th>Name</th>
        <th>Show On Chart</th>
        <th>Local Filter</th>
        <th>Cross Filter</th>
      </tr>
      </thead>
      <tbody>
        <tr *ngFor="let metric of dimensions?.metrics;let i = index">
          <td>
            <label class="checkbox ellipsis" [title]="metric.displayName">
              <i class="fa fa-sort-numeric-asc"></i>
              {{metric.displayName}}
            </label>
          </td>
          <td>
            <app-check
            [checked]="isChecked(metric.name)"
            (checkedChange)="checkChange(metric.name, $event)"></app-check>
          </td>
          <td>
            <app-check [type]="'radio'"
              [name]="'filterMetric_' + i"
              [checked]="!isCrossFilter(metric.name)"
              (checkedChange)="switchCrossFilter(metric.name, $event)"
              [value]="false"></app-check>
          </td>
          <td>
            <app-check [type]="'radio'"
              [name]="'filterMetric_' + i"
              [checked]="isCrossFilter(metric.name)"
              (checkedChange)="switchCrossFilter(metric.name, $event)"
              [value]="true"></app-check>
          </td>
        </tr>
        <tr *ngFor="let attribute of dimensions?.attributes;let i = index">
          <td>
            <label class="checkbox ellipsis" [title]="attribute.displayName">
              <i class="fa fa-tag"></i>
              {{attribute.displayName}}
            </label>
          </td>
          <td>
            <app-check [checked]="isChecked(attribute.name)"
              (checkedChange)="checkChange(attribute.name, $event)"></app-check>
          </td>
          <td>
            <app-check [type]="'radio'"
              [name]="'filterAttribute_' + i"
              [checked]="!isCrossFilter(attribute.name)"
              (checkedChange)="switchCrossFilter(attribute.name, $event)"
              [value]="false"></app-check>
          </td>
          <td>
            <app-check [type]="'radio'"
              [name]="'filterAttribute' + i"
              [checked]="isCrossFilter(attribute.name)"
              (checkedChange)="switchCrossFilter(attribute.name, $event)"
              [value]="true"></app-check>
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
export class ChartEditFiltersComponent {
  config = config;
  @Input() dimensions: IDimensions;
  @Input() widgetForm: TWidgetFormGroup;
  @Input() crossFilters?: IDashboardXFilter[];
  @Output() crossFiltersChange = new EventEmitter<IDashboardXFilter[]>();

  isChecked(name: string): boolean {
    return this.widgetForm.value.chartFilters.findIndex(_ => _ === name) >= 0;
  }

  isCrossFilter(name: string): boolean {
    return this.crossFilters && this.crossFilters.findIndex(
      _ => _.tableId === this.dimensions.tableId && _.columnName === name,
    ) >= 0;
  }

  switchCrossFilter(name: string, enable: boolean) {
    const value = this.crossFilters.filter(_ => _.tableId !== this.dimensions.tableId || _.columnName !== name);
    if (enable) {
      value.push({
        tableId: this.dimensions.tableId,
        columnName: name,
      });
    }
    this.crossFiltersChange.emit(value);
  }

  checkChange(name: string, checked: boolean): void {
    const value = this.widgetForm.value.chartFilters.filter(_ => _ !== name);
    if (checked) {
      value.push(name);
    }
    this.widgetForm.controls.chartFilters.setValue(value);
  }
}

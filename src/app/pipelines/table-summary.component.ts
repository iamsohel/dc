import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { AppFormGroup } from '../utils/forms';

import { IGenericExperiment } from './pipeline.interfaces';

type PaginationForm = AppFormGroup<{page: FormControl, page_size: FormControl, order: FormControl}>;
const MIN_ROWS_FOR_PAGINATION = 15;

@Component({
  selector: 'table-summary',
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="p0 form-control brand-control">
          <div class="row">
            <div class="col-md-6 ellipsis">
              <strong>{{summary.name}}</strong>
            </div>
            <div class="col-md-6">
              <div class="pull-right">
                {{(summary.values.length || 0) | pluralize:({other: '{} rows', '0': 'No rows', '1': '{} row'})}}
                <table-summary-save-button [summary]="summary"></table-summary-save-button>
              </div>
              <div class="pull-right" *ngIf="summary.values | apply: _showPagination">
                <app-pagination [page]="_form.controls.page"
                  [pageSize]="_form.controls.page_size"
                  [currentPageSize]="_data.length"
                  [rowsCount]="summary.values.length || 0">
                </app-pagination>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="table-scroll" style="margin-bottom: 8px;">
      <table class="table table-dataset table-bordered">
        <thead>
          <tr>
            <th
              *ngFor="let column of summary.columns; let i = index"
              [grid-sort]="{ alias: i + 1 + '', name: column.name }"
              [grid-sort-control]="_form.controls.order"
            >{{column.name}}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of _data">
            <td *ngFor="let column of summary.columns; let i = index">
              <span title="{{row[i]}}">{{row[i] | truncate:50}}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class TableSummaryComponent implements OnChanges, OnDestroy {
  @Input() summary: IGenericExperiment.TableSummary;

  private _data: IGenericExperiment.TableSummaryValue[][] = [];

  private _form: PaginationForm  = new AppFormGroup({
    order: new FormControl(), // ordering
    page: new FormControl(1),
    page_size: new FormControl(config.table.view.pageSize.tableView),
  });

  private _subscriptions: Subscription[] = [];

  constructor() {
    this._subscriptions.push(this._form.valueChanges.subscribe(_ => this._updateData()));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('summary' in changes) {
      this._updateData();
    }
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(_ => _.unsubscribe());
  }

  private _updateData(): void {
    const allData = [...this.summary.values];
    const orderValue = this._form.controls.order.value;
    if (orderValue) {
      const orderColumnIndex = Math.abs(orderValue) - 1;
      const reverse = orderValue > 0 ? 1 : -1;
      const compare = (a, b) => a === b ? 0 : (a == null ? -1 : (b == null ? 1 : (a > b ? 1 : -1)));
      allData.sort((a, b) => compare(a[orderColumnIndex], b[orderColumnIndex]) * reverse);
    }
    if (this._showPagination(this.summary.values)) {
      const startIndex = (this._form.controls.page.value - 1) * this._form.controls.page_size.value;
      const endIndex = startIndex + this._form.controls.page_size.value;
      this._data = allData.slice(startIndex, endIndex);
    } else {
      this._data = allData;
    }
  }

  private _showPagination = (values: IGenericExperiment.TableSummaryValue[][]): boolean => values && values.length >= MIN_ROWS_FOR_PAGINATION;
}

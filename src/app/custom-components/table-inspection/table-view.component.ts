import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import config from '../../config';
import { ITable, ITableColumn, TTableValue } from '../../tables/table.interface';
import { ActivityObserver } from '../../utils/activity-observer';
import { AppFormGroup } from '../../utils/forms';

export interface IPagination {
  page: number;
  pageSize: number;
  order: {columnName: string, reverse: boolean}[];
}

@Component({
  selector: 'table-inspection-table-view',
  template: `
    <div class="panel panel-primary">
      <div class="panel-heading">
        Table data
        <app-check
          [class]="'inline pull-right'"
          [(checked)]="_showDisplayNames"
          label="Columns display-names"
        ></app-check>
      </div>
      <div class="panel-body" style="padding: 0px;">
        <div class="row" style="line-height: 34px;">
          <div class="col-md-6 ellipsis">
            <strong><!-- s --></strong>
          </div>
          <div class="col-md-6">
            <div class="pull-right">
              {{_count | pluralize:({other: '{} rows', '0': 'No rows', '1': '{} row'})}}
            </div>
            <div class="pull-right">
              <app-pagination [page]="_form.controls.page"
                [pageSize]="_form.controls.pageSize"
                [currentPageSize]="_data.length"
                [rowsCount]="_count">
              </app-pagination>
            </div>
          </div>
          <div class="col-md-12 table-scroll app-spinner-box">
            <app-spinner [visibility]="_dataLoading.active | async"></app-spinner>
            <table class="table table-dataset table-bordered">
              <thead>
              <tr>
                <th
                  *ngFor="let column of columns; let i = index"
                  [grid-sort]="{ alias: column.name, name: column.name }"
                  [grid-sort-control]="_form.controls.order"
                >{{_showDisplayNames ? column.displayName : column.name}}</th>
              </tr>
              </thead>
              <tbody>
              <tr *ngFor="let row of _data">
                <td *ngFor="let column of columns; let i = index"
                  [ngSwitch]="column.dataType"
                >
                  <span
                    *ngSwitchCase="'${ITable.ColumnDataType.DOUBLE}'"
                    [title]="row[i] | tableNumberTitle: '1.0-3'"
                  >
                    {{row[i] | number: '1.0-3'}}
                  </span>
                  <span *ngSwitchCase="'${ITable.ColumnDataType.BOOLEAN}'">
                    {{0+row[i]}}
                  </span>
                  <span *ngSwitchDefault title="{{row[i]}}">{{row[i] | truncate:50}}</span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TableInspectionTableViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() columns: ITableColumn[] = [];
  @Input() getData: (paging: IPagination) => Observable<{data: TTableValue[][], count: number}>;

  protected _showDisplayNames = true;

  private _form = new AppFormGroup({
    order: new FormControl(''), // ordering
    page: new FormControl(1),
    pageSize: new FormControl(config.table.view.pageSize.tableViewEmbed),
  });
  private _dataLoading = new ActivityObserver();
  private _data: TTableValue[][] = [];
  private _count: number = 0;
  private subscription = new Subscription();
  private getDataSubscription: Subscription = null;

  constructor(private zone: NgZone) {}

  public ngOnInit(): void {
    if (this.columns) {
      this._form.controls.order.setValue(this.columns[0].name);
    }
    this.subscription.add(this._form.valueChanges.subscribe(value => this.loadData(value)));
    this._form.updateValueAndValidity();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('getData' in changes && !changes['getData'].firstChange) {
      this.loadData(this._form.value);
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.getDataSubscription) {
      this.getDataSubscription.unsubscribe();
    }
  }

  private loadData(paging: {page: number, pageSize: number, order: string}) {
    const order = paging.order.split(',').map(
      _ => _.substring(0, 1) === '-' ? {columnName: _.substring(1), reverse: true} : {columnName: _, reverse: false},
    );
    this._dataLoading.observe(this.getData({...paging, order})).subscribe(result => {
      this.zone.run(() => {
        this._data = result.data;
        this._count = result.count;
      });
    });
  }
}

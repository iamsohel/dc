import { Component, NgZone } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError } from 'rxjs/operators/catchError';
import { mergeMap } from 'rxjs/operators/mergeMap';

import { CustomComponent } from '../pipelines/custom-components/custom-component.interfaces';
import { Pipeline } from '../pipelines/pipeline.interfaces';
import { PipelineService } from '../pipelines/pipeline.service';
import { ITable, ITableColumn, TTableValue } from '../tables/table.interface';
import { ActivityObserver } from '../utils/activity-observer';
import { IDashboard } from '../visualize/dashboard.interface';
import { TabularDataRequest, TabularDataResponse } from '../visualize/visualize.interface';

import { IPagination } from './table-inspection/table-view.component';

interface ITab {
  id: string;
  title: string;
  attachTo: TAttachTo;
  activityObserver: ActivityObserver;
  enabled: boolean;
  inspections: {
    getColumns?: string;
    getData?: string;
    getAggregatedData?: string;
  };
  table: {
    input?: Pipeline.OutputReference;
    ready: boolean;
    error?: string;
    columns: ITableColumn[];
    getData?: (paging: IPagination) => Observable<{data: TTableValue[][], count: number}>;
    columnValuesLoader?: (columns: string) => Observable<{columnName: string, values: TTableValue[]}>;
    aggregatedDataLoader?: (request: TabularDataRequest) => Observable<TabularDataResponse>;
  };
}

type TAttachTo = ({inputName: string} | {outputIndex: number}) & {
  inspections?: {
    getColumns: string;
    getTableData: string;
    getAggregatedData: string,
  },
};

const DEFAULT_PACKAGE_NAME = 'deepcortex-ml-lib';
const DEFAULT_PACKAGE_VERSION = null;
const DEFAULT_MODULE_NAME = 'deepcortex.tabular.charting';
const DEFAULT_GET_COLUMNS_FUNCTION_NAME = 'get_columns';
const DEFAULT_GET_TABLE_DATA_FUNCTION_NAME = 'get_table_data';
const DEFAULT_GET_AGGREGATED_TABLE_DATA_FUNCTION_NAME = 'aggregate_table_data';

const tableType = {definition: 'deepcortex.library.tables.Table', typeArguments: []};

@Component({
  selector: 'table-inspection',
  template: `
    <ng-container *ngIf="_context.directInvoker && _context.invoker">
    <div class="tabpanel">
      <ul class="nav nav-tabs" role="tablist">
        <li
          *ngFor="let tab of _tabs; let tabIndex = index;"
          role="presentation"
          [ngClass]="{'active': _activeTab === tabIndex}"
        >
          <a (click)="_activeTab = tabIndex">{{tab.title}}</a>
        </li>
      </ul>
    </div>
    <div
      class="flex-static app-spinner-box"
      *ngFor="let tab of _tabs; let tabIndex = index;"
      [hidden]="_activeTab !== tabIndex"
    >
      <app-spinner [visibility]="tab.activityObserver.active | async"></app-spinner>
      <ng-template #noTableInfo>
        <div class="row">
          <div class="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
            Input is not provided.
          </div>
        </div>
      </ng-template>
      <ng-template #notReady>
        <div class="row">
          <div class="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <button class="btn btn-success" (click)="_enableTab(tab)" style="margin: 5px;">Inspect {{tab.title}}</button>
          </div>
        </div>
      </ng-template>
      <ng-template #error>
        <div class="row">
          <div class="col col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <pre class="pre-scrollable auto-hide-scrollbar" style="border: none">{{tab.table.error}}</pre>
          </div>
        </div>
        <div class="text-center">
          <button class="btn btn-xs" (click)="_reloadTab(tab)">
            <i class="glyphicon glyphicon-repeat"></i>
            Try again
          </button>
        </div>
      </ng-template>
      <ng-container *ngIf="tab.table.input else noTableInfo">
        <ng-container *ngIf="tab.table.ready else notReady">
          <ng-container *ngIf="!tab.table.error else error">
            <table-inspection-table-view
              [columns]="tab.table.columns"
              [getData]="tab.table.getData"
            ></table-inspection-table-view>
            <table-inspection-chart-view
              [attributes]="tab.table.columns | apply: _getAttributes"
              [metrics]="tab.table.columns | apply: _getMetrics"
              [aggregatedDataLoader]="tab.table.aggregatedDataLoader"
              [columnValuesLoader]="tab.table.columnValuesLoader"
            ></table-inspection-chart-view>
          </ng-container>
        </ng-container>
      </ng-container>
    </div>
    </ng-container>
  `,
})
export class TableInspectionComponent implements CustomComponent.IEDAComponent {
  private _attachedTo: TAttachTo[] = null;
  private _context: CustomComponent.IEDAContext = {
    operator: null,
    inputs: null,
    invoker: null,
    directInvoker: null,
    parameterValues: null,
    disabled: false,
    stepId: null,
  };
  private _options: { [p: string]: any };
  private _tabs: ITab[] = [];
  private _activeTab = 0;

  constructor(
    private pipelineService: PipelineService,
    private zone: NgZone,
  ) {
  }

  configure(options?: { [p: string]: any }): void {
    this._options = options || {};
    if ('attachTo' in this._options && Array.isArray(this._options['attachTo'])) {
      this._attachedTo = this._options['attachTo'] as TAttachTo[];
      this._tabs = this._createTabs(this._attachedTo);
    }
  }

  setContext(context: CustomComponent.IEDAContext): void {
    if (context.operator && (!this._context.operator || this._context.operator.id !== context.operator.id)) {
      if (!this._attachedTo) {
        const acceptableInputs = context.operator.inputs.reduce<TAttachTo[]>((acc, input) => {
          if (this.pipelineService.dataTypesAreCompatible(input.type, tableType, true)) {
            return acc.concat({
              inputName: input.name,
            });
          }
          return acc;
        }, []);
        const acceptableOutputs = context.operator.outputs.reduce<TAttachTo[]>((acc, output, outputIndex) => {
          if (this.pipelineService.dataTypesAreCompatible(output.type, tableType, true)) {
            return acc.concat({
              outputIndex: outputIndex,
            });
          }
          return acc;
        }, []);
        this._attachedTo = acceptableInputs.concat(acceptableOutputs);
        this._tabs = this._createTabs(this._attachedTo);
      }
      this._tabs.forEach(tab => {
        if (!tab.table.input) {
          let input: Pipeline.OutputReference = null;
          if (
            'inputName' in tab.attachTo
            && tab.attachTo.inputName in context.inputs
            && !Array.isArray(context.inputs[tab.attachTo.inputName])
          ) {
            input = tab.table.input = context.inputs[tab.attachTo.inputName] as Pipeline.OutputReference;
          } else if ('outputIndex' in tab.attachTo && context.stepId) {
            input = {
              stepId: context.stepId,
              outputIndex: tab.attachTo.outputIndex,
            };
          }
          if (input) {
            this.zone.run(() => {
              tab.table.input = input;
              tab.table.getData = (paging: IPagination) => {
                const args = { table: {_outputIndex: input.outputIndex}, request_json: paging };
                return this.callGetTableDataInspection(context, tab, args);
              };

              const _columnValuesCache: {[columnName: string]: ReturnType<ITab['table']['columnValuesLoader']>} = {};

              tab.table.columnValuesLoader = (column: string) => {
                const args = {
                  table: {_outputIndex: input.outputIndex},
                  request_json: {
                    aggregations: [{
                      columnName: column,
                      resultColumnName: `count_${column}_`,
                      aggregator: IDashboard.DashboardAggregationType.COUNT,
                    }],
                    groupBy: [column],
                    groups: [],
                    filters: [],
                  },
                };
                if (column in _columnValuesCache) {
                  return _columnValuesCache[column];
                }
                const observable = this.callGetAggregatedTableDataInspection(context, tab, args)
                  .pipe(mergeMap<TabularDataResponse, { columnName: string, values: TTableValue[] }>(res => {
                    const result = { columnName: column, values: [] };
                    if (!res || !res.columns || !res.data) {
                      return of(result);
                    }
                    const columnIndex = res.columns.findIndex(_ => _.name === column);
                    if (columnIndex < 0) {
                      return of(result);
                    }
                    return of({...result, values: res.data.map(row => row[columnIndex]) });
                  }));
                _columnValuesCache[column] = observable.shareReplay(1);
                return tab.activityObserver.observe(observable);
              };
              tab.table.aggregatedDataLoader = (request: TabularDataRequest) => {
                if (!request || !request.groupBy || !request.groupBy.length) {
                  return Observable.of({data: [], columns: [], count: 0});
                }
                const args = { table: {_outputIndex: input.outputIndex}, request_json: request };
                return this.callGetAggregatedTableDataInspection(context, tab, args);
              };
            });
          }
        }
      });
    }
    this._context = context;
  }

  private _createTabs(attachTo: TAttachTo[]): ITab[] {
    return attachTo.map((to: TAttachTo): ITab => {
      return {
        id: 'inputName' in to ? 'input-' + to.inputName : 'output-' + to.outputIndex,
        title: 'inputName' in to ? 'Input ' + to.inputName : 'Output #' + (to.outputIndex + 1),
        attachTo: to,
        activityObserver: new ActivityObserver(),
        inspections: {},
        enabled: false,
        table: {
          input: null,
          ready: false,
          getData: null,
          columnValuesLoader: null,
          aggregatedDataLoader: null,
          columns: [],
        },
      };
    });
  }

  private callGetColumnsInspection(context: CustomComponent.IEDAContext, tab: ITab, args): Observable<{columns: ITableColumn[]}> {
    if (tab.inspections.getColumns) {
      return context.invoker(tab.inspections.getColumns, tab.table.input.stepId, args);
    }
    return context.directInvoker(
      DEFAULT_PACKAGE_NAME,
      DEFAULT_PACKAGE_VERSION,
      DEFAULT_MODULE_NAME,
      DEFAULT_GET_COLUMNS_FUNCTION_NAME,
      tab.table.input.stepId,
      args,
    );
  }

  private callGetTableDataInspection(
    context: CustomComponent.IEDAContext,
    tab: ITab,
    args,
  ): Observable<{data: TTableValue[][], count: number}> {
    if (tab.inspections.getData) {
      return context.invoker(tab.inspections.getData, tab.table.input.stepId, args);
    }
    return context.directInvoker(
      DEFAULT_PACKAGE_NAME,
      DEFAULT_PACKAGE_VERSION,
      DEFAULT_MODULE_NAME,
      DEFAULT_GET_TABLE_DATA_FUNCTION_NAME,
      tab.table.input.stepId,
      args,
    ).pipe(
      catchError(error => {
        this.zone.run(() => {
          tab.table.error = 'Error while fetching table data: ' + error;
        });
        return of({data: [], count: 0});
      }),
    );
  }

  private callGetAggregatedTableDataInspection(context: CustomComponent.IEDAContext, tab: ITab, args): Observable<TabularDataResponse> {
    if (tab.inspections.getAggregatedData) {
      return context.invoker(tab.inspections.getAggregatedData, tab.table.input.stepId, args);
    }
    return context.directInvoker(
      DEFAULT_PACKAGE_NAME,
      DEFAULT_PACKAGE_VERSION,
      DEFAULT_MODULE_NAME,
      DEFAULT_GET_AGGREGATED_TABLE_DATA_FUNCTION_NAME,
      tab.table.input.stepId,
      args,
    ).pipe(
      catchError(error => {
        this.zone.run(() => {
          tab.table.error = 'Error while fetching data for charting: ' + error;
        });
        return of({data: [], columns: [], count: 0});
      }),
    );
  }

  private _getAttributes(columns: ITableColumn[]): ITableColumn[] {
    return columns.filter(_ => _.variableType !== ITable.ColumnVariableType.CONTINUOUS);
  }
  private _getMetrics(columns: ITableColumn[]): ITableColumn[] {
    return columns.filter(_ => _.variableType === ITable.ColumnVariableType.CONTINUOUS);
  }

  private _enableTab(tab: ITab) {
    if (!this._context) {
      return;
    }
    const args = { table: {_outputIndex: tab.table.input.outputIndex} };
    tab.activityObserver.observe(
      this.callGetColumnsInspection(this._context, tab, args),
    ).subscribe(
      result => {
        if ('columns' in result) {
          this.zone.run(() => {
            tab.table.ready = true;
            tab.table.columns = result['columns'] as ITableColumn[];
          });
        }
      },
      error => {
        this.zone.run(() => {
          tab.table.ready = true;
          tab.table.error = error || 'Error while fetching table columns';
        });
      },
    );
  }

  private _reloadTab(tab: ITab) {
    if (!this._context) {
      return;
    }
    tab.table.ready = false;
    tab.table.columns = [];
    tab.table.error = null;
    this._enableTab(tab);
  }
}

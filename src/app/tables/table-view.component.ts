import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import {
  AgGridEvent,
  CellValueChangedEvent,
  ColDef,
  ColumnApi,
  GridApi,
  IServerSideGetRowsParams,
  Module,
  SideBarDef,
  ValueFormatterParams,
} from '@ag-grid-community/core';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { delay } from 'rxjs/operators/delay';
import { switchMap } from 'rxjs/operators/switchMap';
import { ISubscription } from 'rxjs/Subscription';

import config from '../config';
import { IAsset, IBackendList, TObjectId } from '../core/interfaces/common.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { ProcessService } from '../core/services/process.service';
import { AclService } from '../services/acl.service';
import { ActivityObserver } from '../utils/activity-observer';
import { MiscUtils } from '../utils/misc';

import { IDataset } from './dataset.interface';
import { TableHeaderTooltipComponent } from './table-header-tooltip.component';
import { TableViewCommon } from './table-view-common';
import { ITable, ITableColumn, ITableColumnStats, ITableStats } from './table.interface';
import { TableService } from './table.service';
import { TableNumberTitlePipe } from './tables.pipes';

@Component({
  selector: 'table-view',
  providers: [
    DecimalPipe,
  ],
  templateUrl: './table-view.component.html',
})
export class TableViewComponent extends TableViewCommon implements OnDestroy {
  readonly config = config;
  readonly tableViewForm: FormGroup;
  readonly tableViewFormDefaultValue: any;
  readonly tableEditForm: FormGroup;
  readonly _savingObserver = new ActivityObserver();
  readonly _datasetLoadingTooLong: Observable<boolean>;
  readonly EDITABLE_ROW_FLAG_NAME = '__ editable __ row __';

  _statsColumn: string;
  _columnStats: {[p: string]: ITableColumnStats};
  _showStats: boolean = false;
  activeStatsTab: number = 0;
  scope: null | 'all' | 'personal' | 'shared';
  disableTableNameEdit: boolean = true;

  private processSubscription: ISubscription;
  private eventsSubscription: ISubscription;
  private subForTableStatistic: ISubscription;
  private tableSubscription: ISubscription;
  private readonly viewFormSubscription: ISubscription;
  private readonly routeSubscription: ISubscription;
  private readonly _datasetLoadingObserver = new ActivityObserver();
  private readonly _modules: Module[] = [
    ClientSideRowModelModule,
    RichSelectModule,
    ServerSideRowModelModule,
    ColumnsToolPanelModule,
    RowGroupingModule,
    FiltersToolPanelModule,
  ];
  private _defaultColDef: ColDef;
  private columnDefs: ColDef[] = [];
  private gridApi: GridApi;
  private columnApi: ColumnApi;
  private _currentPageSize: number;
  private _frameworkComponents: object;
  private _rowModelType: 'serverSide' | 'clientSide' = 'serverSide';
  private cellValueNotChanged: boolean = true;
  private columnCount: number = 0;
  private isColumnsFittedAlready: boolean = false;
  private _sideBar: SideBarDef;
  private tableNumberTitlePipe: TableNumberTitlePipe = new TableNumberTitlePipe();
  private _currentRowCount: number = 0;
  private isComplexView: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private tables: TableService,
    readonly processes: ProcessService,
    private router: Router,
    private acl: AclService,
    private events: EventService,
  ) {
    super();

    this._defaultColDef = {
      sortable: true,
      minWidth: 100,
      resizable: true,
      tooltipComponent: 'tableHeaderTooltipComponent',
    };

    this._sideBar = {
      toolPanels: [
        {
          id: 'pivots',
          labelDefault: 'Pivots',
          labelKey: 'pivots',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        },
      ],
      hiddenByDefault: true,
      defaultToolPanel: 'pivots',
    };

    this.tableViewForm = new FormGroup({
      order: new FormControl(), // ordering
      page: new FormControl(1),
      page_size: new FormControl(config.table.view.pageSize.tableView),
    });

    this.tableViewFormDefaultValue = this.tableViewForm.value;
    this._currentPageSize = config.table.view.pageSize.tableView;

    this.tableEditForm = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl(null),
    });

    // browse dataset (pagination/sorting)
    this.viewFormSubscription = this.tableViewForm.valueChanges.subscribe((formVal) => {
      if (this.gridApi) {
        this.gridApi.paginationGoToPage(formVal.page - 1);
        this.gridApi.paginationSetPageSize(formVal.page_size);
        this.fixPaginationCount();
        if (!!formVal.order) {
          this.handleGridOrdering(formVal.order);
        }
      }
    });

    this.routeSubscription = this.route.params.subscribe(params => {
      this.scope = params['scope'];
      this.loadTable(params['itemId']);
    });

    this.eventsSubscription = this.events.subscribe(event => {
      if (event.type === IEvent.Type.DELETE_TABLE && this.table.id === event.data.id) {
        this._onDeleteTable();
      }
    });

    this._datasetLoadingTooLong = this._datasetLoadingObserver.active.pipe(switchMap(active => {
      return Observable.of(active).pipe(delay(active ? 300 : 0));
    }));

    this._frameworkComponents = { tableHeaderTooltipComponent: TableHeaderTooltipComponent };
  }

  onGridReady(params: AgGridEvent): void {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.setColumnDefs();
    this.setPinnedRows();

    if (this.acl.canEditTable(this.table)) {
      this.loadDataSet();
    } else {
      this.gridApi.setServerSideDatasource(this.getServerSideDatasource());
    }
  }

  onCellValueChanged(cell: CellValueChangedEvent): void {
    this.cellValueNotChanged = (cell.oldValue === cell.newValue) && this.cellValueNotChanged;
  }

  onSortChanged(params: AgGridEvent) {
    let sortOrder = params.api.getSortModel().map(_ => {
      let column = params.api.getColumnDef(_.colId);
      return _.sort === 'asc' ? column.field : '-' + column.field;
    }).join() || null;

    if (this.tableViewForm.controls.order.value !== sortOrder) {
      this.tableViewForm.controls.order.setValue(sortOrder);
    }
  }

  onColumnChanged(event: AgGridEvent): void {
    let currentView = event.columnApi && (event.columnApi.isPivotMode() || !!event.columnApi.getRowGroupColumns().length);
    if (currentView !== this.isComplexView) {
      this.tableViewForm.controls['page'].setValue(1);
    }
    this.isComplexView = currentView;
  }

  ngOnDestroy() {
    this.viewFormSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
    this.processSubscription && this.processSubscription.unsubscribe();
    this.eventsSubscription && this.eventsSubscription.unsubscribe();
    this.subForTableStatistic && this.subForTableStatistic.unsubscribe();
    this.tableSubscription && this.tableSubscription.unsubscribe();
  }

  saveTable(): void {
    const variableTypeRowIndex = 1;
    this.cellValueNotChanged = true;
    const formValue = this.tableEditForm.value;
    const pinnedVariableTypeRow = this.gridApi.getPinnedTopRow(variableTypeRowIndex).data;

    const columns = this.table.columns
      .filter(column => !!column.variableType) //filter out unnecessary columns
      .map((column, i) => {
        column.variableType = pinnedVariableTypeRow[column.name].toString().toUpperCase();
        return column;
      });

    let data = {
      name: formValue.name,
      description: formValue.description,
      columns: columns,
    };

    if (this.disableTableNameEdit) {
      delete data.name;
    }

    this._savingObserver.observe(this.tables.update(this.table.id, data)).subscribe((_) => this.setTable(_));
  }

  _onDeleteTable() {
    const currentProject = this.route.snapshot.params['projectId'];
    if (currentProject) {
      this.router.navigate(['/desk', 'library', 'projects', currentProject, 'tables']);
    } else {
      const navigateTo = ['/desk', 'library', 'tables'];
      const currentScope = this.route.snapshot.params['scope'];
      if (currentScope) {
        navigateTo.push(currentScope);
      }
      this.router.navigate(navigateTo);
    }
  }

  _canChangeVariableType = (tableColumn: ITableColumn): boolean => {
    return config.table.column.dataType.variableTypes[tableColumn.dataType].length > 1
      && this.table.datasetType === ITable.DatasetType.SOURCE;
  };

  _findColumn = (columnName: string): ITableColumn => {
    return this.table.columns.find(_ => _.name === columnName);
  };

  _isColumnNumeric = (column: ITableColumn): boolean => {
    switch (column.dataType) {
      case ITable.ColumnDataType.INTEGER:
      case ITable.ColumnDataType.DOUBLE:
      case ITable.ColumnDataType.LONG:
        return true;
      default:
        return false;
    }
  };

  enableGroupingPivotingFilteringFunctionality(): void {
    this.columnDefs = this.columnDefs.map( columnDef => ({
      ...columnDef,
      enablePivot: true,
      filter: true,
      enableValue: true,
      enableRowGroup: true,
    }));

    this.gridApi.setColumnDefs(this.columnDefs);
    this.gridApi.setSideBarVisible(true);
  }

  setTable(table: ITable) {
    // init view
    this.table = table;
    this.disableTableNameEdit = !table.current;

    this.tableViewForm.reset(this.tableViewFormDefaultValue);

    // get process (casual)
    if (table.status === this.config.table.status.values.SAVING) {
      this.processSubscription = this.processes.subscribeByTarget(table.id, IAsset.Type.TABLE, () => {
        this.loadTable(table.id, true);
      });
    }

    this._rowModelType = this.acl.canEditTable(table) ? 'clientSide' : 'serverSide';
    this._loadTableStatistic();

    // init form
    this.fillTablesForm(this.tableEditForm, table);
  }

  private loadTable(id: TObjectId, silent?: boolean) {
    if ((this.table && id !== this.table.id) || !silent) {
      this.table = undefined;
      this.tableDataset = undefined;
    }
    // get table and dataset
    this.tableSubscription = this.tables.get(id).subscribe((_) => this.setTable(_));
  }

  private _loadTableStatistic() {
    if ( !(this.table && this.table.status === this.config.table.status.values.ACTIVE) ) return;

    // set numeric column tooltips to default message
    this.setHeaderToolTips(config.tableStats.status.values.PENDING);

    this.tables.getStatistic(this.table.id).subscribe((tableStatistic: ITableStats) => {
      if (tableStatistic.status === this.config.tableStats.status.values.ERROR) {
        this.setHeaderToolTips(tableStatistic.status);
        return;
      }

      if (tableStatistic.status === this.config.tableStats.status.values.PENDING) {
        this.subForTableStatistic && this.subForTableStatistic.unsubscribe();
        this.subForTableStatistic = this.processes.subscribeByTarget(tableStatistic.id, IAsset.Type.TABLE_STATS, () => {
          this._loadTableStatistic();
          this.loadTableToGetTableSize();
        });
        return;
      }

      this.tableStatisticTooltips = tableStatistic.stats.reduce((acc, cur: ITableColumnStats) => {
        acc[cur.columnName] = this._getTableColumnStatisticTooltipContent(cur);
        return acc;
      }, {});

      this._columnStats = tableStatistic.stats.reduce((acc, cur: ITableColumnStats) => {
        acc[cur.columnName] = cur;
        return acc;
      }, {});

      this.setHeaderToolTips(this._columnStats);
    });
  }

  private loadDataSet() {
    // get dataset
    if (this.table && this.table.status === this.config.table.status.values.ACTIVE && this.table.datasetId) {
      let pageParams = this.tableViewForm.value;
      pageParams.page_size = -1;

      this._datasetLoadingObserver.observe(this.tables.getDataset(this.table.id, pageParams))
        .subscribe((dataset: IBackendList<IDataset>) => {
          this.tableDataset = dataset;
          this.perhapsFillRows();
          let rowData = dataset.data.map(item => this.processRowData(item));

          if (this.gridApi) {
            this.gridApi.setRowData(rowData);
            this.enableGroupingPivotingFilteringFunctionality();
            this.fitColumnSize();
            this.fixPaginationCount();
          }
        });
    }
  }

  private loadTableToGetTableSize() {
    if (this.table && !this.table.size) {
      this.tableSubscription && this.tableSubscription.unsubscribe();
      this.tableSubscription = this.tables.get(this.table.id).subscribe(table => this.table = table);
    }
  }

  private getServerSideDatasource = () => {
    return {
      getRows: (params: IServerSideGetRowsParams): void => {
        let pageParams = this.tableViewForm.value;
        pageParams.page = Math.floor(params.request.endRow / this.config.table.view.grid.cacheBlockSize);
        pageParams.page_size = this.config.table.view.grid.cacheBlockSize;

        this._datasetLoadingObserver.observe(this.tables.getDataset(this.table.id, pageParams))
        .subscribe((dataset: IBackendList<IDataset>) => {
          this.tableDataset = dataset;
          let lastRow = dataset.count <= params.request.endRow ? dataset.count : -1;

          this.perhapsFillRows();
          let rowData = dataset.data.map(item => this.processRowData(item));

          params.successCallback(rowData, lastRow);
          this.fixPaginationCount();
          this.fitColumnSize();
        },
        params.failCallback,
        );
      },
    };
  }

  private processRowData(item) {
    return this.columnDefs.reduce((prev, curr, index) => {
      if (item[index] != null && this.table.columns[index].dataType === ITable.ColumnDataType.DOUBLE) {
        prev[curr.field + 'toolTipField'] = this.tableNumberTitlePipe.transform(item[index]);
      }

      prev[curr.field] = item[index];
      return prev;
    }, {});
  }

  private fillTablesForm(form: FormGroup, table: ITable) {
    const canUpdate = this.acl.canUpdateTable(table);
    const tableUpdateFormData = {
      name: table.name,
      description: table.description,
    };
    MiscUtils.fillForm(form, tableUpdateFormData, !canUpdate);
    this.tableEditForm.markAsPristine();
  }

  private fixPaginationCount(): void {
    if (this.gridApi && this._rowModelType === 'clientSide') {
      this._currentRowCount = this.gridApi.paginationGetRowCount();
    } else {
      this._currentRowCount = this.tableDataset.count;
    }

    this._currentPageSize = Math.min(
      this.tableViewForm.controls['page_size'].value,
      this._currentRowCount - (this.tableViewForm.controls.page.value - 1) * this.tableViewForm.controls.page_size.value,
    );
  }

  private setColumnDefs(): void {
    this.columnDefs = this.table.columns.map((column) => {
      return {
        headerName: column.displayName,
        field: column.name,
        tooltipField: column.name + 'toolTipField',
        cellClass: config.table.column.align.htmlClass[column.align],
        editable: (params) => {
          return params.node.rowPinned && !!params.node.data[this.EDITABLE_ROW_FLAG_NAME] && this._canChangeVariableType(column);
        },
        valueFormatter: (params: ValueFormatterParams) => {
          if (params.value != null && _.isFinite(params.value.value || params.value) && column.dataType === ITable.ColumnDataType.DOUBLE) {
            return this['decimalPipe'].transform(params.value.value || params.value, '1.0-3');
          }
          return params.value;
        },
        cellEditorSelector: (params) => {
          if (this._canChangeVariableType(column)) {
            return {
              component: 'agRichSelectCellEditor',
              params: {
                values: [
                  config.table.column.variableType.labels.CATEGORICAL,
                  config.table.column.variableType.labels.CONTINUOUS,
                ],
              },
            };
          }
          return null;
        },
      };
    });

    this.perhapsFillColumns();

    this.gridApi.setColumnDefs(this.columnDefs);
  }

  private setPinnedRows(): void {
    let columnDataTypePinnedRows = this.columnDefs.reduce((prev, curr, index) => {
      prev[curr.field] = config.table.column.dataType.labels[this.table.columns[index].dataType] || 'N/A';
      return prev;
    }, {});

    let columnVariableTypePinnedRows = this.columnDefs.reduce((prev, curr, index) => {
      prev[curr.field] = config.table.column.variableType.labels[this.table.columns[index].variableType] || 'N/A';
      return prev;
    }, {});

    columnVariableTypePinnedRows[this.EDITABLE_ROW_FLAG_NAME] = true;

    this.gridApi.setPinnedTopRowData([columnDataTypePinnedRows, columnVariableTypePinnedRows]);
  }

  private perhapsFillColumns(): void {
    if (this.columnDefs.length < this.config.table.create.defaultColumnCount) {
      let initialLength = this.columnDefs.length;
      let columnsToAdd = this.config.table.create.defaultColumnCount - this.columnDefs.length;

      let newColumnDefs = Array(columnsToAdd).fill('').map((_, index) => this.generateColumn(initialLength + index));
      let newTableColumns = newColumnDefs.map((column: ColDef): ITableColumn => {
        return <ITableColumn> {
          name: column.field,
          displayName: column.headerName,
          align: ITable.ColumnAlign.CENTER,
        };
      });

      this.columnDefs = this.columnDefs.concat(newColumnDefs);
      this.table.columns = this.table.columns.concat(newTableColumns);
    }
  }

  private perhapsFillRows(): void {
    if (this.tableDataset.count < this.config.table.create.defaultRowCount) {
      let rowsToAdd = this.config.table.create.defaultRowCount - this.tableDataset.count;
      let sampleRows = Array(this.columnDefs.length).fill('');

      this.tableDataset.data = this.tableDataset.data.concat(Array(rowsToAdd).fill(sampleRows));
      this.tableDataset.count = this.config.table.create.defaultRowCount;
    }
  }

  private generateColumn(index: number): ColDef {
    return {
      ...this.tables.generateColumn(index, ++this.columnCount),
      sortable: false,
    };
  }

  private setHeaderToolTips(val: string | object) {
    if (!!this.columnApi) {
      let columnDefs: ColDef[] = this.columnApi.getAllGridColumns().map(_ => {
        let tooltip;
        if (typeof val === 'string') {
          tooltip = val;
        }
        return {..._.getColDef(), headerTooltip: tooltip || JSON.stringify(val[_.getColDef().field])};
      });

      this.gridApi.setColumnDefs(columnDefs);
    }
  }

  private fitColumnSize(): void {
    if (!!this.gridApi && !this.isColumnsFittedAlready) {
      this.gridApi.sizeColumnsToFit();
      this.isColumnsFittedAlready = true;
    }
  }

  private handleGridOrdering(formValOrder: string): void {
    let columnSortModel = this.generateColumnSortModelFromOrderVal(formValOrder);
    this.UpdateGridSortModelIfNotUpdatedAlready(columnSortModel);
  }

  private generateColumnSortModelFromOrderVal(orderVal: string): object[] {
    let orders = orderVal.split(',');
    let columnSortModel = [];
    let columnDefs = this.columnApi.getAllColumns().reduce((acc, cur) => {
      let key = cur.getColDef().field;
      let val = cur.getColId();
      acc[key] = val;
      return acc;
    }, {});

    orders.forEach((order: string) => {
      let columnName = order;
      if (order.indexOf('-') === 0) {
        columnName = order.slice(1);
        columnSortModel.push({ colId: columnDefs[columnName], sort: 'desc' });
      } else {
        columnSortModel.push({ colId: columnDefs[columnName], sort: 'asc' });
      }
    });

    return columnSortModel;
  }

  private UpdateGridSortModelIfNotUpdatedAlready(columnSortModel: object[]): void {
    let isAlreadySorted: boolean = true;
    let gridSortModel = this.gridApi.getSortModel();

    gridSortModel.forEach((val, index) => {
      isAlreadySorted = isAlreadySorted && _.isEqual(val, columnSortModel[index]);
    });

    if (!isAlreadySorted || gridSortModel.length !== columnSortModel.length) {
      this.gridApi.setSortModel(columnSortModel);
    }
  }
}

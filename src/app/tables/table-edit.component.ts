import { Location } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { AgGridEvent, CellPosition, CellValueChangedEvent, ColDef, ColumnApi, GridApi, Module, RowNode } from '@ag-grid-community/core';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { delay } from 'rxjs/operators/delay';
import { switchMap } from 'rxjs/operators/switchMap';
import { ISubscription } from 'rxjs/Subscription';

import config from '../config';
import { IAsset, IBackendList, TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { NotificationService } from '../core/services/notification.service';
import { ProcessService } from '../core/services/process.service';
import { AclService } from '../services/acl.service';
import { ActivityObserver } from '../utils/activity-observer';
import { Csv } from '../utils/backend';
import { MiscUtils } from '../utils/misc';

import { IDataset } from './dataset.interface';
import { TableItemDeleteModalComponent } from './table-item-delete-modal.component';
import { TableSetColumnNameModalComponent } from './table-set-column-name-modal.component';
import { TableViewCommon } from './table-view-common';
import { ITable } from './table.interface';
import { ITableImport, TableService } from './table.service';

@Component({
  selector: 'table-edit',
  templateUrl: './table-edit.component.html',
})
export class TableEditComponent extends TableViewCommon implements OnChanges, OnDestroy {
  @Input() tableConfig: any;
  @ViewChild('setColumnNameModal') readonly setColumnNameModal: TableSetColumnNameModalComponent;
  @ViewChild('itemDelteModal') readonly deleteItemModal: TableItemDeleteModalComponent;

  readonly config = config;
  readonly tableViewForm: FormGroup;
  readonly tableViewFormDefaultValue: any;
  readonly tableEditForm: FormGroup;
  readonly _savingObserver = new ActivityObserver();
  readonly _datasetLoadingTooLong: Observable<boolean>;
  private eventsSubscription: ISubscription;
  private processSubscription: ISubscription;
  private readonly viewFormSubscription: ISubscription;
  private readonly routeSubscription: ISubscription;
  private readonly _datasetLoadingObserver = new ActivityObserver();
  private readonly _modules: Module[] = [
    ClientSideRowModelModule,
    ClipboardModule,
    CsvExportModule,
  ];
  private _defaultColDef: ColDef;
  private columnDefs: ColDef[] = [];
  private gridApi: GridApi;
  private _currentPageSize: number;
  private cellValueNotChanged: boolean = true;
  private columnCount: number = 0;
  private columnAddToRight: boolean = false;
  private columnApi: ColumnApi;
  private editMode: ITable.EditMode = ITable.EditMode.EDIT;
  private _assetItem: ITable[] = [];
  private scope: null | 'all' | 'personal' | 'shared';
  private newColumnMapper: object = {};
  private _isProcessingTable: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private tables: TableService,
    private router: Router,
    private acl: AclService,
    private events: EventService,
    private notifications: NotificationService,
    private processes: ProcessService,
    private _location: Location,
  ) {
    super();

    this._defaultColDef = {
      sortable: true,
      editable: true,
      minWidth: 100,
      resizable: true,
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
      variableTypes: new FormArray([]),
      columnTypes: new FormArray([]),
      description: new FormControl(null),
    });

    // browse dataset (pagination/sorting)
    this.viewFormSubscription = this.tableViewForm.valueChanges.subscribe((_) => {
      if (this.gridApi) {
        this.gridApi.paginationGoToPage(_.page - 1);
        this.gridApi.paginationSetPageSize(_.page_size);
        this.setCurrentPageSize();
      }
    });

    this.routeSubscription = this.route.params.subscribe(params => this.selectViewMode(params));

    this.eventsSubscription = this.events.subscribe(event => {
      if (event.type === IEvent.Type.DELETE_TABLE && this.table.id === event.data.id) {
        this._navigateToListPage();
      }
    });

    this._datasetLoadingTooLong = this._datasetLoadingObserver.active.pipe(switchMap(active => {
      return Observable.of(active).pipe(delay(active ? 300 : 0));
    }));
  }

  ngOnChanges(params: SimpleChanges): void {
    let tableConfig = params['tableConfig'];
    if (tableConfig) {
      this.tableConfig = tableConfig.currentValue;
      MiscUtils.fillForm(this.tableEditForm, this.tableConfig, false);
      this.tableEditForm.markAsPristine();
    }
  }

  ngOnDestroy(): void {
    this.viewFormSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
    this.eventsSubscription && this.eventsSubscription.unsubscribe();
    this.processSubscription && this.processSubscription.unsubscribe();
  }

  onGridReady(params: AgGridEvent): void {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.perhapsFillTable();
    let rowData = this.tableDataset.data.map((item) =>
      this.columnDefs.reduce((prev, curr, index) =>
        this.addProp(prev, curr.field, (item[index] || '')), {}));
    let columnKey = this.columnDefs.length > 0
                    ? this.columnDefs[0].field
                    : undefined;

    this.gridApi.setRowData(rowData);
    this.gridApi.setColumnDefs(this.columnDefs);
    this.gridApi.sizeColumnsToFit();
    this.setGridFocus(0, columnKey);
  }

  onCellValueChanged(cell: CellValueChangedEvent): void {
    this.cellValueNotChanged = (cell.oldValue === cell.newValue) && this.cellValueNotChanged;
  }

  selectViewMode = (params: Params): void => {
    this.editMode = this.route.snapshot.data.mode;

    if (this.editMode === ITable.EditMode.EDIT) {
      if (this.isScopeExist(params)) {
        this.loadTable(params['itemId']);
      }
    } else if (this.editMode === ITable.EditMode.CREATE) {
      this.populateTableDataset();
    } else {
      this._navigateToListPage();
    }
  }

  isScopeExist(params: Params): boolean {
    const SCOPES = [
      'all',
      'personal',
      'shared',
    ];

    this.scope = params['scope'];
    const itemId = params['itemId'];
    if (!SCOPES.includes(this.scope)) {
      this.router.navigate(['/desk', 'library', 'tables', 'personal', itemId, 'edit'], {replaceUrl: true});
      return false;
    }

    return true;
  }

  populateTableDataset(): void {
    let defaultColumnCount = this.config.table.create.defaultColumnCount;
    let defaultRowCount = this.config.table.create.defaultRowCount;
    this.columnDefs = Array(defaultColumnCount).fill('').map((_, index) => this.tables.generateColumn(index, ++this.columnCount));
    this.columnDefs.forEach(this.addToNewColumnMapper(true));

    let sampleRow = Array(defaultColumnCount).fill('');

    this.tableDataset = {
      data: Array(defaultRowCount).fill(sampleRow),
      count: defaultRowCount,
    };
    this.table = <ITable> {
      status: ITable.Status.ACTIVE,
      columns: [],
      datasetType: ITable.DatasetType.SOURCE,
    };
    this.setCurrentPageSize();
  }

  fixFocusAfterAction(action: any, actionType: ITable.TableOperation, val: any): void {
    let selectedCell = this.gridApi.getFocusedCell();
    let colKey: string;
    let index: number;
    if (selectedCell) {
      index = selectedCell.rowIndex + (val.addedIndex || 0);
      switch (actionType) {
        case ITable.TableOperation.Add_ROW:
        case ITable.TableOperation.DELETE_ROW:
          colKey = selectedCell.column.getColId();
          break;
        case ITable.TableOperation.ADD_COLUMN:
          colKey = this.tables.generateColumnField(++this.columnCount);
          break;
        case ITable.TableOperation.DELETE_COLUMN:
          let column = this.columnApi.getDisplayedColAfter(selectedCell.column) ||
                       this.columnApi.getDisplayedColBefore(selectedCell.column);
          colKey = column ? column.getColId() : '';
        break;
        default:
          throw new Error(' table operation could not be found');
      }
      let value = {
        index: index,
        colKey: colKey,
        columnName: val.columnName,
      };

      action(value, selectedCell);
    } else {
      index = (val.addedIndex || 0);
      switch (actionType) {
        case ITable.TableOperation.Add_ROW:
          if (!this.columnDefs.length) {
            this.notifications.create('Please add columns first', this.config.notification.level.values.DANGER);
            return;
          }
          colKey = this.columnDefs[0].field;
          break;
        case ITable.TableOperation.ADD_COLUMN:
          colKey = this.tables.generateColumnField(++this.columnCount);
          break;
        default:
          throw new Error('table operation could not be found');
      }
      let value = {
        index: index,
        colKey: colKey,
        columnName: val.columnName,
      };
      action(value, selectedCell);
    }

    if (this.columnDefs.length && this.tableDataset.count) {
      this.setGridFocus(index, colKey);
      this.cellValueNotChanged = false;
    } else {
      this.cellValueNotChanged = true;
    }
  }

  addRow = (val: any): void => {
    if (!this.columnDefs.length) {
      return;
    }

    let row = this.columnDefs.reduce((prev, curr) => this.addProp(prev, curr.field, ''), {});
    this.gridApi.updateRowData({
      add: [row],
      addIndex: val.index,
    });

    this.tableDataset.count += 1;
    this.setCurrentPageSize();
  }

  addColumn = (val: any, selectedCell: CellPosition): void  => {
    let colIndex = this.getColumnIndex(selectedCell);
    let column = {headerName: val.columnName, field: val.colKey};
    this.newColumnMapper[column.field] = true;
    this.columnDefs.splice(colIndex, 0, column);
    this.gridApi.setColumnDefs(this.columnDefs);
    this.columnApi.moveColumn(val.colKey, colIndex);
    this.columnAddToRight = false;
  }

  deleteRow = (): void => {
    let rows = this.gridApi.getSelectedRows();
    this.gridApi.updateRowData({
      remove: rows,
    });
    this.tableDataset.count = this.gridApi.getDisplayedRowCount();
    this.setCurrentPageSize();
  }

  deleteColumn = (_: any, selectedCell: CellPosition): void => {
    let colIndex = this.getColumnIndex(selectedCell);
    this.columnDefs.splice(colIndex, 1);
    this.gridApi.setColumnDefs(this.columnDefs);
    delete this.newColumnMapper[selectedCell.column.getColId()];

    if (!this.columnDefs.length) {
      this.tableDataset = {
        data: [],
        count: 0,
      };
      this.gridApi.setRowData([]);
      this.tableViewForm.controls['page'] = new FormControl(1);
      this.setCurrentPageSize();
    }
  }

  insertRowAbove(): void {
    this.fixFocusAfterAction(this.addRow, ITable.TableOperation.Add_ROW, {addedIndex: 0});
  }

  insertRowBelow(): void {
    this.fixFocusAfterAction(this.addRow, ITable.TableOperation.Add_ROW, {addedIndex: 1});
  }

  insertColumnLeft(): void {
    this.setColumnNameModal.show();
  }

  insertColumnRight(): void {
    this.columnAddToRight = true;
    this.setColumnNameModal.show();
  }

  insertColumn(val: any): void {
    this.fixFocusAfterAction(this.addColumn, ITable.TableOperation.ADD_COLUMN, val);
  }

  shouldDeleteItem(itemType: string): void {
    if (itemType === 'column') {
      let selectedCell = this.gridApi.getFocusedCell();
      if (!this.tableDataset.count) {
        this.notifications.create('Please select a cell to delete the corresponding column', this.config.notification.level.values.DANGER);
        return;
      }
      if (!selectedCell) {
        if (!this.columnDefs.length) {
          this.notifications.create('There is no column to delete', this.config.notification.level.values.DANGER);
        } else {
          this.notifications.create('Please select a cell to delete the corresponding column', this.config.notification.level.values.DANGER);
        }
        return;
      }
      let item = {
        itemType: 'column',
        names: [selectedCell.column.getColDef().headerName],
      };

      this.deleteItemModal.show(item);
    } else if (itemType === 'row') {
      let item = {
        itemType: 'row',
        count: this.gridApi.getSelectedRows().length,
      };

      if (item.count) {
        this.deleteItemModal.show(item);
      } else {
        if (!this.tableDataset.count) {
          this.notifications.create('There is no row to delete', this.config.notification.level.values.DANGER);
        } else {
          this.notifications.create('Please select a row to delete', this.config.notification.level.values.DANGER);
        }
      }
    }
  }

  deleteItem(itemType: string): void {
    if (itemType === 'column') {
      this.fixFocusAfterAction(this.deleteColumn, ITable.TableOperation.DELETE_COLUMN, {});
    } else if (itemType === 'row') {
      this.fixFocusAfterAction(this.deleteRow, ITable.TableOperation.DELETE_ROW, {});
    }
  }

  shouldRenameColumn(): void {
    if (!this.tableDataset.count) {
      this.notifications.create('Please select a cell to rename the corresponding column', this.config.notification.level.values.DANGER);
      return;
    }
    let selectedCell = this.gridApi.getFocusedCell();
    if (selectedCell) {
      let columnName = selectedCell.column.getColDef().headerName;
      this.setColumnNameModal.show(columnName);
    } else {
      if (!this.columnDefs.length) {
        this.notifications.create('There is no column to rename', this.config.notification.level.values.DANGER);
      } else {
        this.notifications.create('Please select a cell to rename the corresponding column', this.config.notification.level.values.DANGER);
      }
    }
  }

  renameColumn(value): void {
    let selectedCell = this.gridApi.getFocusedCell();
    let colIndex = this.getColumnIndex(selectedCell);
    let column = this.columnDefs[colIndex];
    this.cellValueNotChanged = (column.headerName === value.columnName) && this.cellValueNotChanged;
    column.headerName = value.columnName;
    this.columnDefs.splice(colIndex, 1, column);
    this.gridApi.setColumnDefs(this.columnDefs);
    this.setGridFocus(selectedCell.rowIndex, column.field);
  }

  getColumnIndex(selectedCell: CellPosition): number {
    let addedIndex: number = this.columnAddToRight ? 1 : 0;
    if (selectedCell) {
      return this.columnDefs.indexOf(selectedCell.column.getUserProvidedColDef()) + addedIndex;
    }

    return addedIndex;
  }

  setGridFocus(rowIndex: number, colKey: string): void {
    let rowNodes = this.gridApi.getRenderedNodes();
    this.gridApi.setFocusedCell(rowIndex, colKey);

    if (rowNodes.length > rowIndex) {
      this.gridApi.deselectAll();
      let rowNodeId: string = rowNodes[rowIndex].id;
      this.gridApi.getRowNode(rowNodeId).setSelected(true);
    }
  }

  saveTable(): void {
    this._isProcessingTable = true;
    this.cellValueNotChanged = true;
    const name: string = this.tableEditForm.controls['name'].value;
    const csvFile = new File([this.getCsvData()], name, {type: 'text/csv'});

    const importParams: ITableImport = {
      format: 'csv',
      name: name,
      description: this.tableEditForm.controls['description'].value,
      nullValue: undefined,
      delimiter: ',',
    };

    if (this.editMode === ITable.EditMode.EDIT) {
      this._savingObserver.observe(this.tables.saveVersion(
        this.table.parentId,
        csvFile,
        importParams,
      )).subscribe((table) => this.processTableSaving(table));
    } else if (this.editMode === ITable.EditMode.CREATE) {
      this._savingObserver.observe(this.tables.import(
        csvFile,
        importParams,
      )).subscribe((table) => this.processTableSaving(table));
    }
  }

  getListPageUrl(): string[] {
    const navigateTo = ['/desk', 'library', 'tables'];
    const currentScope = this.route.snapshot.params['scope'];
    if (currentScope) {
      navigateTo.push(currentScope);
    }
    return navigateTo;
  }

  _navigateToListPage(): void {
    const currentProject = this.route.snapshot.params['projectId'];
    if (currentProject) {
      this.router.navigate(['/desk', 'library', 'projects', currentProject, 'tables']);
    } else {
      this.router.navigate(this.getListPageUrl());
    }
  }

  updateCurrentUrl(tableId: TObjectId): void {
    let navigateTo = this.getListPageUrl();
    navigateTo.push(tableId, 'edit');
    let newUrl = this.router.createUrlTree(navigateTo).toString();
    this._location.go(newUrl);
  }

  processTableSaving(table: ITable): void {
    this.editMode = ITable.EditMode.EDIT;
    this.table = table;
    this.updateCurrentUrl(table.id);

    if (table.status === ITable.Status.SAVING) {
      this.processSubscription = this.processes.subscribeByTarget(table.id, IAsset.Type.TABLE, this.handleProcess);
    }

    this.notifications.create('The table is currently being processed. You can still modify the table. You will be able to click the update button after the process is completed.');
  }

  handleProcess = (process: IProcess): void => {
    if (process.status === IProcess.Status.COMPLETED) {
      this.notifications.create('Table upload is completed. You can now save it again!');
      this._isProcessingTable = false;
    } else if (process.status === IProcess.Status.FAILED) {
      this.notifications.create('Table upload is failed. However, you can now save it again!', config.notification.level.values.DANGER);
      this._isProcessingTable = false;
    }
  }

  cancel(): void {
    const navigateTo = ['/desk', 'library', 'tables'];
    const currentScope = this.route.snapshot.params['scope'];
    if (currentScope) {
      navigateTo.push(currentScope);
    }
    if (this.editMode === ITable.EditMode.EDIT) {
      let tableId = _.get(this.table, 'id') || this.route.snapshot.params['itemId'];
      navigateTo.push(tableId);
    }

    this.router.navigate(navigateTo);
  }

  perhapsSetTable(table: ITable) {
    this.acl.canEditTable(table)
    ? this._setTable(table)
    : this.cancel();
  }

  private loadTable(id: TObjectId, silent?: boolean): void {
    if ((this.table && id !== this.table.id) || !silent) {
      this.table = undefined;
      this.tableDataset = undefined;
    }
    // get table and dataset
    this.tables.get(id).subscribe(_ => this.perhapsSetTable(_));
  }

  private _setTable(table: ITable): void {
    // init view
    this.table = table;
    this._assetItem = [table];

    // process column definitions
    this.columnDefs = table.columns.map(_ => Object.assign({}, {headerName: _.displayName, field: this.tables.generateColumnField(++this.columnCount)}));
    this.columnDefs.forEach(this.addToNewColumnMapper(false));

    this.tableViewForm.reset(this.tableViewFormDefaultValue);

    this.loadDataSet();

    // init form
    this.fillTablesForm(this.tableEditForm, table);
  }

  private loadDataSet(): void {
    // get dataset
    if (this.table && this.table.status === this.config.table.status.values.ACTIVE && this.table.datasetId) {
      let defaultPageParams = {
        page: 1,
        page_size: -1,
      };

      this._datasetLoadingObserver.observe(this.tables.getDataset(this.table.id, defaultPageParams))
      .subscribe((dataset: IBackendList<IDataset>) => {
        this.tableDataset = dataset;

        this.setCurrentPageSize();
      });
    }
  }

  private addProp(seed: Object, key: string, val: any): object {
    seed[key] = val;
    return seed;
  }

  private fillTablesForm(form: FormGroup, table: ITable): void {
    const canUpdate = this.acl.canUpdateTable(table);
    const tableUpdateFormData = {
      name: table.name,
      variableTypes: table.columns.map(column => column.variableType),
      columnTypes: table.columns.map(column => column.columnType),
      description: table.description,
    };
    MiscUtils.fillForm(form, tableUpdateFormData, !canUpdate);
    this.tableEditForm.markAsPristine();
  }

  private setCurrentPageSize(): void {
    this._currentPageSize = Math.min(
      this.tableViewForm.controls['page_size'].value,
      this.tableDataset.count - (this.tableViewForm.controls.page.value - 1) * this.tableViewForm.controls.page_size.value,
    );
  }

  private getCsvData(): string {
    return Csv.fromArray(this.prepareData());
  }

  private prepareData(): any[] {
    let columns = this.columnApi.getAllGridColumns().map(_ => _.getColId());
    let csvArray = [this.columnApi.getAllGridColumns().map(_ => _.getColDef().headerName)];
    let columnToRemoveMapper = columns.map(colId => this.newColumnMapper[colId]);

    this.gridApi.forEachNode(this.processArrayAndFindRemovableColumns(columns, csvArray, columnToRemoveMapper));

    return this.getFilteredArray(csvArray, columnToRemoveMapper);
  }

  private getFilteredArray(csvArray: any[], columnToRemoveMapper: boolean[]): any[] {
    if (columnToRemoveMapper.some(item => item)) {
      return csvArray.map(row => row.filter((_, index) => !columnToRemoveMapper[index]));
    }

    return csvArray;
  }

  private processArrayAndFindRemovableColumns = (columns: string[], csvArray: any[], columnToRemoveMapper: boolean[]) => {
    return (rowNode: RowNode) => {
      let isEmptyRow = true;
      let arr = columns.map((columnId, index) => {
        if (rowNode.data[columnId] && rowNode.data[columnId].toString().trim()) {
          isEmptyRow = false;
          columnToRemoveMapper[index] = false;
        }
        return rowNode.data[columnId] || ' ';
      });

      if (!isEmptyRow) {
        csvArray.push(arr);
      }
    };
  }

  private perhapsFillTable() {
    this.perhapsFillColumns();
    this.perhapsFillRows();
  }

  private perhapsFillColumns() {
    if (this.columnDefs.length < this.config.table.create.defaultColumnCount) {
      let initialLength = this.columnDefs.length;
      let columnsToAdd = this.config.table.create.defaultColumnCount - this.columnDefs.length;
      let newColumns = Array(columnsToAdd).fill('').map((_, index) => this.tables.generateColumn(initialLength + index, ++this.columnCount));
      this.columnDefs = this.columnDefs.concat(newColumns);
      newColumns.forEach(this.addToNewColumnMapper(true));
    }
  }

  private perhapsFillRows() {
    if (this.tableDataset.count < this.config.table.create.defaultRowCount) {
      let rowsToAdd = this.config.table.create.defaultRowCount - this.tableDataset.count;
      let sampleRows = Array(this.columnDefs.length).fill('');
      this.tableDataset.data = this.tableDataset.data.concat(Array(rowsToAdd).fill(sampleRows));
      this.tableDataset.count = this.config.table.create.defaultRowCount;
    }
  }

  private addToNewColumnMapper = (isNew: boolean) => {
    return (item: ColDef): void => {
      this.newColumnMapper[item.field] = isNew;
    };
  }
}

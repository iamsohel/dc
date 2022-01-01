import { APP_BASE_HREF } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { AgGridEvent, CellPosition, Column, ColumnApi, GridApi, RowNode } from '@ag-grid-community/core';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { PluralizePipe } from '../core-ui/core-ui.pipes';
import { IProcess } from '../core/interfaces/process.interface';
import { EventService } from '../core/services/event.service';
import { NotificationService } from '../core/services/notification.service';
import { ProcessService } from '../core/services/process.service';
import { UserService } from '../core/services/user.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { NotificationServiceMock } from '../mocks/notification.service.mock';
import { AclService } from '../services/acl.service';

import { TableEditComponent } from './table-edit.component';
import { ITable } from './table.interface';
import { TableService } from './table.service';

class MockActivatedRoute {
  params: any;
  snapshot: any;

  constructor() {
    this.params = new ReplaySubject(1);
  }
}

class MockUserService {
  data: any;

  constructor() {
    this.data = {
      observable: new ReplaySubject<any>(1),
    };
  }

  token() {
    return '';
  }

  getUser() {
    return { id: '' };
  }
}

class MockTableService {
  observables: any;
  data: any;

  constructor() {
    this.observables = {
      view: {
        subscribe: () => {},
      },
    };
    this.data = {
      view: {
        id: '101',
        ownerId: '1',
        datasetId: '101',
        name: 'TableA',
        status: config.table.status.values.ACTIVE,
        created: '2016-04-04 04:04',
        updated: '2016-07-07 07:07',
        options: {
          indexes: ['1', '2', '3'],
        },
        columns: [
          {
            id: '1',
            name: 'ColumnA',
            displayName: 'columnA',
            dataType: 'Integer',
            variableType: 'Continuous',
          },
          {
            id: '2',
            name: 'ColumnB',
            displayName: 'ColumnB',
            dataType: 'String',
            variableType: 'Continuous',
          },
          {
            id: '3',
            name: 'ColumnC',
            dispalyName: 'ColumnC',
            dataType: 'String',
            variableType: 'Continuous',
          },
        ],
      },
    };
  }

  view() {
  }

  exportUrl() {
    return '';
  }

  getDataset(id: string, data: any) {
    let o = new ReplaySubject(1);
    o.next({
      data: [],
    });

    return o;
  }

  get(id: string) { return Observable.of(this.data.view); }

  generateColumn(index, columnCount) {
    return {
      headerName: '' + (index + 1),
      field: columnCount.toString(),
    };
  }

  generateColumnField(columnCount) {
    return columnCount.toString();
  }
}


class MockProcessService {
  subscribeByTarget(_, __, ___): Subscription {
    return new Subscription();
  }
}

class MockRouter {
  navigate: jasmine.Spy;
  createUrlTree(_) { return ''; }
}

class MockGridApi extends GridApi {
  sizeColumnsToFit() {}
  setFocusedCell(index, key) {}
  getFocusedCell(): CellPosition {
    return {
      rowIndex: 0,
      rowPinned: undefined,
      column: new Column({}, {}, 'id', false),
    };
  }
  setRowData(rowData) {}
  updateRowData(rowDataTransaction) {
    return rowDataTransaction;
  }
  setColumnDefs(colDef) {}
  getSelectedRows() { return []; }
  getDisplayedRowCount() { return 1; }
  getRenderedNodes() { return []; }
  getRowNode(nodeId) { return new RowNode(); }
  forEachNode(callback) {}
  paginationGoToPage(pageNo) {}
  paginationSetPageSize(size) {}
}

class MockColumnApi extends ColumnApi {
  moveColumn() {}
  getDisplayedColAfter(key) { return new Column({}, {}, 'colId', false); }
  getDisplayedColBefore(key) { return new Column({}, {}, 'colId', false); }
  getAllGridColumns() { return []; }
}

describe('Functionallity of TableEditComponent ', () => {
  let route = new MockActivatedRoute(),
    router = new MockRouter(),
    userService = new MockUserService(),
    tableService = new MockTableService(),
    processService = new MockProcessService(),
    fixture: ComponentFixture<TableEditComponent>,
    component: TableEditComponent,
    gridApi = new MockGridApi(),
    columnApi = new MockColumnApi(),
    notifications = new NotificationServiceMock();
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: UserService, useValue: userService },
        { provide: TableService, useValue: tableService },
        { provide: ProcessService, useValue: processService },
        { provide: Router, useValue: router},
        { provide: NotificationService, useValue: notifications },
        { provide: EventService, useClass: EventServiceMock },
        AclService,
        { provide: APP_BASE_HREF, useValue: '/' },
      ],
      imports: [
        RouterTestingModule,
      ],
      declarations: [
        TableEditComponent,
        PluralizePipe,
      ],
      schemas: [
        NO_ERRORS_SCHEMA,
      ],
    })
    .compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(TableEditComponent);
      component = fixture.componentInstance;

      component.tableDataset = {
        data: [],
        count: 0,
      };
      component['columnDefs'] = [];
      component['gridApi'] = gridApi;
      component['columnApi'] = columnApi;

      spyOn(component, 'getColumnIndex').and.returnValue(0);
      spyOn(component, 'setGridFocus');
    });
  }));

  it('should use 3 modules (ClientSideRowModel, Clipboard, CsvExport) for AG Grid', () => {
    let modules = [ClientSideRowModelModule, ClipboardModule, CsvExportModule];
    expect(component['_modules']).toEqual(modules);
  });

  it('should redirect if the table size is less than or equal to the threshold value but status is not active', () => {
    spyOn(component, 'cancel');
    let table = Object.assign(tableService.data.view, { size: config.table.edit.threshold, status: ITable.Status.INACTIVE });

    component.perhapsSetTable(table);

    expect(component.cancel).toHaveBeenCalledTimes(1);
  });

  it('should redirect if the table status is active but size is more than the threshould value', () => {
    spyOn(component, 'cancel');
    let table = Object.assign(tableService.data.view, { size: config.table.edit.threshold + 1, status: ITable.Status.ACTIVE });

    component.perhapsSetTable(table);

    expect(component.cancel).toHaveBeenCalledTimes(1);
  });

  it('should not redirect if the table size is less than or equal to the threshould value and status is active', () => {
    spyOn(component, 'cancel');
    let table = Object.assign(tableService.data.view, { size: config.table.edit.threshold, status: ITable.Status.ACTIVE });

    component.perhapsSetTable(table);

    expect(component.table.size).toEqual(table.size);
    expect(component.cancel).not.toHaveBeenCalled();
  });

  it('should focus on the first cell when grid is ready', () => {
    let columnKey = 'columnKey';
    component['columnDefs'] = [{
      field: columnKey,
    }];
    let mockGridParams: AgGridEvent = {
      api: gridApi,
      columnApi: columnApi,
      type: 'GridReady',
    };

    component.onGridReady(mockGridParams);
    expect(component.setGridFocus).toHaveBeenCalledWith(0, columnKey);
  });

  it('should create new rows if there are less rows than the configured amount', () => {
    let mockGridParams: AgGridEvent = {
      api: gridApi,
      columnApi: columnApi,
      type: 'GridReady',
    };
    component.config.table.create.defaultRowCount = 10;

    component.onGridReady(mockGridParams);

    expect(component['tableDataset'].count).toEqual(10);
    expect(component['tableDataset'].data.length).toEqual(10);
  });

  it('should create new columns if there are less columns than the configured amount', () => {
    let mockGridParams: AgGridEvent = {
      api: gridApi,
      columnApi: columnApi,
      type: 'GridReady',
    };
    let defaultColumnCount = 10;
    component.config.table.create.defaultColumnCount = defaultColumnCount;

    component.onGridReady(mockGridParams);

    expect(component['columnDefs'].length).toEqual(defaultColumnCount);
  });

  it('should update newColumnMapper array if columns are added', () => {
    let mockGridParams: AgGridEvent = {
      api: gridApi,
      columnApi: columnApi,
      type: 'GridReady',
    };
    component['columnDefs'] = [{
      field: 'columnKey',
    }];
    component.config.table.create.defaultColumnCount = 4;
    let newColumnNeeded = component.config.table.create.defaultColumnCount - component['columnDefs'].length;

    component.onGridReady(mockGridParams);

    let newColumnCountFromMapper = _.values(component['newColumnMapper']).filter(val => val).length;
    expect(newColumnCountFromMapper).toEqual(newColumnNeeded);
  });

  it('should redirect to personal scope if no scope is provided', () => {
    router.navigate = jasmine.createSpy('navigate');
    let params: Params = {
      itemId: '103',
    };

    component.isScopeExist(params);

    expect(router.navigate).toHaveBeenCalledWith(['/desk', 'library', 'tables', 'personal', '103', 'edit'], {replaceUrl: true});
  });

  it('should not redirect if defined scope is provided', () => {
    router.navigate = jasmine.createSpy('navigate');
    let params: Params = {
      itemId: '103',
      scope: 'all',
    };

    component.isScopeExist(params);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  describe('View Mode Selectiontion', () => {
    it('should set component editMode while selecting the specific view', () => {
      component['editMode'] = ITable.EditMode.EDIT;
      route.snapshot = {
        data: {
          mode: ITable.EditMode.CREATE,
        },
      };

      component.selectViewMode({});

      expect(component['editMode']).toEqual(ITable.EditMode.CREATE);
    });

    it('should check for scopes if current mode is edit mode', () => {
      let params = {
        itemId: '101',
        scope: 'personal',
      };
      route.snapshot = {
        data: {
          mode: ITable.EditMode.EDIT,
        },
        params: params,
      };
      spyOn(component, 'isScopeExist');

      component.selectViewMode(params);

      expect(component.isScopeExist).toHaveBeenCalledWith(params);
    });

    it('should load table if desired scope exists and current mode is edit mode', () => {
      let params = {
        itemId: '101',
        scope: 'personal',
      };
      route.snapshot = {
        data: {
          mode: ITable.EditMode.EDIT,
        },
        params: params,
      };
      spyOn(component, 'isScopeExist').and.returnValue(true);
      component['loadTable'] = jasmine.createSpy('loadTable');

      component.selectViewMode(params);

      expect(component.isScopeExist).toHaveBeenCalledWith(params);
      expect(component['loadTable']).toHaveBeenCalled();
    });

    it('should populate dataset if the current mode is create mode', () => {
      let params = {};
      route.snapshot = {
        data: {
          mode: ITable.EditMode.CREATE,
        },
      };
      spyOn(component, 'populateTableDataset');

      component.selectViewMode(params);

      expect(component.populateTableDataset).toHaveBeenCalled();
    });

    it('should should navigate to list page if appropirate mode is not provided', () => {
      let params = {};
      route.snapshot = {
        data: { },
      };
      spyOn(component, '_navigateToListPage');

      component.selectViewMode(params);

      expect(component._navigateToListPage).toHaveBeenCalled();
    });
  });

  describe('populateTableDataset functionalities', () => {
    it('should create as many new columns as configured', () => {
      component['columnDefs'] = [];

      component.populateTableDataset();

      expect(component['columnDefs'].length).toEqual(component.config.table.create.defaultColumnCount);
    });

    it('should create as many new rows as configured', () => {
      component['tableDataset'] = {
        count: 0,
        data: [],
      };

      component.populateTableDataset();

      expect(component['tableDataset'].count).toEqual(component.config.table.create.defaultRowCount);
      expect(component['tableDataset'].data.length).toEqual(component.config.table.create.defaultRowCount);
    });

    it('the newColumnMapper should track the columns', () => {
      component.populateTableDataset();

      let newColumnCountFromMapper = _.values(component['newColumnMapper']).filter(i => i).length;

      expect(newColumnCountFromMapper).toEqual(component.config.table.create.defaultColumnCount);
    });
  });

  describe('FixFocusAfterAction functionalities', () => {
    it('should fetch the focused cellposition before initiating table operation', () => {
      let action = () => {},
          actionType = ITable.TableOperation.ADD_COLUMN,
          value = {
            addedIndex: 0,
            columnName: 'column name',
          };

      spyOn(gridApi, 'getFocusedCell');

      component.fixFocusAfterAction(action, actionType, value);

      expect(gridApi.getFocusedCell).toHaveBeenCalledTimes(1);
    });

    it('should execute the method passed as parameter for performing table operation', () => {
      let actionSpy = jasmine.createSpy('addColumn'),
          actionType = ITable.TableOperation.ADD_COLUMN,
          value = {
            addedIndex: 0,
            columnName: 'column name',
          };

      component.fixFocusAfterAction(actionSpy, actionType, value);

      expect(actionSpy).toHaveBeenCalled();
      expect(actionSpy.calls.count()).toBe(1);
    });

    it('should set grid focus after executing a table operation', () => {
      component['columnDefs'].length = 1;
      component.tableDataset.count = 1;
      let action = () => {},
          actionType = ITable.TableOperation.ADD_COLUMN,
          value = {
            addedIndex: 0,
            columnName: 'column name',
          };

      component.fixFocusAfterAction(action, actionType, value);

      expect(component.setGridFocus).toHaveBeenCalled();
    });
  });

  describe('Cancel button functionalities', () => {
    describe('if the edit view is cancelled', () => {
      it('should take the table id from route if table property does not have id', () => {
        component['editMode'] = ITable.EditMode.EDIT;
        router.navigate = jasmine.createSpy('navigate');
        route.snapshot = {
          params: {
            itemId: '102',
          },
        };
        component.cancel();
        expect(router.navigate).toHaveBeenCalledWith(['/desk', 'library', 'tables', route.snapshot.params.itemId]);
      });

      it('should not take the table id from route if table property have id', () => {
        component['editMode'] = ITable.EditMode.EDIT;
        router.navigate = jasmine.createSpy('navigate');
        route.snapshot = {
          params: {
            itemId: '102',
          },
        };
        component.table = <ITable> {
          id: '103',
        };

        component.cancel();

        expect(router.navigate).toHaveBeenCalledWith(['/desk', 'library', 'tables', component.table.id]);
      });
    });

    it('should respect scope if the edit view is cancelled', () => {
      component['editMode'] = ITable.EditMode.EDIT;
      router.navigate = jasmine.createSpy('navigate');
      route.snapshot = {
        params: {
          itemId: '103',
          scope: 'somescope',
        },
      };
      component.cancel();
      expect(router.navigate).toHaveBeenCalledWith(['/desk', 'library', 'tables', 'somescope', '103']);
    });

    it('should navigate to table list page if the create view is cancelled', () => {
      component['editMode'] = ITable.EditMode.CREATE;
      router.navigate = jasmine.createSpy('navigate');
      route.snapshot = {
        params: {},
      };
      component.cancel();
      expect(router.navigate).toHaveBeenCalledWith(['/desk', 'library', 'tables']);
    });
  });

  describe('Add row functionalities', () => {
    beforeEach(() => {
      component['columnDefs'].length = 1;
    });

    it('should call grid updateRowData method', () => {
      spyOn(gridApi, 'updateRowData');

      component.addRow({});

      expect(gridApi.updateRowData).toHaveBeenCalled();
    });

    it('should update dataset count after adding a row', () => {
      let initialCount = 4;
      component.tableDataset.count = initialCount;

      component.addRow({});

      expect(component.tableDataset.count).toBe(initialCount + 1);
    });
  });

  describe('Add column functionalities', () => {
    it('should add a new column after add opration', () => {
      let value = {
        columnName: 'test column',
        colKey: 'key',
      };

      component.addColumn(value, undefined);

      expect(component['columnDefs'].length).toBe(1);
      expect(component['columnDefs']).toEqual([{headerName: value.columnName, field: value.colKey}]);
    });

    it('should update grid column definition after adding a new column', () => {
      spyOn(gridApi, 'setColumnDefs');

      component.addColumn({columnName: 'test column'}, gridApi.getFocusedCell());

      expect(gridApi.setColumnDefs).toHaveBeenCalledTimes(1);
    });

    it('should move the new column to the desired position after adding the column', () => {
      spyOn(columnApi, 'moveColumn');
      let value = {
        columnName: 'test column',
        colKey: 'key',
      };

      component.addColumn(value, undefined);

      expect(columnApi.moveColumn).toHaveBeenCalledWith('key', 0);
      expect(columnApi.moveColumn).toHaveBeenCalledTimes(1);
    });

    it('should update newColumnMapper after add opration', () => {
      let value = {
        columnName: 'test column',
        colKey: 'key',
      };

      component.addColumn(value, undefined);

      expect(component['newColumnMapper'][value.colKey]).toBeTruthy();
    });
  });

  describe('Delete row functionalities', () => {
    it('should call getSelectedRows method for deleting rows', () => {
      spyOn(gridApi, 'getSelectedRows');

      component.deleteRow();

      expect(gridApi.getSelectedRows).toHaveBeenCalled();
    });

    it('should call updateRowData method with the selected rows for deleting rows', () => {
      let sampleRows = ['row1', 'row2'];
      spyOn(gridApi, 'getSelectedRows').and.returnValue(sampleRows);
      spyOn(gridApi, 'updateRowData');

      component.deleteRow();

      expect(gridApi.updateRowData).toHaveBeenCalledWith({remove: sampleRows});
    });

    it('should update dataset count after deleting rows', () => {
      let rowLength = 4;
      spyOn(gridApi, 'getDisplayedRowCount').and.returnValue(rowLength);

      component.deleteRow();

      expect(component.tableDataset.count).toEqual(rowLength);
    });
  });

  describe('Delete Column functionality', () => {
    it('should get the focused cell to extract column info for deleting a column', () => {
      spyOn(gridApi, 'getFocusedCell').and.returnValue({
        column: new Column({}, {}, 'columnId', false),
      });

      component.deleteColumn({}, gridApi.getFocusedCell());

      expect(gridApi.getFocusedCell).toHaveBeenCalled();
    });

    it('should set grid column defintion for deleting a column', () => {
      spyOn(gridApi, 'setColumnDefs');

      component.deleteColumn({}, gridApi.getFocusedCell());

      expect(gridApi.setColumnDefs).toHaveBeenCalled();
    });
  });

  describe('Rename Column functionalities', () => {
    beforeEach(() => {
      component['columnDefs'] = [{
        field: 'columnKey',
        headerName: 'header name',
      }];
    });

    it('should update grid column definition while renaming a column', () => {
      spyOn(gridApi, 'setColumnDefs');
      component.renameColumn({columnName: 'renamed column'});

      expect(gridApi.setColumnDefs).toHaveBeenCalled();
    });

    it('should update the column definitions after renaming a column', () => {
      component.renameColumn({columnName: 'renamed column'});

      expect(component['columnDefs']).toEqual([{
        field: 'columnKey',
        headerName: 'renamed column',
      }]);
    });

    it('should enable Update button if a column is renamed to a new name', () => {
      component['cellValueNotChanged'] = true;
      component.renameColumn({columnName: 'renamed column'});

      expect(component['cellValueNotChanged']).toBeFalsy();
    });

    it('should not enable Update button if a column is renamed to the existing name', () => {
      component['cellValueNotChanged'] = true;
      component.renameColumn({columnName: 'header name'});

      expect(component['cellValueNotChanged']).toBeTruthy();
    });

    it('should set grid focus after renaming a column', () => {
      component.renameColumn({columnName: 'renamed column'});

      expect(component.setGridFocus).toHaveBeenCalled();
    });
  });

  describe('Save Functionalities', () => {
    beforeEach(() => {
      let newColumnMapper = {
        old1: false,
        new1: true,
        new2: true,
      };
      component['newColumnMapper'] = newColumnMapper;

      spyOn(columnApi, 'getAllGridColumns').and.returnValue([
        {
          getColId: () => 'old1',
          getColDef: () => {
            return {
              headerName: 'Existing Column',
              field: 'old1',
            };
          },
        },
        {
          getColId: () => 'new1',
          getColDef: () => {
            return {
              headerName: 'new column 1',
              field: 'new1',
            };
          },
        },
        {
          getColId: () => 'new2',
          getColDef: () => {
            return {
              headerName: 'new column 2',
              field: 'new2',
            };
          },
        },
      ]);
    });

    it('should discard new columns if it is empty while preparing data for saving table', () => {
      let row  = [
        {
          old1: 'some Value 1',
          new1: 'value',
          new2: '',
        },
        {
          old1: 'some Value 2',
          new1: 'value',
          new2: '',
        },
      ];
      let exptectedResult = [['Existing Column', 'new column 1'], ['some Value 1', 'value'], ['some Value 2', 'value']];

      spyOn(gridApi, 'forEachNode').and.callFake((action) => {
        row.forEach(item => action({data: item}));
      });

      let result = component['prepareData']();

      expect(result).toEqual(exptectedResult);
    });

    it('should not discard existing columns even if it is empty while preparing data for saving table', () => {
      let row  = [
        {
          old1: '',
          new1: 'value',
          new2: '',
        },
        {
          old1: '',
          new1: 'value',
          new2: '',
        },
      ];
      let exptectedResult = [['Existing Column', 'new column 1'], [' ', 'value'], [' ', 'value']];

      spyOn(gridApi, 'forEachNode').and.callFake((action) => {
        row.forEach(item => action({data: item}));
      });

      let result = component['prepareData']();

      expect(result).toEqual(exptectedResult);
    });

    it('should discard empty rows while preparing data for saving table', () => {
      let row  = [
        {
          old1: '',
          new1: 'value',
          new2: '',
        },
        {
          old1: '',
          new1: '',
          new2: '',
        },
        {
          old1: '123',
          new1: 'value',
          new2: '',
        },
        {
          old1: '',
          new1: '',
          new2: '',
        },
      ];
      let exptectedResult = [['Existing Column', 'new column 1'], [' ', 'value'], ['123', 'value']];

      spyOn(gridApi, 'forEachNode').and.callFake((action) => {
        row.forEach(item => action({data: item}));
      });

      let result = component['prepareData']();

      expect(result).toEqual(exptectedResult);
    });
  });

  describe('Process Table Saving Functionalities', () => {
    beforeEach(() => {
      route.snapshot = {
        params: {
          itemId: '102',
        },
      };
    });

    it('should set table editing mode to EDIT mode', () => {
      component['editMode'] = ITable.EditMode.CREATE;
      component.processTableSaving(<ITable> {});

      expect(component['editMode']).toEqual(ITable.EditMode.EDIT);
    });

    it('should replace current table with the newly created table', () => {
      let newTable = <ITable> { id: 'new Table' };
      component['table'] = <ITable> { id: '123' };

      component.processTableSaving(newTable);

      expect(component.table).toEqual(newTable);
    });

    it('should change the url of current page according to the newly created table', () => {
      spyOn(component, 'updateCurrentUrl');
      let newTable = <ITable> { id: 'newTable123' };

      component.processTableSaving(newTable);

      expect(component.updateCurrentUrl).toHaveBeenCalledWith(newTable.id);
    });

    it('should show notification to user about table process', () => {
      spyOn(notifications, 'create');
      let newTable = <ITable> { };

      component.processTableSaving(newTable);

      expect(notifications.create).toHaveBeenCalled();
    });

    it('should subscribe to process if the table has SAVING status', () => {
      let newTable = <ITable> { status: ITable.Status.SAVING };
      spyOn(processService, 'subscribeByTarget');

      component.processTableSaving(newTable);

      expect(processService.subscribeByTarget).toHaveBeenCalled();
    });

    describe('handleProcess functionalities', () => {
      it('should create notification and unset the _isProcessingTable flag if the process is completed', () => {
        spyOn(notifications, 'create');
        let  process = <IProcess> { status: IProcess.Status.COMPLETED };
        component['_isProcessingTable'] = true;

        component.handleProcess(process);

        expect(notifications.create).toHaveBeenCalled();
        expect(component['_isProcessingTable']).toBeFalsy();
      });

      it('should create notification and unset the _isProcessingTable flag if the process is failed', () => {
        spyOn(notifications, 'create');
        let  process = <IProcess> { status: IProcess.Status.FAILED };
        component['_isProcessingTable'] = true;

        component.handleProcess(process);

        expect(notifications.create).toHaveBeenCalled();
        expect(component['_isProcessingTable']).toBeFalsy();
      });
    });
  });
});

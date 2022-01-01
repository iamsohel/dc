import { APP_BASE_HREF } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import {
  AgGridEvent,
  CellValueChangedEvent,
  ColDef,
  ColumnApi,
  GridApi,
  RowNode,
} from '@ag-grid-community/core';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { ApplyPipe, PluralizePipe } from '../core-ui/core-ui.pipes';
import { MocksOnlyDirective } from '../core/core.mocks-only';
import { EventService } from '../core/services/event.service';
import { ProcessService } from '../core/services/process.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { AclService } from '../services/acl.service';

import { TableViewComponent } from './table-view.component';
import { ITable, ITableColumn, ITableStats, ITableUpdate } from './table.interface';
import { TableService } from './table.service';
import { TableColumnSelectOptionsPipe } from './tables.pipes';

class MockActivatedRoute {
  params: any;

  constructor() {
    this.params = new ReplaySubject(1);
  }
}

class MockTableService {
  observables: any;
  data: ITable;

  constructor() {
    this.observables = {
      view: {
        subscribe: () => {},
      },
    };
    this.data = {
        id: '101',
        ownerId: '1',
        datasetId: '101',
        datasetType: ITable.DatasetType.SOURCE,
        parentId: '101',
        version: 1,
        current: true,
        name: 'TableA',
        status: ITable.Status.ACTIVE,
        created: '2016-04-04 04:04',
        updated: '2016-07-07 07:07',
        options: {
          indices: ['1', '2', '3'],
        },
        columns: [
          {
            name: 'ColumnA',
            displayName: 'Column A',
            dataType: ITable.ColumnDataType.INTEGER,
            variableType: ITable.ColumnVariableType.CONTINUOUS,
          },
          {
            name: 'ColumnB',
            displayName: 'Column B',
            dataType: ITable.ColumnDataType.STRING,
            variableType: ITable.ColumnVariableType.CATEGORICAL,
          },
          {
            name: 'ColumnC',
            displayName: 'Column C',
            dataType: ITable.ColumnDataType.DOUBLE,
            variableType: ITable.ColumnVariableType.CONTINUOUS,
          },
        ],
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

  get(id: string) { return this.data; }

  getStatistic(id: string): Observable<ITableStats> {
    return of({
      id: '123',
      status: 'ERROR',
      stats: [],
    });
  }

  update(id: string, data: ITableUpdate) {
    return of(this.data);
  }

  generateColumn(index, count) { return {}; }
}


class MockProcessService {
  subscribeByTarget() { }
}

class MockGridApi extends GridApi {
  sizeColumnsToFit() {}
  setRowData(rowData) {}
  setColumnDefs(colDef) {}
  getColumnDef(colId) { return {}; }
  paginationGoToPage(pageNo) {}
  paginationSetPageSize(size) {}
  getPinnedTopRow(key) { return <RowNode> {}; }
  getSortModel() { return []; }
  setSideBarVisible(show: boolean) { }
}

class MockColumnApi extends ColumnApi {
  getAllGridColumns() { return []; }
}

class MockAclService {
  canEditTable(table) { return true; }
  canUpdateTable(table) { return true; }
}

describe('Functionallity of TableViewComponent ', () => {
  let route = new MockActivatedRoute(),
    tableService = new MockTableService(),
    processService = new MockProcessService(),
    fixture: ComponentFixture<TableViewComponent>,
    component: TableViewComponent,
    gridApi = new MockGridApi(),
    columnApi = new MockColumnApi(),
    aclService = new MockAclService();
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: TableService, useValue: tableService },
        { provide: ProcessService, useValue: processService },
        { provide: AclService, useValue: aclService },
        { provide: EventService, useClass: EventServiceMock },
        { provide: APP_BASE_HREF, useValue: '/' },
      ],
      imports: [
        RouterTestingModule,
      ],
      declarations: [
        TableViewComponent,
        TableColumnSelectOptionsPipe,
        MocksOnlyDirective,
        ApplyPipe,
        PluralizePipe,
      ],
      schemas: [
        NO_ERRORS_SCHEMA,
      ],
    })
    .compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(TableViewComponent);
      fixture.detectChanges();
      component = fixture.componentInstance;

      component['gridApi'] = gridApi;
      component['columnApi'] = columnApi;
      component.table = tableService.data;
      component.tableDataset = {
        data: [],
        count: 0,
      };

      spyOn(component['_savingObserver'], 'observe').and.callThrough().and.returnValue({subscribe: (_) => {}});
    });
  }));

  describe('General Functionalities', () => {
    it('should not pass table name while saving the table if it is not the latest version of the table', () => {
      let table = Object.assign(tableService.data, {id: '123', parentId: '124', columns: []});
      component.table = table;
      const formValue = component.tableEditForm.value;
      let data = {
        description: formValue.description,
        columns: [],
      };
      spyOn(tableService, 'update');

      component.saveTable();

      expect(tableService.update).toHaveBeenCalledWith('123', data);
    });

    it('should add empty columns if the number of columns is less than the default count of columns when the \'perhapsFillColumns\' is called', () => {
      component['columnDefs'] = [];
      component.table.columns = [];

      component['perhapsFillColumns']();

      expect(component['columnDefs'].length).toEqual(config.table.create.defaultColumnCount);
      expect(component.table.columns.length).toEqual(config.table.create.defaultColumnCount);
    });

    it('should not add empty columns if the number of columns is not less than the default count of columns when the \'perhapsFillColumns\' is called', () => {
      let columnArray = [];
      columnArray.length = config.table.create.defaultColumnCount;
      component['columnDefs'] = columnArray;
      component.table.columns = columnArray;

      component['perhapsFillColumns']();

      expect(component['columnDefs'].length).toEqual(config.table.create.defaultColumnCount);
      expect(component.table.columns.length).toEqual(config.table.create.defaultColumnCount);
    });

    it('should add empty rows if the number of rows is less than the default count of rows when the \'perhapsFillRows\' is called', () => {
      let sampleColumnCount = config.table.create.defaultColumnCount;
      component['columnDefs'] = Array(sampleColumnCount).fill('');
      component.tableDataset = {
        data: [],
        count: 0,
      };

      component['perhapsFillRows']();

      expect(component.tableDataset.data.length).toEqual(config.table.create.defaultRowCount);
      expect(component.tableDataset.count).toEqual(config.table.create.defaultRowCount);
    });

    it('should not add any empty rows if the number of rows is not less than the default count of rows when the \'perhapsFillRows\' is called', () => {
      component.tableDataset = {
        data: Array(config.table.create.defaultRowCount).fill(''),
        count: config.table.create.defaultRowCount,
      };

      component['perhapsFillRows']();

      expect(component.tableDataset.data.length).toEqual(config.table.create.defaultRowCount);
      expect(component.tableDataset.count).toEqual(config.table.create.defaultRowCount);
    });

    it('should create column sort model from orderValue when the \'generateColumnSortModelFromOrderVal\' is called', () => {
      let orderVal = 'columnA,-columnB';
      let expectedOutput = [
        { colId: 'columnA', sort: 'asc' },
        { colId: 'columnB', sort: 'desc' },
      ];

      spyOn(columnApi, 'getAllColumns').and.callThrough().and.callFake(() => {
        return [ 'columnA', 'columnB' ].map(item => {
          return {
            getColId: () => item,
            getColDef: () => ({ field: item }) ,
          };
        });
      });

      let result = component['generateColumnSortModelFromOrderVal'](orderVal);

      expect(columnApi.getAllColumns).toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });

    it('should update the grid sort model if the provided model is not identical to the exisiting sort model when the \'UpdateGridSortModelIfNotUpdatedAlready\' is called', () => {
      let sortModel = [
        { colId: 'columnA', sort: 'asc' },
        { colId: 'columnB', sort: 'desc' },
      ];

      spyOn(gridApi, 'getSortModel').and.returnValue([]);
      spyOn(gridApi, 'setSortModel');

      component['UpdateGridSortModelIfNotUpdatedAlready'](sortModel);

      expect(gridApi.getSortModel).toHaveBeenCalled();
      expect(gridApi.setSortModel).toHaveBeenCalledWith(sortModel);
    });

    it('should not update the grid sort model if the provided model is identical to the existing sort model when the \'UpdateGridSortModelIfNotUpdatedAlready\' is called', () => {
      let sortModel = [
        { colId: 'columnA', sort: 'asc' },
        { colId: 'columnB', sort: 'desc' },
      ];

      spyOn(gridApi, 'getSortModel').and.returnValue(sortModel);
      spyOn(gridApi, 'setSortModel');

      component['UpdateGridSortModelIfNotUpdatedAlready'](sortModel);

      expect(gridApi.getSortModel).toHaveBeenCalled();
      expect(gridApi.setSortModel).not.toHaveBeenCalled();
    });

    describe('\'setTable\' functionalities', () => {
      let canEditTableSpy: jasmine.Spy;
      beforeEach(() => {
        canEditTableSpy = spyOn(aclService, 'canEditTable');

        canEditTableSpy.and.returnValue(true);
      });

      it('should the table by the provided value', () => {
        component.table = undefined;
        let providedTable = <ITable> { current: false };

        component.setTable(providedTable);

        expect(component.table).toEqual(providedTable);
      });

      it('should disable table name edit if it is not a current version', () => {
        let table = <ITable> { current: false };
        component.disableTableNameEdit = false;

        component.setTable(table);

        expect(component.disableTableNameEdit).toBeTruthy();
      });

      it('should enable table name edit if it is a current version', () => {
        let table = <ITable> { current: true };
        component.disableTableNameEdit = true;

        component.setTable(table);

        expect(component.disableTableNameEdit).toBeFalsy();
      });

      it('should subscribe to process if the table has the \'SAVING\' status', () => {
        let table = <ITable> { status: ITable.Status.SAVING };
        spyOn(processService, 'subscribeByTarget');

        component.setTable(table);

        expect(processService.subscribeByTarget).toHaveBeenCalled();
      });

      it('should set the row model type to \'clientSide\' if the table is editable', () => {
        component['_rowModelType'] = undefined;
        canEditTableSpy.and.returnValue(true);

        component.setTable(<ITable> {});

        expect(canEditTableSpy.calls.count()).toEqual(1);
        expect(component['_rowModelType']).toEqual('clientSide');
      });

      it('should set the row model type to \'serverSide\' if the table is not editable', () => {
        component['_rowModelType'] = undefined;
        canEditTableSpy.and.returnValue(false);

        component.setTable(<ITable> {});

        expect(canEditTableSpy.calls.count()).toEqual(1);
        expect(component['_rowModelType']).toEqual('serverSide');
      });

      it('should call \'loadTableStatistics\' method', () => {
        spyOn<any>(component, '_loadTableStatistic');

        component.setTable(<ITable> {});

        expect(component['_loadTableStatistic']).toHaveBeenCalled();
      });

      it('should call \'fillTablesForm\' method', () => {
        spyOn<any>(component, 'fillTablesForm');

        component.setTable(<ITable> {});

        expect(component['fillTablesForm']).toHaveBeenCalled();
      });
    });

    describe('\'saveTable\' Functionality', () => {
      let getPinnedRowSpy: jasmine.Spy,
        tableUpdateSpy: jasmine.Spy,
        tableViewFormValue;

      beforeEach(() => {
        tableViewFormValue = {
          name: 'table name',
          description: 'sample description',
        };
        component.tableEditForm.setValue(tableViewFormValue);

        let columns = [
          {
            name: 'ColumnA',
            dataType: 'Integer',
            variableType: 'Continuous',
          },
          {
            name: 'ColumnB',
            dataType: 'String',
            variableType: 'Continuous',
          },
          {
            name: 'ColumnC',
            dataType: 'String',
            variableType: 'Continuous',
          },
          {
            name: 'ColumnD',
            dataType: 'Integer',
          },
        ];

        component.table.columns = <ITableColumn[]> columns;

        tableUpdateSpy = spyOn(tableService, 'update');
        getPinnedRowSpy = spyOn(gridApi, 'getPinnedTopRow');
        getPinnedRowSpy.and.returnValue({
          data: {
            ColumnA: 'Continuous',
            ColumnB: 'Continuous',
            ColumnC: 'Categorical',
          },
        });
      });

      it('should set \'cellValueNotChanged\'', () => {
        component['cellValueNotChanged'] = false;

        component.saveTable();

        expect(component['cellValueNotChanged']).toBeTruthy();
      });

      it('should call \'getPinnedTopRow\'', () => {
        component.saveTable();

        expect(gridApi.getPinnedTopRow).toHaveBeenCalled();
      });

      it('should filter and map table columns', () => {
        component['disableTableNameEdit'] = false;
        let expectedData = {
          name: tableViewFormValue.name,
          description: tableViewFormValue.description,
          columns: [
            {
              name: 'ColumnA',
              dataType: 'Integer',
              variableType: 'CONTINUOUS',
            },
            {
              name: 'ColumnB',
              dataType: 'String',
              variableType: 'CONTINUOUS',
            },
            {
              name: 'ColumnC',
              dataType: 'String',
              variableType: 'CATEGORICAL',
            },
          ],
        };

        component.saveTable();

        expect(tableUpdateSpy.calls.mostRecent().args).toEqual([component.table.id, expectedData]);
      });

      it('should not include table name if \'disableTableNameEdit\' is true', () => {
        component['disableTableNameEdit'] = true;

        let expectedData = {
          description: tableViewFormValue.description,
          columns: [
            {
              name: 'ColumnA',
              dataType: 'Integer',
              variableType: 'CONTINUOUS',
            },
            {
              name: 'ColumnB',
              dataType: 'String',
              variableType: 'CONTINUOUS',
            },
            {
              name: 'ColumnC',
              dataType: 'String',
              variableType: 'CATEGORICAL',
            },
          ],
        };

        component.saveTable();

        expect(tableUpdateSpy.calls.mostRecent().args).toEqual([component.table.id, expectedData]);
      });
    });

    describe('\'loadTableStatistic\' functionalities', () => {
      let allGridColumnSpy: jasmine.Spy,
        setColumnDefsSpy: jasmine.Spy;

        beforeEach(() => {
        component.table.status = ITable.Status.ACTIVE;
        setColumnDefsSpy = spyOn(gridApi, 'setColumnDefs');
        allGridColumnSpy = spyOn(columnApi, 'getAllGridColumns');

        allGridColumnSpy.and.callThrough().and.callFake(() => {
          return ['columnA', 'columnB', 'columnC'].map(columnName => {
            return {
              getColDef: () => ({ field: columnName }),
            };
          });
        });
      });

      describe('\'setHeaderToolTips\' functionalities', () => {
        it('should not work if the column api is undefined', () => {
          component['columnApi'] = undefined;

          component['setHeaderToolTips']('any val');

          expect(allGridColumnSpy.calls.count()).toBe(0);
          expect(setColumnDefsSpy.calls.count()).toBe(0);
        });

        it('should get all grid columns', () => {
          component['setHeaderToolTips']('any val');

          expect(allGridColumnSpy.calls.count()).toBe(1);
        });

        it('should set column defs to grid api', () => {
          component['setHeaderToolTips']('any val');

          expect(setColumnDefsSpy.calls.count()).toBe(1);
        });

        it('should set the \'headerTooltip\' property of column def with the provided string value', () => {
          let tooltipValue = 'some value';
          setColumnDefsSpy.and.callThrough().and.callFake((colDefs: ColDef[]) => {
            colDefs.forEach(colDef => {
              expect(colDef.headerTooltip).toBeDefined();
              expect(colDef.headerTooltip).toEqual(tooltipValue);
            });
          });

          component['setHeaderToolTips'](tooltipValue);
        });

        it('should JSON stringify the provided value if it is not a string already and set the \'headerTooltip\' property with the stringify result', () => {
          let tooltipValue = {
            columnA: { columnName: 'columnA'},
            columnB: { columnName: 'columnB'},
            columnC: { columnName: 'columnC'},
          };
          let jsonSpy = spyOn(JSON, 'stringify').and.callThrough();

          setColumnDefsSpy.and.callThrough().and.callFake((colDefs: ColDef[]) => {
            colDefs.forEach(colDef => {
              expect(colDef.headerTooltip).toBeDefined();
              expect(JSON.parse(colDef.headerTooltip)).toEqual(tooltipValue[colDef.field]);
            });
          });

          component['setHeaderToolTips'](tooltipValue);

          expect(jsonSpy.calls.count()).toBe(columnApi.getAllGridColumns().length);
        });
      });

      it('should initially set PENDING as header tooltip', () => {
        spyOn<any>(component, 'setHeaderToolTips');

        component['_loadTableStatistic']();

        expect(component['setHeaderToolTips']).toHaveBeenCalledWith(config.tableStats.status.values.PENDING);
      });

      it('should get table statistics', () => {
        spyOn(tableService, 'getStatistic').and.callThrough();

        component['_loadTableStatistic']();

        expect(tableService.getStatistic).toHaveBeenCalled();
      });

      it('should set ERROR as header tooltip value if table statistics status is \'ERROR\'', () => {
        spyOn<any>(component, 'setHeaderToolTips');
        spyOn(tableService, 'getStatistic').and.returnValue(of({
          id: '123',
          status: 'ERROR',
          stats: [],
        }));

        component['_loadTableStatistic']();

        expect(component['setHeaderToolTips']).toHaveBeenCalledWith(config.tableStats.status.values.ERROR);
        expect(component['setHeaderToolTips']).toHaveBeenCalledTimes(2);
      });

      it('should subscribe to the process if table statistics status is \'PENDING\'', () => {
        spyOn(processService, 'subscribeByTarget');
        spyOn(tableService, 'getStatistic').and.returnValue(of({
          id: '123',
          status: 'PENDING',
          stats: [],
        }));

        component['_loadTableStatistic']();

        expect(processService.subscribeByTarget).toHaveBeenCalled();
      });

      it('should call the setHeaderToolTips with column stats if the table statistics status is neither \'ERROR\' nor \'PENDING\'', () => {
        spyOn<any>(component, 'setHeaderToolTips');
        spyOn(tableService, 'getStatistic').and.returnValue(of({
          id: '123',
          status: 'DONE',
          stats: [
            { columnName: 'columnA'},
            { columnName: 'columnB'},
            { columnName: 'columnC'},
          ],
        }));

        let expectedArgs = {
          columnA: { columnName: 'columnA'},
          columnB: { columnName: 'columnB'},
          columnC: { columnName: 'columnC'},
        };

        component['_loadTableStatistic']();

        expect(component['setHeaderToolTips']).toHaveBeenCalledWith(expectedArgs);
        expect(component['setHeaderToolTips']).toHaveBeenCalledTimes(2);
      });

      it('should not do anything if the table status is not \'ACTIVE\'', () => {
        component.table.status = ITable.Status.SAVING;
        spyOn<any>(component, 'setHeaderToolTips');

        component['_loadTableStatistic']();

        expect(component['setHeaderToolTips']).not.toHaveBeenCalled();
      });
    });
  });

  describe('AG Grid related functionalities', () => {
    it('should use 6 modules (ClientSideRowModel, RichSelect, ServerSideRowModel, ColumnsToolPanel, RowGrouping, FiltersToolPanel) for AG Grid', () => {
      const expectedModules = [
        ClientSideRowModelModule,
        RichSelectModule,
        ServerSideRowModelModule,
        ColumnsToolPanelModule,
        RowGroupingModule,
        FiltersToolPanelModule,
      ];

      expect(component['_modules']).toEqual(expectedModules);
    });

    it('should hide the sidebar by default', () => {
      expect(component['_sideBar'].hiddenByDefault).toBeTruthy();
    });

    describe('\'onGridReady\' functionalties', () => {
      let event: AgGridEvent,
        setColumnDefsSpy: jasmine.Spy,
        setPinnedRowsSpy: jasmine.Spy,
        loadDataSetSpy: jasmine.Spy,
        gridApiSpy: jasmine.Spy,
        aclServiceSpy: jasmine.Spy;

      beforeEach(() => {
        let table = {...tableService.data, size: 0 };
        event = {
          type: 'Ag Grid Event',
          api: gridApi,
          columnApi: columnApi,
        };

        component.table = table;

        setColumnDefsSpy = component['setColumnDefs'] = jasmine.createSpy('setColumnDefs');
        setPinnedRowsSpy = component['setPinnedRows'] = jasmine.createSpy('setPinnedRows');
        loadDataSetSpy = spyOn<any>(component, 'loadDataSet');
        gridApiSpy = spyOn(component['gridApi'], 'setServerSideDatasource');
        aclServiceSpy = spyOn(aclService, 'canEditTable');
      });

      it('should set \'gridApi\' params of component', () => {
        component['gridApi'] = undefined;

        component.onGridReady(event);

        expect(component['gridApi']).toEqual(event.api);
      });

      it('should set \'columnApi\' params of component', () => {
        component['columnApi'] = undefined;

        component.onGridReady(event);

        expect(component['columnApi']).toEqual(event.columnApi);
      });

      it('should call set column defintions of the Grid', () => {
        component.onGridReady(event);

        expect(setColumnDefsSpy).toHaveBeenCalled();
      });

      it('should set pinned rows of the Grid', () => {
        component.onGridReady(event);

        expect(setPinnedRowsSpy).toHaveBeenCalled();
      });

      it('should load whole dataset if the table is editable', () => {
        aclServiceSpy.and.returnValue(true);

        component.onGridReady(event);

        expect(loadDataSetSpy.calls.count()).toEqual(1);
      });

      it('should set Serverside datasource if the table is not editable', () => {
        aclServiceSpy.and.returnValue(false);

        component.onGridReady(event);

        expect(gridApiSpy.calls.count()).toEqual(1);
      });
    });

    describe('\onCellValueChanged\' functionalities', () => {
      let cellValueChangedEvent: CellValueChangedEvent;

      beforeEach(() => {
        cellValueChangedEvent = <CellValueChangedEvent> {
          type: 'CellValueChanged',
          oldValue: '2',
          newValue: '5',
        };
      });

      describe('if the old and the new value is same', () => {
        beforeEach(() => {
          cellValueChangedEvent.oldValue = cellValueChangedEvent.newValue = 'same value';
        });

        it('should not change the state of \'cellValueNotChanged\' if it is true', () => {
          component['cellValueNotChanged'] = true;

          component.onCellValueChanged(cellValueChangedEvent);

          expect(component['cellValueNotChanged']).toBeTruthy();
        });

        it('should not change the state of \'cellValueNotChanged\' if it is false', () => {
          component['cellValueNotChanged'] = false;

          component.onCellValueChanged(cellValueChangedEvent);

          expect(component['cellValueNotChanged']).toBeFalsy();
        });
      });

      it('should unset \'cellValueNotChanged\' if the old and the new value are different', () => {
        cellValueChangedEvent.oldValue = 'old';
        cellValueChangedEvent.newValue = 'new';
        component['cellValueNotChanged'] = true;

        component.onCellValueChanged(cellValueChangedEvent);

        expect(component['cellValueNotChanged']).toBeFalsy();
      });
    });

    describe('\'onSortChanged\' Functionalities', () => {
      let params: AgGridEvent,
      gridPaginationGoToPageSpy: jasmine.Spy,
      gridPaginationSetPageSizeSpy: jasmine.Spy,
      fixPaginationCountSpy: jasmine.Spy,
      handleGridOrderingSpy: jasmine.Spy;
      beforeEach(() => {
        params = <AgGridEvent> { api: gridApi };
        component.tableViewForm.controls.order.setValue(null);

        gridPaginationGoToPageSpy = spyOn(gridApi, 'paginationGoToPage');
        gridPaginationSetPageSizeSpy = spyOn(gridApi, 'paginationSetPageSize');
        fixPaginationCountSpy = spyOn<any>(component, 'fixPaginationCount');
        handleGridOrderingSpy = spyOn<any>(component, 'handleGridOrdering');
      });

      it('should set the order value of table view form if the value derived from sort model does not match with it', () => {
        let expectedOrderValue = 'col1,-col2';
        let sortModel = [
          { colId: 'col1', sort: 'asc'},
          { colId: 'col2', sort: 'desc'},
        ];
        spyOn(gridApi, 'getSortModel').and.returnValue(sortModel);
        spyOn(gridApi, 'getColumnDef').and.callThrough().and.callFake((columnName) => {
          return {
            field: columnName,
          };
        });

        component.onSortChanged(params);

        expect(component.tableViewForm.controls.order.value).toEqual(expectedOrderValue);
        expect(gridPaginationGoToPageSpy).toHaveBeenCalled();
        expect(gridPaginationSetPageSizeSpy).toHaveBeenCalled();
        expect(fixPaginationCountSpy).toHaveBeenCalled();
        expect(handleGridOrderingSpy).toHaveBeenCalled();
      });

      it('should not set the order of table view form if the value derived from sort model does not match with it', () => {
        let expectedOrderValue = null;
        let sortModel = [ ];
        spyOn(component['gridApi'], 'getSortModel').and.returnValue(sortModel);

        component.onSortChanged(params);

        expect(component.tableViewForm.controls.order.value).toEqual(expectedOrderValue);
        expect(gridPaginationGoToPageSpy).not.toHaveBeenCalled();
        expect(gridPaginationSetPageSizeSpy).not.toHaveBeenCalled();
        expect(fixPaginationCountSpy).not.toHaveBeenCalled();
        expect(handleGridOrderingSpy).not.toHaveBeenCalled();
      });
    });

    describe('\'onColumnChanged\' Functionalities', () => {
      let event: AgGridEvent,
        isPivotModeSpy: jasmine.Spy,
        getRowGroupColumnSpy: jasmine.Spy;

      const defaultPageValue = 32;

      beforeAll(() => {
        event = {
          type: 'columnChanged',
          api: gridApi,
          columnApi: columnApi,
        };
      });

      beforeEach(() => {
        component.tableViewForm.controls.page.setValue(defaultPageValue);
        isPivotModeSpy = spyOn(columnApi, 'isPivotMode').and.returnValue(false);
        getRowGroupColumnSpy = spyOn(columnApi, 'getRowGroupColumns').and.returnValue([]);
      });

      it('should not change page if the view mode is same after grid column is changed', () => {
        component['isComplexView'] = false;

        component['onColumnChanged'](event);

        expect(component.tableViewForm.controls.page.value).toBe(defaultPageValue);
        expect(isPivotModeSpy).toHaveBeenCalled();
        expect(getRowGroupColumnSpy).toHaveBeenCalled();
      });

      it('should go to first page if the view mode is changed along with the change of grid columns', () => {
        component['isComplexView'] = true;

        component['onColumnChanged'](event);

        expect(component.tableViewForm.controls.page.value).toBe(1);
        expect(isPivotModeSpy).toHaveBeenCalled();
        expect(getRowGroupColumnSpy).toHaveBeenCalled();
      });
    });

    describe('\'setColumnDefs\' Functionalities', () => {
      let perhapsFillColumnsSpy: jasmine.Spy,
        setColumnDefsSpy: jasmine.Spy;

      beforeEach(() => {
        perhapsFillColumnsSpy = spyOn<any>(component, 'perhapsFillColumns');
        setColumnDefsSpy = spyOn(gridApi, 'setColumnDefs');
        component.table.columns = <ITableColumn[]> [
          {
            name: 'ColumnA',
            dataType: ITable.ColumnDataType.INTEGER,
            variableType: ITable.ColumnVariableType.CONTINUOUS,
          },
          {
            name: 'ColumnB',
            dataType: ITable.ColumnDataType.INTEGER,
            variableType: ITable.ColumnVariableType.CONTINUOUS,
          },
          {
            name: 'ColumnC',
            dataType: ITable.ColumnDataType.STRING,
            variableType: ITable.ColumnVariableType.CATEGORICAL,
          },
        ];
      });

      it('should set \'columnDefs\'', () => {
        component['columnDefs'] = undefined;

        component['setColumnDefs']();

        expect(component['columnDefs']).toBeDefined();
        expect(component['columnDefs'].length).toBeGreaterThan(0);
      });

      it('should set some properties of columnDef', () => {
        component['columnDefs'] = undefined;

        component['setColumnDefs']();

        expect(component['columnDefs'].length).toBeGreaterThan(0);
        expect(component['columnDefs'][0].hasOwnProperty('headerName')).toBeTruthy();
        expect(component['columnDefs'][0].hasOwnProperty('field')).toBeTruthy();
        expect(component['columnDefs'][0].hasOwnProperty('tooltipField')).toBeTruthy();
        expect(component['columnDefs'][0].hasOwnProperty('cellClass')).toBeTruthy();
        expect(component['columnDefs'][0].hasOwnProperty('editable')).toBeTruthy();
        expect(component['columnDefs'][0].hasOwnProperty('valueFormatter')).toBeTruthy();
        expect(component['columnDefs'][0].hasOwnProperty('cellEditorSelector')).toBeTruthy();
      });

      it('should call \'perhapsFillColumns\' method', () => {
        component['setColumnDefs']();

        expect(perhapsFillColumnsSpy.calls.count()).toEqual(1);
      });

      it('should set columnDefs to gridApi', () => {
        component['setColumnDefs']();

        expect(setColumnDefsSpy.calls.count()).toEqual(1);
      });

      it('should format value if the column has datatype of double when the \'valueFormatter\' function of columnDef is called', () => {
        const params = { value: 12.123456 }, expectedValue = '12.123';
        component.table.columns = [
          {
            name: 'sample column',
            displayName: 'sample display column',
            align: ITable.ColumnAlign.CENTER,
            dataType: ITable.ColumnDataType.DOUBLE,
            variableType: ITable.ColumnVariableType.CONTINUOUS,
          },
        ];

        component['setColumnDefs']();

        let valueFormatterFunc = _.get(component, ['columnDefs', 0, 'valueFormatter'], () => false);
        expect(valueFormatterFunc(params)).toBe(expectedValue);
      });
    });

    describe('\'processRowData\' functionalities', () => {
      beforeEach(() => {
        component['columnDefs'] =  [
          { field: 'columnA'},
          { field: 'columnB'},
          { field: 'columnC'},
        ];

        component.table = tableService.data;
      });

      it('should return the processed row data according to column defs', () => {
        let row = [123, 'abcd', 'def'];
        let expectedRow = <ColDef> {
          columnA: 123,
          columnB: 'abcd',
          columnC: 'def',
        };

        let columns = [
          { dataType: ITable.ColumnDataType.INTEGER },
          { dataType: ITable.ColumnDataType.STRING },
          { dataType: ITable.ColumnDataType.STRING },
        ];

        component.table.columns = <ITableColumn[]> columns;

        let result = component['processRowData'](row);

        expect(result).toEqual(expectedRow);
      });

      it('should truncate value and create a tooltip field for double datatype', () => {
        let row = [123.01, 'abcd', 123.0123456];
        let expectedRow = <ColDef> {
          columnA: 123.01,
          columnAtoolTipField: '',
          columnB: 'abcd',
          columnC: 123.0123456,
          columnCtoolTipField: '123.0123456',
        };

        let columns = [
          { dataType: ITable.ColumnDataType.DOUBLE },
          { dataType: ITable.ColumnDataType.STRING },
          { dataType: ITable.ColumnDataType.DOUBLE },
        ];

        component.table.columns = <ITableColumn[]> columns;

        let result = component['processRowData'](row);

        expect(result).toEqual(expectedRow);
      });
    });

    describe('\'enableGroupingPivotingFilteringFunctionality\' Function', () => {
      const expectedColumnDefs = [
        {
          enablePivot: true,
          filter: true,
          enableValue: true,
          enableRowGroup: true,
        },
      ];

      it('should add some properties to columnDefs', () => {
        component['columnDefs'] = [
          {},
        ];

        component.enableGroupingPivotingFilteringFunctionality();

        expect(component['columnDefs']).toEqual(expectedColumnDefs);
      });

      it('should set the modified column def to grid', () => {
        let gridApiSpy = spyOn(gridApi, 'setColumnDefs');
        component['columnDefs'] = [
          {},
        ];

        component.enableGroupingPivotingFilteringFunctionality();

        expect(gridApiSpy).toHaveBeenCalledWith(expectedColumnDefs);
      });

      it('should make the side bar visible', () => {
        let gridApiSpy = spyOn(gridApi, 'setSideBarVisible');

        component.enableGroupingPivotingFilteringFunctionality();

        expect(gridApiSpy).toHaveBeenCalledWith(true);
      });
    });

    it('should create pinned rows and set it using grid api when the \'setPinnedRows\' is called', () => {
      component.table.columns = <ITableColumn[]> [
        { dataType: ITable.ColumnDataType.INTEGER, variableType: ITable.ColumnVariableType.CONTINUOUS },
        { dataType: ITable.ColumnDataType.DOUBLE, variableType: ITable.ColumnVariableType.CONTINUOUS },
        { dataType: ITable.ColumnDataType.STRING, variableType: ITable.ColumnVariableType.CATEGORICAL },
      ];

      component['columnDefs'] = [
        { field: 'columnA' },
        { field: 'columnB' },
        { field: 'columnC' },
      ];

      let expectedColumnDataTypePinnedRows = {
        columnA: config.table.column.dataType.labels.INTEGER,
        columnB: config.table.column.dataType.labels.DOUBLE,
        columnC: config.table.column.dataType.labels.STRING,
      };

      let expectedColumnVariableTypePinnedRows = {
        columnA: config.table.column.variableType.labels.CONTINUOUS,
        columnB: config.table.column.variableType.labels.CONTINUOUS,
        columnC: config.table.column.variableType.labels.CATEGORICAL,
      };
      expectedColumnVariableTypePinnedRows[component.EDITABLE_ROW_FLAG_NAME] = true;

      spyOn(gridApi, 'setPinnedTopRowData');

      component['setPinnedRows']();

      expect(gridApi.setPinnedTopRowData).toHaveBeenCalledWith([expectedColumnDataTypePinnedRows, expectedColumnVariableTypePinnedRows]);
    });

    it('should consider table dataset count as current row count if the row model is not \'clientSide\'', () => {
      let expectedRowCount = component.tableDataset.count = 120;
      component['_currentRowCount'] = undefined;
      component['_rowModelType'] = undefined;

      component['fixPaginationCount']();

      expect(component['_currentRowCount']).toBe(expectedRowCount);
    });

    it('should consider grid\'s row count as current row count if the row model is \'clientSide\'', () => {
      let expectedRowCount = 120;
      let gridApiSpy = spyOn(gridApi, 'paginationGetRowCount').and.returnValue(expectedRowCount);

      component['_currentRowCount'] = undefined;
      component['_rowModelType'] = 'clientSide';

      component['fixPaginationCount']();

      expect(component['_currentRowCount']).toBe(expectedRowCount);
      expect(gridApiSpy).toHaveBeenCalled();
    });
  });

  describe('Functionality of loadTableToGetTableSize Method', () => {
    it('should fetch table if the table size is not present currenntly', () => {
      let tableSize = 4;
      component.table = <ITable> {
        size: undefined,
      };
      spyOn(tableService, 'get').and.returnValue(Observable.of(<ITable> { size: tableSize }));

      component['loadTableToGetTableSize']();

      expect(tableService.get).toHaveBeenCalled();
      expect(component.table.size).toEqual(tableSize);
    });

    it('should not fetch table if the table size is present currenntly', () => {
      let tableSize = 4;
      component.table = <ITable> {
        size: tableSize,
      };
      spyOn(tableService, 'get');

      component['loadTableToGetTableSize']();

      expect(tableService.get).not.toHaveBeenCalled();
      expect(component.table.size).toEqual(tableSize);
    });

    it('should unsubscribe the current table subscription it is not undefineds while fetching the table', () => {
      let tableSize = 4;
      component.table = <ITable> {
        size: undefined,
      };
      spyOn(tableService, 'get').and.returnValue(Observable.of(<ITable> { size: tableSize }));
      component['tableSubscription'] = new Subscription();
      let spy = spyOn(component['tableSubscription'], 'unsubscribe');

      component['loadTableToGetTableSize']();

      expect(spy).toHaveBeenCalled();
      expect(tableService.get).toHaveBeenCalled();
      expect(component.table.size).toEqual(tableSize);
    });
  });
});

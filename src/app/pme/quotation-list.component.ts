import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { ISubscription, Subscription } from 'rxjs/Subscription';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IBackendList } from '../core/interfaces/common.interface';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';
import { AppFormGroup } from '../utils/forms';
import { ReactiveLoader } from '../utils/reactive-loader';

import { AgGridActionComponent } from './ag-grid-action.component';
import { AgGridDatepickerFromComponent } from './ag-grid-datepicker-from.component';
import { AgGridDatepickerToComponent } from './ag-grid-datepicker-to.component';
import { QuotationAgGridDisplayList, ShowCol } from './display-column-list.data';
import { PmeService } from './pme-management.service';
import {
  CellStyleDefineForQuotationFile,
  CellStyleDefineForQuotationStatus,
  ColDef,
  IPmeSearchParams,
  IQuotationRecord,
  LocalCol,
} from './pme.interfaces';
import { QuotationFileDownloadComponent } from './quotation-file-download.component';

enum SearchModes {
  STATUS = 'STATUS',
  CUSTOMER_CODE = 'CUSTOMER_CODE',
  MATERIAL_CODE = 'MATERIAL_CODE',
  REQUESTOR = 'REQUESTOR',
  SALES_DISTRICT = 'SALES_DISTRICT',
  UOM = 'UOM',
}

@Component({
  selector: 'quotation-list',
  template: `<div class="example-wrapper">
    <app-spinner [visibility]="_itemsLoader.active | async"></app-spinner>
    <div class="operations-toolbar row row-flex pt5 pb5" style="align-items: flex-end; flex-wrap: wrap;">
      <div class="col-xs-12 flex-static">
        <!-- Common Buttons -->
        <ul class="asset-btn-panel nav nav-pills">
          <li class="nav-item">
            <a class="nav-link link-colorless" [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'create']">
              <i
                class="imgaction glyphicon center-block"
                style="background: url('../../assets/img/icons/pme-single-quote-icon.png');"
              ></i>
              <div>Add Single Quotation</div>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link link-colorless" [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'file']">
              <!-- <i class="imgaction glyphicon glyphicon-ok center-block"></i> -->
              <i
                class="imgaction glyphicon center-block"
                style="background: url('../../assets/img/icons/pme-batch-quote-icon.png');"
              ></i>
              <div>Batch Upload</div>
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link link-colorless"
              [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'create-distributor']"
            >
              <i
                class="imgaction glyphicon center-block"
                style="background: url('../../assets/img/icons/pme-distributor-quote-icon.png');"
              ></i>
              <div>Distributor Quote</div>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <form class="form mt-6 ">
      <div class="row">
        <div class="col-md-5 col-lg-4 col-md-push-7 col-lg-push-8">
          <app-select
            #filterSelect
            [label]="'Search Mode'"
            [options]="searchModeOptions"
            [control]="searchForm.controls['searchMode']"
            [multiple]="true"
            (valueChange)="onSearchModeChange()"
          ></app-select>
        </div>

        <div class="col-md-7 col-lg-8 col-md-pull-5 col-lg-pull-4" [ngSwitch]="searchForm.controls['searchMode'].value">
          <app-input
            *ngSwitchDefault=""
            [control]="searchForm.controls['search_text']"
            [iconBefore]="'glyphicon-search'"
            [iconAfter]="'glyphicon-remove'"
            (keydown.enter)="applySearch($event)"
            (iconAfterClick)="resetSearch(searchForm.controls['search_text'])"
          ></app-input>
        </div>
      </div>
    </form>
    <div style="width: 100%; height: 100%; overflow-y: auto;" *ngIf="!(_itemsLoader.active | async)">
      <div class="row">
        <div class="col-md-12">
          <div class="p0 form-control brand-control">
            <div class="row">
              <div class="col-md-6 ellipsis">
                <div class="button-group" style="color: #4975B8">
                  <span (click)="onOpenModal()" role="button">
                    Columns <i class="glyphicon glyphicon-triangle-bottom"></i>
                  </span>

                  <span (click)="onClearFilter()" role="button" class="ml-20"> Clear Filter</span>
                  <!-- <span (click)="onDownloadCsv()" role="button" class="ml-20"> Download Csv</span> -->
                </div>
              </div>
              <div class="col-md-6" *ngIf="tableDataset">
                <div class="pull-right">
                  {{
                    tableDataset.count || 0
                      | pluralize: { other: "{} Price Records", "0": "No Price Records", "1": "{} Price Records" }
                  }}
                </div>
                <div class="pull-right">
                  <app-pagination
                    [page]="tableViewForm.controls['page']"
                    [pageSize]="tableViewForm.controls['page_size']"
                    [currentPageSize]="_currentPageSize"
                    [rowsCount]="tableDataset.count"
                  >
                  </app-pagination>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ag-grid-angular
        #agGrid
        style="width: 100%; height: calc(100vh - 250px)"
        [style.pointer-events]="isColumnOpen ? 'none' : null"
        id="myGrid"
        class="ag-theme-balham"
        [modules]="modules"
        [columnDefs]="columnDefs"
        [defaultColDef]="defaultColDef"
        [rowData]="rowData"
        [pagination]="true"
        [rowSelection]="'multiple'"
        (columnPinned)="onColumnPinned($event)"
        (columnVisible)="onColumnVisible($event)"
        (columnMoved)="onColumnMoved($event)"
        [suppressPaginationPanel]="true"
        [suppressRowClickSelection]="true"
        [paginationPageSize]="tableViewForm.controls['page_size'].value"
        [frameworkComponents]="frameworkComponents"
        (gridReady)="onGridReady($event)"
      >
      </ag-grid-angular>
      <!-- (rowValueChanged)="onRowValueChanged($event)"
        (rowEditingStarted)="onRowEditingStarted($event)"
        (rowEditingStopped)="onRowEditingStopped($event)"
        [rowClassRules]='rowClassRules'
        [editType]="'fullRow'" -->

      <div class="row">
        <div class="col-md-12">
          <div class="p0 form-control brand-control">
            <div class="row">
              <div class="col-md-12" *ngIf="tableDataset">
                <div class="pull-right">
                  {{
                    tableDataset.count || 0
                      | pluralize: { other: "{} Price Records", "0": "No Price Records", "1": "{} Price Records" }
                  }}
                </div>
                <div class="pull-right">
                  <app-pagination
                    [page]="tableViewForm.controls['page']"
                    [pageSize]="tableViewForm.controls['page_size']"
                    [currentPageSize]="_currentPageSize"
                    [rowsCount]="tableDataset.count"
                  >
                  </app-pagination>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        *ngIf="isColumnOpen"
        class="modalDisplay"
        [style.top]="
          (userService.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
          (userService.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)
            ? '215px'
            : '150px'
        "
      >
        <div class="panel panel-default">
          <div class="panel-body">
            <strong style="font-size: 20px;">Columns </strong>
            <div class="row" style="margin-top: 20px;">
              <!-- <div class="col-md-1 col-sm-1">
                <input class="form-check-input checkboxDisplay" type="checkbox" onclick="return false;" />
              </div>
              <div class="col-md-5 col-sm-5">
                <p class="mt-6">Fix Header</p>
              </div> -->
              <div class="col-md-12 col-sm-12">
                <p class="pull-right modalDisplayRestore" (click)="onRestoreColumn()">Restore Defaults</p>
              </div>
            </div>
            <div class="row searchBar">
              <div class="col-md-12 col-sm-12">
                <app-input
                  [placeholder]="'Search'"
                  [iconBefore]="'glyphicon-search'"
                  [iconAfter]="'glyphicon-remove'"
                  [value]="searchValue"
                  onfocus="this.value='' "
                  (iconAfterClick)="onClearSearchField($event)"
                  (keyup)="onSearch($event)"
                ></app-input>
              </div>
            </div>
            <div style="height: 300px; overflow: scroll">
              <div class="row " *ngFor="let col1 of showCol">
                <div class="col-md-1" *ngIf="col1.canAccess">
                  <div class="form-check">
                    <input
                      class="form-check-input checkboxDisplay"
                      type="checkbox"
                      [value]="col1.isDisplay"
                      [checked]="col1.isDisplay"
                      id="defaultCheck1"
                      (change)="onToggoleCheckbox(col1)"
                    />
                  </div>
                </div>
                <div class="col-md-7" *ngIf="col1.canAccess">
                  <p style="margin-top: 5px;">{{ col1.headerName }}</p>
                </div>
                <div class="col-md-4" *ngIf="col1.canAccess">
                  <i
                    style="margin-top: 5px; padding-right: inherit;"
                    role="button"
                    class="glyphicon glyphicon-pushpin pull-right"
                    [style.font-size]="col1.isPin ? '20px' : '14px'"
                    [style.color]="col1.isPin ? '#0D47A1' : 'cadetblue'"
                    (click)="onToggolePin(col1)"
                  ></i>
                </div>
              </div>
            </div>
            <div class="pull-right">
              <button type="button" class="btn btn-default" (click)="onClose()">Cancel</button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="onSaveChanges()"
                [ngClass]="{ disabled: !isChanged }"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrls: ['./pme.scss'],
})
export class QuotationListComponent implements OnInit, OnDestroy, AfterViewInit {
  config = config;
  readonly userRole = UserRole;
  SearchModes = SearchModes;
  searchForm: AppFormGroup<{
    searchMode: FormControl;
    search_text: FormControl;
    status: FormControl;
    requestor: FormControl;
    customer_code: FormControl;
    material_code: FormControl;
    sales_district: FormControl;
    uom: FormControl;
  }>;

  searchModeOptions = AppSelectOptionData.fromList(
    [
      SearchModes.STATUS,
      SearchModes.CUSTOMER_CODE,
      SearchModes.MATERIAL_CODE,
      SearchModes.REQUESTOR,
      SearchModes.SALES_DISTRICT,
      SearchModes.UOM,
    ],
    ['Status', 'Customer Code', 'Materail Code', 'Requestor', 'Sales District', 'Uom'],
  );

  allCol = QuotationAgGridDisplayList.items;
  isChanged: boolean = false;
  showCol: ShowCol[] = [];
  public modules = [
    ClientSideRowModelModule,
    CsvExportModule,
    MenuModule,
    FiltersToolPanelModule,
    ColumnsToolPanelModule,
    RichSelectModule,
    SetFilterModule,
  ];
  searchValue: string = '';
  isColumnOpen: boolean = false;
  public columnDefs: ColDef[] = [];
  public defaultColDef;
  public rowData: any = [];
  public frameworkComponents;
  tableDataset: {
    data: any;
    count: number;
  };
  public gridColumnApi;
  public user;
  public element: JQuery;
  readonly _itemsLoader: ReactiveLoader<IBackendList<IQuotationRecord>, void>;
  readonly tableViewForm: FormGroup;

  private readonly viewFormSubscription: ISubscription;
  private _subscriptions: Subscription[] = [];
  private gridApi;
  private _currentPageSize: number = 50;

  constructor(public pmeService: PmeService, private userService: UserService, private el: ElementRef) {
    this.user = this.userService.getUser();
    // this.setColDefAggrid();
    this.setLocalStorage();
    this.setColumnDisplay();
    this.setPaginationForm();
    this.defaultColDef = {
      // flex: 1,
      resizable: true,
      filter: true,
      sortable: true,
      // lockPosition: true,
      isRowSelectable: (rowNode) => {
        return rowNode.data.canCheck;
      },
    };
    // this._currentPageSize = 50;
    const localCol: LocalCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    const userLocalData =
      localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).pageInfo;

    this.tableViewForm = new FormGroup({
      order: new FormControl(userLocalData.order), // ordering
      page: new FormControl(userLocalData.page),
      page_size: new FormControl(userLocalData.page_size),
    });
    this._currentPageSize = userLocalData.page_size;

    this._itemsLoader = new ReactiveLoader(() => {
      return pmeService.quotationList(this._prepareRequestParams());
    });

    this._itemsLoader.subscribe(this.onLoaded.bind(this));

    this.viewFormSubscription = this.tableViewForm.valueChanges.subscribe((_) => {
      if (this.gridApi) {
        this.gridApi.paginationGoToPage(_.page - 1);
        this.gridApi.paginationSetPageSize(_.page_size);
        this.setCurrentPageSize();
        this.updateLocalStoragePageInfo();
      }
    });
    this._initForms();

    this.frameworkComponents = {
      medalCellRenderer: AgGridActionComponent,
      downloadQuotationFile: QuotationFileDownloadComponent,
      datepickerfrom: AgGridDatepickerFromComponent,
      datepickerto: AgGridDatepickerToComponent,
    };
  }
  ngOnInit(): void {
    this._itemsLoader.load();
  }

  ngAfterViewInit() {
    this.element = jQuery(this.el.nativeElement).find('select');
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((_) => _.unsubscribe());
    if (this.viewFormSubscription) {
      this.viewFormSubscription.unsubscribe();
    }
  }

  onLoaded(priceRecords: IBackendList<IQuotationRecord>) {
    this.rowData = priceRecords.results ? priceRecords.results : priceRecords.data;
    // this.rowData.map((data) => {
    //   data.canCheck = !this._userHasSelectionAccess(data);
    //   data.canEditKeyUser = this._onCheckEditForKeyUser(data);
    // });
    this.tableDataset = {
      data: this.rowData,
      count: priceRecords.count,
    };
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  onClearFilter() {
    this.gridApi.setFilterModel(null);
  }

  onDownloadCsv() {
    this.gridApi.exportDataAsCsv();
  }

  onSearchModeChange(): void {
    const controls = this.searchForm.controls;

    if (controls['status'].value) {
      controls['status'].reset('');
      this._itemsLoader.load();
    }

    if (controls['customer_code'].value) {
      controls['customer_code'].reset('');
      this._itemsLoader.load();
    }

    if (controls['material_code'].value) {
      controls['material_code'].reset('');
      this._itemsLoader.load();
    }

    if (controls['requestor'].value) {
      controls['requestor'].reset('');
      this._itemsLoader.load();
    }

    if (controls['sales_district'].value) {
      controls['sales_district'].reset('');
      this._itemsLoader.load();
    }

    if (controls['uom'].value) {
      controls['uom'].reset();
      this._itemsLoader.load();
    }
  }

  onColumnPinned(event) {
    for (let index = 0; index < this.allCol.length; index++) {
      let item = this.allCol[index];
      if (item.field === event.column.colDef.field) {
        if (event.pinned === null) {
          item.isPin = false;
          item.pinned = null;
        } else {
          item.isPin = true;
          item.pinned = event.pinned;
        }
        break;
      }
    }
    this.onSaveChanges(false);
  }
  onColumnVisible(event) {
    for (let index = 0; index < this.allCol.length; index++) {
      let item = this.allCol[index];
      if (item.field === event.column.colDef.field) {
        if (event.visible) {
          item.isDisplay = true;
          item.isPin = event.column.pinned ? true : false;
        } else {
          item.isDisplay = false;
          item.isPin = false;
        }
        break;
      }
    }
    this.onSaveChanges(false);
  }

  onColumnMoved(event) {
    const index = this.allCol.findIndex((col) => col.field === event.column.colDef.field);
    this.swapColumn(this.allCol, index, event.toIndex - 2);
    this.onSaveChanges(false);
  }

  swapColumn(arr, from, to) {
    arr.splice(from, 1, arr.splice(to, 1, arr[from])[0]);
  }

  onBulkActionComplete(successItems: IQuotationRecord[]): void {
    if (successItems.length) {
      this._itemsLoader.load();
    }
  }

  onRestoreColumn() {
    this.allCol = QuotationAgGridDisplayList.items;
    this.onCheckAsscessColumnSet();
    this.showCol = this.allCol;
    this.isChanged = true;
  }
  onClearSearchField(e) {
    this.searchValue = '';
    this.showCol = this.allCol.filter((option) => option.headerName.toLowerCase().includes(this.searchValue));
  }

  setCurrentPageSize(): void {
    this._currentPageSize = Math.min(
      this.tableViewForm.controls['page_size'].value,
      this.tableDataset.count -
        (this.tableViewForm.controls.page.value - 1) * this.tableViewForm.controls.page_size.value,
    );
    this._itemsLoader.load();
  }

  setColumnDisplay() {
    const localCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    const ppp = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).col;
    if (ppp) {
      this.columnDefs = [];
      ppp.map((local) => {
        if (local.isDisplay) {
          let display: ColDef = {
            headerName: local.headerName,
            field: local.field,
            headerTooltip: local.headerName,
            tooltipField: local.field,
            width: local.width,
            valueFormatter: (params) =>
              local.isDecimal && params.value !== null
                ? parseFloat(params.value).toFixed(2)
                : local.field === 'created_date' || local.field === 'price_validity_start_date'
                ? moment(params.value).format('YYYY-MM-DD')
                : params.value,
          };
          if (local.isPin) {
            display.pinned = !local.pinned ? 'left' : local.pinned;
          }
          if (local.field === 'status') {
            display.width = 220;
            display.cellRenderer = CellStyleDefineForQuotationStatus;
          } else if (local.field === 'quote_id') {
            display.width = 80;
            display.lockPosition = true;
            // display.cellRenderer = 'totalValueRenderer';
            display.tooltipField = null;
          } else if (local.field === 'file_name') {
            display.width = 120;
            display.cellRenderer = CellStyleDefineForQuotationFile;
          } else if (local.field === 'download') {
            display.width = 120;
            display.cellRenderer = 'downloadQuotationFile';
          }
          this.columnDefs = [...this.columnDefs, { ...display }];
        }
      });
    }
  }

  onCheckAsscessColumnSet() {
    this.allCol.map((col) => {
      col.canAccess =
        this.user.role === UserRole.SALES_REP &&
        (col.field === 'ai_total_product_cost' ||
          // col.field === 'ti_sm_threshold_nm' ||
          col.field === 'sm_threshold_price' ||
          // col.field === 'ti_cd_threshold_nm' ||
          col.field === 'requested_selling_price_nm' ||
          col.field === 'last_transaction_nm' ||
          col.field === 'last_validated_price_nm' ||
          col.field === 'rsp_change_vs_last_transacted_price' ||
          col.field === 'rsp_change_vs_last_validated_price' ||
          col.field === 'rsp_vs_adjusted_nba_price' ||
          col.field === 'cd_threshold_price')
          ? false
          : // : this.user.role === UserRole.SALES_MANAGER &&
            //   (col.field === 'ti_cd_threshold_nm' || col.field === 'cd_threshold_price')
            // ? false
            true;
      if (this.user.role === UserRole.SALES_REP && col.field === 'gi_sales_rep_name') {
        col.isDisplay = false;
      } else if (this.user.role === UserRole.SALES_MANAGER && col.field === 'gi_sales_manager_name') {
        col.isDisplay = false;
      } else if (this.user.role === UserRole.GMM && col.field === 'gi_gmm_name') {
        col.isDisplay = false;
      } else if (this.user.role === UserRole.CD && col.field === 'gi_commercial_director_name') {
        col.isDisplay = false;
      }
    });
  }

  setLocalStorage() {
    this.onCheckAsscessColumnSet();
    let localCol: LocalCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    const ppp = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email);
    this.allCol = ppp ? ppp.col : this.allCol;
    if (!localCol) {
      let localData = {
        data: [
          {
            col: this.allCol,
            userId: this.user.email,
          },
        ],
      };
      localStorage.setItem('quotationDisplayTable', JSON.stringify(localData));
    } else {
      if (!ppp) {
        if (!localCol.data) {
          localCol.data = [];
          localStorage.removeItem('quotationDisplayTable');
        }
        localCol.data.push({
          col: this.allCol,
          userId: this.user.email,
        });
        localStorage.setItem('quotationDisplayTable', JSON.stringify(localCol));
      }
    }
  }

  setPaginationForm() {
    let localCol: LocalCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    let userLocalData = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email);
    if (userLocalData.pageInfo === undefined) {
      userLocalData.pageInfo = {
        order: '', // ordering
        page: 1,
        page_size: this._currentPageSize,
      };
    } else {
      userLocalData.pageInfo = {
        order: userLocalData.pageInfo.order,
        page: userLocalData.pageInfo.page,
        page_size: userLocalData.pageInfo.page_size,
      };
    }
    localCol.data = localCol.data.filter((lcol) => lcol.userId !== this.user.email);
    localCol.data.push(userLocalData);
    localStorage.setItem('quotationDisplayTable', JSON.stringify(localCol));
  }

  updateLocalStoragePageInfo() {
    let localCol: LocalCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    let userLocalData = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email);
    userLocalData.pageInfo = {
      order: this.tableViewForm.controls['order'].value,
      page: this.tableViewForm.controls['page'].value,
      page_size: this.tableViewForm.controls['page_size'].value,
    };
    localCol.data = localCol.data.filter((lcol) => lcol.userId !== this.user.email);
    localCol.data.push(userLocalData);
    localStorage.setItem('quotationDisplayTable', JSON.stringify(localCol));
  }

  onOpenModal() {
    this.isColumnOpen = true;
    this.isChanged = false;
    this.searchValue = '';
    const localCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    const ppp = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).col;
    this.allCol = ppp;
    this.showCol = ppp;
  }

  onToggoleCheckbox(col): void {
    this.showCol.map((item) => {
      if (item.headerName === col.headerName) {
        item.isDisplay = !col.isDisplay;
        if (!item.isDisplay) {
          item.isPin = false;
        }
        this.isChanged = true;
      }
    });
  }
  onToggolePin(col): void {
    this.showCol.map((item) => {
      if (item.headerName === col.headerName && col.isDisplay) {
        item.isPin = !col.isPin;
        this.isChanged = true;
      }
    });
  }
  onRerender() {
    // this.setColDefAggrid();
    const localCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    const ppp = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).col;
    this.allCol = ppp;
    this.showCol = ppp;
    this.setColumnDisplay();
  }

  onSaveChanges(isRerender: boolean = true) {
    let localCol: LocalCol = JSON.parse(localStorage.getItem('quotationDisplayTable'));
    localCol.data = localCol.data.filter((lcol) => lcol.userId !== this.user.email);

    localCol.data.push({
      col: this.allCol,
      userId: this.user.email,
      pageInfo: {
        order: this.tableViewForm.controls['order'].value,
        page: this.tableViewForm.controls['page'].value,
        page_size: this.tableViewForm.controls['page_size'].value,
      },
    });

    localStorage.setItem('quotationDisplayTable', JSON.stringify(localCol));
    if (isRerender) {
      this.onRerender();
      this.onClose();
    }
  }
  onClose() {
    this.isColumnOpen = false;
  }

  onSearch(event: any) {
    let searchValue = event.target.value.toLowerCase();
    this.showCol = this.allCol.filter((option) => option.headerName.toLowerCase().includes(searchValue));
    this.searchValue = searchValue;
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  applySearch(event): void {
    if (event.key === 'Enter' && this.searchForm.valid) {
      this._itemsLoader.load();
    }
  }
  resetSearch(control: FormControl): void {
    if (control.value) {
      //jQuery(this.element[0]).val([]).multiselect('refresh');
      //this.searchForm.reset();
      control.reset('');
      this._itemsLoader.load();
    }
  }

  private _prepareRequestParams(): IPmeSearchParams {
    const pagination = this.tableViewForm.controls;
    const search = this.searchForm.controls;

    let params = {
      offset: (pagination['page'].value - 1) * pagination['page_size'].value,
      limit: pagination['page_size'].value,
      order: pagination['order'].value,
    };

    // ?search_fields=gi_commercial_director_name&search=Christine Cai&search_fields=sales_district&search=Dong
    // ?search_fields=gi_commercial_director_name&search=Christine Cai&search_fields=sales_district&search=Dong

    if (search['search_text'].value) {
      if (!search['searchMode'].value || search['searchMode'].value.length <= 0) {
        params['search_fields'] = 'sales_district';
        params['search'] = search['search_text'].value;
      } else {
        search['searchMode'].value.forEach((sField) => {
          if (sField === SearchModes.STATUS) {
            params['search_fields']
              ? (params['search_fields'] += '&search_fields=status&search=' + search['search_text'].value)
              : (params['search_fields'] = 'status&search=' + search['search_text'].value);
          }
          if (sField === SearchModes.CUSTOMER_CODE) {
            params['search_fields']
              ? (params['search_fields'] += '&search_fields=customer_code&search=' + search['search_text'].value)
              : (params['search_fields'] = 'customer_code&search=' + search['search_text'].value);
          }
          if (sField === SearchModes.MATERIAL_CODE) {
            params['search_fields']
              ? (params['search_fields'] += '&search_fields=material_code&search=' + search['search_text'].value)
              : (params['search_fields'] = 'material_code&search=' + search['search_text'].value);
          }
          if (sField === SearchModes.UOM) {
            params['search_fields']
              ? (params['search_fields'] += '&search_fields=uom&search=' + search['search_text'].value)
              : (params['search_fields'] = 'uom&search=' + search['search_text'].value);
          }
          if (sField === SearchModes.SALES_DISTRICT) {
            params['search_fields']
              ? (params['search_fields'] += '&search_fields=sales_district&search=' + search['search_text'].value)
              : (params['search_fields'] = 'sales_district&search=' + search['search_text'].value);
          }
          if (sField === SearchModes.REQUESTOR) {
            params['search_fields']
              ? (params['search_fields'] += '&search_fields=requestor&search=' + search['search_text'].value)
              : (params['search_fields'] = 'requestor&search=' + search['search_text'].value);
          }
        });
      }
    }

    return params;
  }

  private _initForms(): void {
    const searchForm = new AppFormGroup({
      searchMode: new FormControl(''),
      search_text: new FormControl(''),
      status: new FormControl(''),
      requestor: new FormControl(''),
      customer_code: new FormControl(''),
      material_code: new FormControl(''),
      sales_district: new FormControl(''),
      uom: new FormControl(''),
    });

    this._subscriptions = [];
    this.searchForm = searchForm;
    this.onSearchModeChange();

    this._subscriptions.push(
      Observable.merge(this.searchForm.valueChanges)
        .debounceTime(100)
        .subscribe(() => {
          // if (this.searchForm.valid) {
          //   this._itemsLoader.load();
          // }
        }),
    );
  }
}

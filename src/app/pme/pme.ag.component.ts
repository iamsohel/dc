import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup } from '@angular/forms';

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
import { NotificationService } from '../core/services/notification.service';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';
import { AppFormGroup } from '../utils/forms';
import { ReactiveLoader } from '../utils/reactive-loader';

import { AgGridActionComponent } from './ag-grid-action.component';
import { AgGridDatepickerFromComponent } from './ag-grid-datepicker-from.component';
import { AgGridDatepickerToComponent } from './ag-grid-datepicker-to.component';
import { AgGridNavigaterComponent } from './ag-grid-navigater.component';
import { generateCsvFilters } from './common-function';
import { PmeAgGridDisplayList, ShowCol } from './display-column-list.data';
import { PmeService } from './pme-management.service';
import {
  CellStyleDefineForPriority,
  CellStyleDefineForStatus,
  CellStyleDefineForType,
  ColDef,
  // generateCsvFilters,
  IPmeSearchParams,
  IPmeUpdateRequest,
  IPriceRecord,
  LocalCol,
  // ValueSetter,
} from './pme.interfaces';
import { PrepareRequestParams, SearchForm, SearchModeChange, SearchModeOptions, SearchModes } from './search-helper';

@Component({
  selector: 'ag-grid-pme',
  template: `<div class="example-wrapper">
    <!-- <app-spinner [visibility]="_itemsLoader.active | async"></app-spinner> -->
    <pme-operations
      *ngIf="rowData.length > 0"
      [(selectedItems)]="selectedItems"
      (committed)="onBulkActionComplete($event)"
      (downloadCsv)="onDownloadCsv()"
      (uploadCsv)="onUploadCsv()"
    ></pme-operations>
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
                  <app-pme-pagination
                    [page]="tableViewForm.controls['page']"
                    [pageSize]="tableViewForm.controls['page_size']"
                    [currentPageSize]="_currentPageSize"
                    [rowsCount]="tableDataset.count"
                    [hasAllOption]="false"
                  >
                  </app-pme-pagination>
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
        (rowSelected)="onRowSelected($event)"
        (columnPinned)="onColumnPinned($event)"
        (columnVisible)="onColumnVisible($event)"
        (columnMoved)="onColumnMoved($event)"
        (filterChanged)="onFilterChanged($event)"
        [suppressPaginationPanel]="true"
        [suppressRowClickSelection]="true"
        [paginationPageSize]="tableViewForm.controls['page_size'].value"
        [frameworkComponents]="frameworkComponents"
        (gridReady)="onGridReady($event)"
      >
      </ag-grid-angular>
      <!-- edit ag grid start and go after 150 line  -->
      <!-- (rowValueChanged)="onRowValueChanged($event)"
        (rowEditingStarted)="onRowEditingStarted($event)"
        (rowEditingStopped)="onRowEditingStopped($event)"
        [rowClassRules]="rowClassRules"
        [editType]="'fullRow'" -->
      <!-- edit ag grid end -->
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
                  <app-pme-pagination
                    [page]="tableViewForm.controls['page']"
                    [pageSize]="tableViewForm.controls['page_size']"
                    [currentPageSize]="_currentPageSize"
                    [rowsCount]="tableDataset.count"
                    [hasAllOption]="false"
                  >
                  </app-pme-pagination>
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
export class PmeAgComponent implements OnInit, OnDestroy, AfterViewInit {
  config = config;
  readonly userRole = UserRole;
  SearchModes = SearchModes;
  searchForm: AppFormGroup<{
    searchMode: FormControl;
    search_text: FormControl;
    item_id: FormControl;
    gi_status: FormControl;
    priority_of_review: FormControl;
    product_type: FormControl;
    record_type: FormControl;
    customer_name: FormControl;
    gi_product_name: FormControl;
    gi_sales_manager_name: FormControl;
    gi_sales_rep_name: FormControl;
    gi_material_name: FormControl;
    gi_material_code: FormControl;
    gi_customer_code: FormControl;
    gi_commercial_director_name: FormControl;
    gi_gmm_name: FormControl;
    gi_region: FormControl;
    gi_sales_district: FormControl;
    uom: FormControl;
    invoice_currency: FormControl;
    last_invoice_price: FormControl;
    dvp_model_price: FormControl;
    last_validated_price: FormControl;
    requested_selling_price: FormControl;
    annualized_volume_commitment: FormControl;
    last_twelve_months_volume: FormControl;
    price_valid_from: FormControl;
    price_valid_to: FormControl;
    current_sap_price_validity_date: FormControl;
    gi_portfolio_strategy: FormControl;
    gi_exworks_dvp_price: FormControl;
    gi_dvp_model_price_in_invoice_currency: FormControl;
    gi_vbp_price: FormControl;
    gi_last_invoice_price_date: FormControl;
    gi_last_invoice_price_currency: FormControl;
    gi_last_invoice_price_in_local_currency: FormControl;
    gi_last_validated_price_currency: FormControl;
    pdm_business_type: FormControl;
    pdm_nba_company_name: FormControl;
    pdm_nba_product: FormControl;
    pdm_rltv_strength_huntsman: FormControl;
    pdm_rltv_strength_nba: FormControl;
    pdm_nba_price_currency: FormControl;
    pdm_nba_price_per_kg: FormControl;
    pdm_source_of_nba_price: FormControl;
    pdm_third_party: FormControl;
    pdm_adjusted_nba_price_per_kg: FormControl;
    pdm_product_differentiation: FormControl;
    pdm_top_value_drivers_differentiation: FormControl;
    pdm_other_value_drivers_differentiation: FormControl;
    pdm_spot_deal: FormControl;
    ai_product_site: FormControl;
    ai_sales_organization: FormControl;
    ai_freight: FormControl;
    ai_duty_applied: FormControl;
    ai_last_mile: FormControl;
    ai_buffer: FormControl;
    ai_commission: FormControl;
    ai_rebate: FormControl;
    ai_fx_rate: FormControl;
    ai_party: FormControl;
    ai_freight_surcharge: FormControl;
    ai_profit_sharing: FormControl;
    srep_justification_for_lower_rsp: FormControl;
    srep_justification_for_lower_volume: FormControl;
    ai_total_product_cost: FormControl;
    sm_threshold_price: FormControl;
    requested_selling_price_nm: FormControl;
    last_transaction_nm: FormControl;
    last_validated_price_nm: FormControl;
    rsp_change_vs_last_transacted_price: FormControl;
    rsp_change_vs_last_validated_price: FormControl;
    rsp_vs_adjusted_nba_price: FormControl;
    cd_threshold_price: FormControl;
  }>;
  searchModeOptions = SearchModeOptions;

  allCol = PmeAgGridDisplayList.items;
  isChanged: boolean = false;
  showCol: ShowCol[] = [];
  editableId: string = '';
  selectedItems: IPriceRecord[] = [];
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
  searchColumnsCsv = [];
  displayColumnList: any = [];
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
  public rowClassRules: any;
  readonly _itemsLoader: ReactiveLoader<IBackendList<IPriceRecord>, void>;
  readonly tableViewForm: FormGroup;

  private readonly viewFormSubscription: ISubscription;
  private _subscriptions: Subscription[] = [];
  private gridApi;
  private _currentPageSize: number = 50;

  constructor(
    public pmeService: PmeService,
    private userService: UserService,
    private el: ElementRef,
    private notifications: NotificationService,
  ) {
    this.user = this.userService.getUser();
    this.setColDefAggrid();
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
    const localCol: LocalCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
    const userLocalData =
      localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).pageInfo;

    this.tableViewForm = new FormGroup({
      order: new FormControl(userLocalData.order), // ordering
      page: new FormControl(userLocalData.page),
      page_size: new FormControl(userLocalData.page_size),
    });
    this._currentPageSize = userLocalData.page_size;

    this._itemsLoader = new ReactiveLoader(() => {
      this.searchColumnsCsv = [];
      return pmeService.listAllPriceRecords(this.displayColumnList, PrepareRequestParams(this.tableViewForm, this.searchForm, this.searchColumnsCsv));
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
      totalValueRenderer: AgGridNavigaterComponent,
      datepickerfrom: AgGridDatepickerFromComponent,
      datepickerto: AgGridDatepickerToComponent,
    };
    // ..............for ag grid edit ...............
    // this.rowClassRules = {
    //   'row-fail': (params) => {
    //     if (this.editableId && this.editableId === params.data.item_id && !this._onValidCheckForSave(params.data)) {
    //       return true;
    //     } else {
    //       return false;
    //     }
    //   },
    // };
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

  onLoaded(priceRecords: IBackendList<IPriceRecord>) {
    this.rowData = priceRecords.results ? priceRecords.results : priceRecords.data;
    this.rowData.map((data) => {
      data.canCheck = !this._userHasSelectionAccess(data);
      // data.canEditKeyUser = this._onCheckEditForKeyUser(data); // for ag grid edit
    });

    this.tableDataset = {
      data: this.rowData,
      count: priceRecords.count,
    };
  }

  onFilterChanged(event) {
    this.tableDataset = {
      data: this.rowData,
      count: this.gridApi.getDisplayedRowCount() < this.rowData.length ? this.gridApi.getDisplayedRowCount() : this.rowData.length,
    };

    if (this.tableViewForm.get('page').value * this.tableViewForm.get('page_size').value > this.tableDataset.count) {
      this.tableViewForm.patchValue({
        page: 1,
      });
      this._currentPageSize = this.tableViewForm.get('page_size').value;
    }

  }

  _userHasSelectionAccess(item) {
    if (this.user.role === UserRole.SALES_REP) {
      return (
        item.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
        (item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SM ||
          item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD ||
          item.gi_status !== config.pmeitem.status.labels.VALIDATED_PRICE) &&
        item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR
      );
    } else if (this.user.role === UserRole.GPO_ANALYST) {
      return (
        item.priority_of_review !== config.pmeitem.priority.labels.AUTO_EXTENDED ||
        item.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE
      );
    } else {
      return true;
    }
  }

  _onCheckEditForKeyUser(item) {
    if (this.user.role === UserRole.KEY_USER) {
      return (
        item.gi_status === config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE ||
        item.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR
      );
    } else {
      return false;
    }
  }

  _onValidCheckForSave(data) {
    if (
      !data.requested_selling_price ||
      !data.annualized_volume_commitment ||
      !data.price_valid_from ||
      !data.price_valid_to
    ) {
      return false;
    }
    return true;
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  onClearFilter() {
    this.gridApi.setFilterModel(null);
    const localCol: LocalCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
    const userLocalData =
      localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).pageInfo;

    this.tableViewForm.patchValue({
      order: userLocalData.order, // ordering
      page: userLocalData.page,
      page_size: userLocalData.page_size,
    });
    this._currentPageSize = userLocalData.page_size;
  }

  onDownloadCsv() {
    const ccc = this.gridApi.getFilterModel();
    let apiCall = {
      // column_names: [],
      search: {
        search_text: this.searchForm.get('search_text').value,
        search_columns: this.searchColumnsCsv,
      },
      filters: ccc ? generateCsvFilters(ccc) : null,
    };
    this.pmeService.removeEmptyProperties(apiCall.filters);

    // for (let i = 2; i < this.columnDefs.length; i++) {
    //   const element = this.columnDefs[i];
    //   apiCall.column_names.push(element.field);
    // }

    this.pmeService.pmecsvdownload(apiCall).subscribe((data) => {
      let link = document.createElement('a');

      link.target = '_blank';
      link.href = 'data:attachment/csv;charset=utf-8,' + encodeURI(data);
      link.download = 'price_record.csv';
      link.click();
    });
  }

  onUploadCsv() {}

  onSearchModeChange(): void {
    SearchModeChange(this.searchForm, this._itemsLoader);
  }

  onRowSelected(params) {
    if (params.node.isSelected()) {
      if (this.selectedItems.find((dd) => dd.item_id === params.node.data.item_id) === undefined) {
        this.selectedItems = [...this.selectedItems, ...params.node.data];
      }
    } else {
      this.selectedItems = this.selectedItems.filter((ee) => ee.item_id !== params.data.item_id);
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

  onRowValueChanged(event) {
    console.log(event);
    if (!event.data.requested_selling_price && this.user.role === UserRole.SALES_REP) {
      this.notifications.create('Requested selling price is required', config.notification.level.values.DANGER);
      return;
    } else if (!event.data.annualized_volume_commitment && this.user.role === UserRole.SALES_REP) {
      this.notifications.create('Annualized volume commitment is required', config.notification.level.values.DANGER);
      return;
    } else if (!event.data.price_valid_from) {
      this.notifications.create('Price valid from is required', config.notification.level.values.DANGER);
      return;
    } else if (!event.data.price_valid_to) {
      this.notifications.create('Price valid to is required', config.notification.level.values.DANGER);
      return;
    }
    if (event.data.price_valid_from > event.data.price_valid_to) {
      this.notifications.create('From date should be less than to date', config.notification.level.values.DANGER);
      return;
    }
    if (event.data.canCheck || (this.user.role === UserRole.KEY_USER && event.data.canEditKeyUser)) {
      let saveData = event.data;
      delete saveData.price_record_status;
      saveData.pdm_spot_deal = event.data.pdm_spot_deal === '' ? 'Not Set' : event.data.pdm_spot_deal;
      saveData.pdm_product_differentiation =
        event.data.pdm_product_differentiation === '' ? 'Not Set' : event.data.pdm_product_differentiation;

      this.pmeService.makeEmptyPropertiesNull(saveData);

      this._subscriptions.push(
        this.pmeService.update(saveData.item_id, <IPmeUpdateRequest> saveData).subscribe((data) => {}),
      );
    }
  }

  onRowEditingStarted(event) {
    this.editableId = '';
    this.editableId = event.data.item_id;
  }

  onRowEditingStopped(event) {
    this.editableId = '';
  }

  swapColumn(arr, from, to) {
    arr.splice(from, 1, arr.splice(to, 1, arr[from])[0]);
  }

  onBulkActionComplete(successItems: IPriceRecord[]): void {
    if (successItems.length) {
      this._itemsLoader.load();
    }
  }

  onRestoreColumn() {
    this.allCol = PmeAgGridDisplayList.items;
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
    // this._itemsLoader.load();
  }

  setColDefAggrid() {
    this.columnDefs = [
      {
        headerName: '',
        width: 50,
        checkboxSelection: (params) => {
          return params.node.data.canCheck;
        },
        cellRenderer: (params) => {
          if (!params.node.data.canCheck) {
            return `<input type="checkbox" disabled />`;
          }
        },
        // headerCheckboxSelection: true,
        // headerCheckboxSelectionFilteredOnly: true,
        pinned: 'left',
        hide: this.user.role === UserRole.SALES_REP || this.user.role === UserRole.GPO_ANALYST ? false : true,
        menuTabs: [],
        suppressColumnsToolPanel: true,
        lockPosition: true,
      },
      {
        headerName: '',
        cellStyle: { overflow: 'visible', 'z-index': '0', position: 'relative' },
        cellRenderer: 'medalCellRenderer',
        width: 30,
        pinned: 'right',
        hide: this.user.role === UserRole.SALES_REP || this.user.role === UserRole.GPO_ANALYST ? false : true,
        menuTabs: [],
        suppressColumnsToolPanel: true,
        lockPosition: true,
      },
    ];
  }

  setColumnDisplay() {
    const localCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
    const ppp = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).col;
    if (ppp) {
      this.displayColumnList = [];
      ppp.map((local) => {
        if (local.isDisplay) {
          this.displayColumnList.push(local.field);
          let display: ColDef = {
            headerName: local.headerName,
            field: local.field,
            headerTooltip: local.headerName,
            tooltipField: local.field,
            width: local.width,
            // for ag grid edit
            // editable: (params) => {
            //   if (local.editable && local.canAccess && this.user.role === UserRole.SALES_REP && params.data.canCheck) {
            //     return true;
            //   } else if (
            //     (local.field === 'price_valid_from' || local.field === 'price_valid_to') &&
            //     this.user.role === UserRole.GPO_ANALYST &&
            //     params.data.canCheck
            //   ) {
            //     return true;
            //   } else if (
            //     (local.field === 'price_valid_from' ||
            //       local.field === 'price_valid_to' ||
            //       local.field === 'ai_freight' ||
            //       local.field === 'ai_duty_applied' ||
            //       local.field === 'ai_last_mile' ||
            //       local.field === 'ai_commission' ||
            //       local.field === 'ai_rebate' ||
            //       local.field === 'ai_freight_surcharge') &&
            //     this.user.role === UserRole.KEY_USER &&
            //     // params.data.gi_status ===
            //     (params.data.gi_status === config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE ||
            //       params.data.gi_status ===
            //         config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR) &&
            //     params.data.canEditKeyUser
            //   ) {
            //     return true;
            //   }
            //   return false;
            // },
            valueFormatter: (params) =>
              local.isDecimal && params.value !== null
                ? parseFloat(params.value).toFixed(2)
                : local.field === 'price_valid_from' &&
                  params.data.gi_status !== config.pmeitem.status.labels.VALIDATED_PRICE &&
                  this.user.role === UserRole.SALES_REP &&
                  moment(params.value).format('YYYY-MM-DD') < moment(Date.now()).format('YYYY-MM-DD')
                ? moment(Date.now()).format('YYYY-MM-DD')
                : params.value,
          };
          // for ag grid edit
          // if (local.valueSetter) {
          //   display.valueSetter = ValueSetter;
          // }

          if (local.field === 'price_valid_from') {
            display.tooltipField = null;
          }
          if (local.isPin) {
            display.pinned = !local.pinned ? 'left' : local.pinned;
          }
          if (local.field === 'product_type' || local.field === 'record_type') {
            display.width = 100;
            display.cellRenderer = CellStyleDefineForType;
          } else if (local.field === 'priority_of_review') {
            display.width = 100;
            display.cellRenderer = CellStyleDefineForPriority;
          } else if (local.field === 'gi_status') {
            display.width = 220;
            display.cellRenderer = CellStyleDefineForStatus;
          } else if (local.field === 'item_id') {
            display.width = 80;
            display.lockPosition = true;
            display.cellRenderer = 'totalValueRenderer';
            display.tooltipField = null;
            // display.valueGetter = (params) => {
            //   return params;
            // };
          }
          // for ag grid edit
          // else if (
          //   (local.field === 'pdm_product_differentiation' ||
          //     local.field === 'pdm_other_value_drivers_differentiation' ||
          //     local.field === 'pdm_top_value_drivers_differentiation' ||
          //     local.field === 'pdm_spot_deal') &&
          //   local.canAccess &&
          //   this.user.role === UserRole.SALES_REP
          // ) {
          //   display.cellEditor = 'agSelectCellEditor';
          //   if (local.field === 'pdm_product_differentiation') {
          //     display.cellEditorParams = {
          //       values: ['Not Set', 'Inferior', 'At Par', 'Superior'],
          //     };
          //   } else if (
          //     local.field === 'pdm_other_value_drivers_differentiation' ||
          //     local.field === 'pdm_top_value_drivers_differentiation'
          //   ) {
          //     display.cellEditorParams = {
          //       values: DvpModelValue.data,
          //     };
          //   } else if (local.field === 'pdm_spot_deal') {
          //     display.cellEditorParams = {
          //       values: ['Not Set', 'Yes', 'No'],
          //     };
          //   }
          // } else if (local.field === 'price_valid_from') {
          //   display.cellEditor = 'datepickerfrom';
          // } else if (local.field === 'price_valid_to') {
          //   display.cellEditor = 'datepickerto';
          // }
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
    let localCol: LocalCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
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
      localStorage.setItem('pmeDisplayTable', JSON.stringify(localData));
    } else {
      if (!ppp) {
        if (!localCol.data) {
          localCol.data = [];
          localStorage.removeItem('pmeDisplayTable');
        }
        localCol.data.push({
          col: this.allCol,
          userId: this.user.email,
        });
        localStorage.setItem('pmeDisplayTable', JSON.stringify(localCol));
      }
    }
  }

  setPaginationForm() {
    let localCol: LocalCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
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
    localStorage.setItem('pmeDisplayTable', JSON.stringify(localCol));
  }

  updateLocalStoragePageInfo() {
    let localCol: LocalCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
    let userLocalData = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email);
    userLocalData.pageInfo = {
      order: this.tableViewForm.controls['order'].value,
      page: this.tableViewForm.controls['page'].value,
      page_size: this.tableViewForm.controls['page_size'].value,
    };
    localCol.data = localCol.data.filter((lcol) => lcol.userId !== this.user.email);
    localCol.data.push(userLocalData);
    localStorage.setItem('pmeDisplayTable', JSON.stringify(localCol));
  }

  onOpenModal() {
    this.isColumnOpen = true;
    this.isChanged = false;
    this.searchValue = '';
    const localCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
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
    this.setColDefAggrid();
    const localCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
    const ppp = localCol && localCol.data && localCol.data.find((lcol) => lcol.userId === this.user.email).col;
    this.allCol = ppp;
    this.showCol = ppp;
    this.setColumnDisplay();
    this._itemsLoader.load();
    this.tableViewForm.patchValue({
      page: 1,
    });
  }

  onSaveChanges(isRerender: boolean = true) {
    let localCol: LocalCol = JSON.parse(localStorage.getItem('pmeDisplayTable'));
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

    localStorage.setItem('pmeDisplayTable', JSON.stringify(localCol));
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
    this.gridApi.forEachLeafNode((node) => {
      let pp = this.selectedItems.find((sl) => sl.item_id === node.data.item_id);
      if (pp !== undefined) {
        node.setSelected(true);
      }
    });
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

  private _initForms(): void {
    this._subscriptions = [];
    this.searchForm = SearchForm;
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

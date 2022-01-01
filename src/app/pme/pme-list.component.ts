import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IBackendList } from '../core/interfaces/common.interface';
import { IUser } from '../core/interfaces/user.interface';
import { CustomerService } from '../core/services/customer.service';
import { ProductService } from '../core/services/product.service';
import { RegionService } from '../core/services/region.service';
import { SalesPersonService } from '../core/services/sales-person.service';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';
import { AppFormGroup } from '../utils/forms';
import { ReactiveLoader } from '../utils/reactive-loader';

import { PmeService as PmeService } from './pme-management.service';
import { ICd, ICustomer, IGmm, IPmeSearchParams, IPriceRecord, IProduct, IRegion, ISalesManager, ISalesRepresentative } from './pme.interfaces';


enum SearchModes {
  STATUS = 'STATUS',
  SALES_REP = 'SALES_REP',
  SALES_MANAGER = 'SALES_MANAGER',
  CD = 'CD',
  GMM = 'GMM',
  CUSTOMER = 'CUSTOMER',
  PRODUCT_NAME = 'PRODUCT_NAME',
  REGION = 'REGION',
  SALES_DISTRICT = 'SALES_DISTRICT',
  UOM = 'UOM',
}

@Component({
  selector: 'pme-list',
  template: `
    <app-spinner [visibility]="_itemsLoader.active | async"></app-spinner>
    <div class="row">
      <div class="col-md-5 col-lg-4 col-md-push-7 col-lg-push-8">
          <pme-operations
            [(selectedItems)]="selectedItems"
            (committed)="onBulkActionComplete($event)"
        ></pme-operations>
      </div>
      <div class="col-md-7 col-lg-8 col-md-pull-5 col-lg-pull-4">
        <h3 class="text-left">Price Records</h3>
      </div>
    </div>

    <div *ngIf="paginationForm" class="pt15">
      <form class="form">
        <div class="row">
          <div class="col-md-5 col-lg-4 col-md-push-7 col-lg-push-8">
            <app-select
              [label]="'Search Mode'"
              [options]="searchModeOptions"
              [control]="searchForm.controls['searchMode']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-7 col-lg-8 col-md-pull-5 col-lg-pull-4"
            [ngSwitch]="searchForm.controls['searchMode'].value">
            <app-input *ngSwitchDefault=""
              [control]="searchForm.controls['status']"
              [iconBefore]="'glyphicon-search'"
              [iconAfter]="'glyphicon-remove'"
              (iconAfterClick)="searchForm.reset()"
            ></app-input>
            <app-input *ngSwitchCase="SearchModes.CUSTOMER"
              [control]="searchForm.controls['customer']"
              [iconBefore]="'glyphicon-search'"
              [iconAfter]="'glyphicon-remove'"
              (iconAfterClick)="searchForm.controls['customer'].setValue('')"
            ></app-input>
          </div>
        </div>
        <div class="row">
          <div class="col-md-2">
            <app-select
              [label]="'Status'"
              [options]="statusOptions"
              [control]="searchForm.controls['status']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-2">
            <app-select
              [label]="'Sales Manager'"
              [options]="salesManagerList"
              [control]="searchForm.controls['salesManagerId']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-2">
            <app-select
              [label]="'CD'"
              [options]="cdList"
              [control]="searchForm.controls['cdId']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-2">
            <app-select
              [label]="'GMM'"
              [options]="gmmList"
              [control]="searchForm.controls['gmmId']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-2">
            <app-spinner [visibility]="_customerLoader.active | async" [height]="40"></app-spinner>
            <app-select
              [label]="'Customer'"
              [options]="customerList"
              [control]="searchForm.controls['customerId']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-2">
            <app-spinner [visibility]="_productLoader.active | async" [height]="40"></app-spinner>
            <app-select
              [label]="'Product'"
              [options]="productList"
              [control]="searchForm.controls['productId']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
          <div class="col-md-2">
            <app-spinner [visibility]="_regionLoader.active | async" [height]="40"></app-spinner>
            <app-select
              [label]="'Region'"
              [options]="regionList"
              [control]="searchForm.controls['regionId']"
              (valueChange)="onSearchModeChange()"
            ></app-select>
          </div>
        </div>
      </form>

      <div class="row">
        <div class="col-xs-12">
          <div class="p0 form-control brand-control">
            <div class="row">
              <div class="col-xs-12" *ngIf="!!itemsList">
                <div class="pull-right">
                  {{(itemsList.count || 0) | pluralize:({other: '{} records', '0': 'no records', '1': '{} record'})}}
                </div>
                <div class="pull-right">
                  <app-pagination [page]="paginationForm.controls['page']"
                    [pageSize]="paginationForm.controls['page_size']"
                    [currentPageSize]="itemsList.data.length"
                    [rowsCount]="itemsList.count"
                  ></app-pagination>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-container *ngIf="!(_itemsLoader.active | async)">
      <div class="table-scroll" *ngIf="itemsList">
        <table class="table dataTable table-hover">
          <thead>
          <tr style="white-space: nowrap">
            <th style="width: 1%"></th>
            <th *ngFor="let item of options?.columns"
              [grid-sort]="item"
              [grid-sort-control]="paginationForm.controls['order']"
              [attr.style]="item.style ? (item.style | safeStyle) : ''"
            >
              {{item.name}}
            </th>
            <th class="text-right">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let item of itemsList.data">
            <td>
              <app-check
                (checkedChange)="changeSelection(item, $event)"
                [checked]="getSelectedItemIndex(item) > -1"
                [name]="'selection' + item.item_id" [type]="'checkbox'"
                [disabled]="userService.getUser() | apply: _userHasSelectionAccess: item"
                [value]="item"></app-check>
            </td>
            <td>
              <a [routerLink]="item | apply: _getItemLink"
                [title]="item.item_id"
              >{{item.item_id}}</a>
            </td>
            <td>
              <span [ngClass]="item | apply: _getItemTypeClass">
                {{item | apply: _getItemProductType: config: pmeService}}
              </span>
            </td>
            <td>
              <span [ngClass]="item | apply: _getItemTypeClass">
                {{item | apply: _getItemRecordType: config: pmeService}}
              </span>
            </td>
            <td>
              <span [ngClass]="item | apply: _getItemPriorityClass">
                {{item | apply: _getPriorityStatus: config: pmeService}}
              </span>
            </td>
            <td>
                <span [ngClass]="item | apply: _getItemStatusClass">
                  {{item | apply: _getItemStatus: config: pmeService}}
                </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_sales_rep_name') | safeStyle">
                <span [title]="item.gi_sales_rep_name">
                  {{item.gi_sales_rep_name}}
                </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_sales_manager_name') | safeStyle">
                <span [title]="item.gi_sales_manager_name">
                  {{item.gi_sales_manager_name}}
                </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_commercial_director_name') | safeStyle">
                <span [title]="item.gi_commercial_director_name">
                  {{item.gi_commercial_director_name}}
                </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gmm') | safeStyle">
                <span [title]="item.gi_gmm_name">
                  {{item.gi_gmm_name}}
                </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('customer_name') | safeStyle">
              <span [title]="item.customer_name">
                {{item.customer_name}}
              </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_product_name') | safeStyle">
              <span [title]="item.gi_product_name">
                {{item.gi_product_name}}
              </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_material_name') | safeStyle">
              <span [title]="item.gi_material_name">
                {{item.gi_material_name}}
              </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_region') | safeStyle">
              <span [title]="item.gi_region">
                {{item.gi_region}}
              </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('gi_sales_district') | safeStyle">
              <span [title]="item.gi_sales_district">
                {{item.gi_sales_district}}
              </span>
            </td>
            <td class="ellipsis" [attr.style]="_getColumnStyle('uom') | safeStyle">
              <span [title]="item.uom">
                {{item.uom}}
              </span>
            </td>
            <td class="text-muted">
              <div class="dropdown text-right" dropdown [dropdownContainer]="'.table-scroll'">
                <a
                  class="nav-link link-colorlesstable-row-actions"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="true"
                >
                  <span class="glyphicon glyphicon-option-vertical"></span>
                </a>

                <ul class="dropdown-menu dropdown-menu-right">
                  <li>
                    <a class="dropdown-item link" [routerLink]="item | apply: _getItemLink">
                      View/Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item link"
                      *ngIf="item | apply: canToggleUserActivationStatus"
                      (click)="toggleUserActivationStatus(item)"
                    >
                      <!-- {{item.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}} -->
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item link"
                      *ngIf="userService.getUser().id !== item.item_id"
                      (click)="onClickDeleteItem(item)"
                    >
                      Trash
                    </a>
                  </li>
                </ul>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <p *ngIf="!itemsList">
        No items to display.
      </p>
    </ng-container>
  `,
})
export class PmeListComponent implements OnInit, OnDestroy {
  config = config;
  readonly userRole = UserRole;
  SearchModes = SearchModes;
  customerList: AppSelectOptionData[] = [];
  productList: AppSelectOptionData[] = [];
  regionList: AppSelectOptionData[] = [];
  salesManagerList: AppSelectOptionData[] = [];
  salesRepresentativeList: AppSelectOptionData[] = [];
  cdList: AppSelectOptionData[] = [];
  gmmList: AppSelectOptionData[] = [];

  paginationForm: AppFormGroup<{ page: FormControl, page_size: FormControl, order: FormControl }>;
  searchForm: AppFormGroup<{
    searchMode: FormControl,
    status: FormControl,
    customerId: FormControl,
    productId: FormControl,
    regionId: FormControl,
  }>;

  selectedItems: IPriceRecord[] = [];
  allItems: IPriceRecord[] = [];

  options: {
    columns: {
      name: string;
      alias?: string;
      style?: string;
    }[];
  };

  searchModeOptions = AppSelectOptionData.fromList(
    [
      SearchModes.STATUS,
      SearchModes.SALES_REP,
      SearchModes.SALES_MANAGER,
      SearchModes.CD,
      SearchModes.GMM,
      SearchModes.CUSTOMER,
      SearchModes.PRODUCT_NAME,
      SearchModes.REGION,
      SearchModes.SALES_DISTRICT,
      SearchModes.UOM,
    ],
    [
      'Status',
      'Sales Rep',
      'Sales Manager',
      'CD',
      'GMM',
      'Customer',
      'Product Name',
      'Region',
      'Sales District',
      'Uom',
    ],
  );

  statusOptions = AppSelectOptionData.fromList(
    [IPriceRecord.Status.INSERT_REQUESTED_SELLING_PRICE, IPriceRecord.Status.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD, IPriceRecord.Status.REVIEW_REQUESTED_SELLING_PRICE_SM, IPriceRecord.Status.VALIDATED_PRICE],
    [config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE, config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD, config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_SM, config.pmeitem.status.labels.VALIDATED_PRICE],
  );

  readonly _itemsLoader: ReactiveLoader<IBackendList<IPriceRecord>, void>;
  readonly _customerLoader: ReactiveLoader<IBackendList<ICustomer>, void>;
  readonly _productLoader: ReactiveLoader<IBackendList<IProduct>, void>;
  readonly _regionLoader: ReactiveLoader<IBackendList<IRegion>, void>;
  readonly _salesManagerLoader: ReactiveLoader<IBackendList<ISalesManager>, void>;
  readonly _salesRepresentativeLoader: ReactiveLoader<IBackendList<ISalesRepresentative>, void>;
  readonly _cdsLoader: ReactiveLoader<IBackendList<ICd>, void>;
  readonly _gmmsLoader: ReactiveLoader<IBackendList<IGmm>, void>;

  itemsList: IBackendList<IPriceRecord>;

  private _subscriptions: Subscription[] = [];

  constructor(
    public pmeService: PmeService,
    public userService: UserService,
    public customerService: CustomerService,
    public productService: ProductService,
    public regionService: RegionService,
    public salesPersonService: SalesPersonService,
  ) {
    this._itemsLoader = new ReactiveLoader(() => {
      return pmeService.list(this._prepareRequestParams());
    });

    this._itemsLoader.subscribe(this.onLoaded.bind(this));

    this._customerLoader = new ReactiveLoader(() => {
      return this.customerService.list(this._prepareRequestParams());
    });
    this._customerLoader.subscribe((customerList: IBackendList<ICustomer>) => {
      this.updateCustomerList(customerList);
    });

    this._productLoader = new ReactiveLoader(() => {
      return this.productService.list(this._prepareRequestParams());
    });
    this._productLoader.subscribe((productList: IBackendList<IProduct>) => {
      this.updateProductList(productList);
    });

    this._regionLoader = new ReactiveLoader(() => {
      return this.regionService.list(this._prepareRequestParams());
    });
    this._regionLoader.subscribe((regionList: IBackendList<IRegion>) => {
      this.updateRegionList(regionList);
    });

    this._salesManagerLoader = new ReactiveLoader(() => {
      return this.salesPersonService.getSalesManagerlist(this._prepareRequestParams());
    });
    this._salesManagerLoader.subscribe((salesManagerList: IBackendList<ISalesManager>) => {
      this.updateSalesManagerList(salesManagerList);
    });

    this._cdsLoader = new ReactiveLoader(() => {
      return this.salesPersonService.getCDlist(this._prepareRequestParams());
    });
    this._cdsLoader.subscribe((cdList: IBackendList<ICd>) => {
      this.updateCDList(cdList);
    });

    this._gmmsLoader = new ReactiveLoader(() => {
      return this.salesPersonService.getGMMlist(this._prepareRequestParams());
    });
    this._gmmsLoader.subscribe((gmmList: IBackendList<IGmm>) => {
      this.updateGmmList(gmmList);
    });

    this.options = {
      columns: this._getColumns(),
    };

    this._initForms();
  }

  updateCustomerList(customerList: IBackendList<ICustomer>) {
    this.customerList = customerList.data.map((customer: ICustomer) => {
      return {
        id: customer.id,
        text: customer.name,
      };
    });
  }

  updateProductList(productList: IBackendList<IProduct>) {
    this.productList = productList.data.map((product: IProduct) => {
      return {
        id: product.id,
        text: product.name,
      };
    });
  }

  updateRegionList(regionList: IBackendList<IRegion>) {
    this.regionList = regionList.data.map((region: IRegion) => {
      return {
        id: region.id,
        text: region.name,
      };
    });
  }

  updateSalesManagerList(salesManagersList: IBackendList<ISalesManager>) {
    this.salesManagerList = salesManagersList.data.map((salesManager: ISalesManager) => {
      return {
        id: salesManager.id,
        text: salesManager.name,
      };
    });
  }

  updateCDList(cdList: IBackendList<ICd>) {
    this.cdList = cdList.data.map((cd: ICd) => {
      return {
        id: cd.id,
        text: cd.name,
      };
    });
  }

  updateGmmList(gmmList: IBackendList<IGmm>) {
    this.gmmList = gmmList.data.map((gmm: IGmm) => {
      return {
        id: gmm.id,
        text: gmm.name,
      };
    });
  }

  ngOnInit(): void {
    this._itemsLoader.load();
    this._customerLoader.load();
    this._productLoader.load();
    this._regionLoader.load();
    this._salesManagerLoader.load();
    this._cdsLoader.load();
    this._gmmsLoader.load();
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(_ => _.unsubscribe());
  }

  onSearchModeChange(): void {
    // const controls = this.searchForm.controls;
    // controls['customer'].reset('');
    // controls['status'].reset('');
  }

  onBulkActionComplete(successItems: IPriceRecord[]): void {
    if (successItems.length) {
      this._itemsLoader.load();
    }
  }

  onLoaded(priceRecords: IBackendList<IPriceRecord>) {
    this.itemsList = priceRecords;

    this.allItems = priceRecords.data;

    this.selectedItems = this.selectedItems
      .reduce((acc, _) => {
        const pmeItem = priceRecords.data.find(pmeItem => _.item_id === pmeItem.item_id);
        if (pmeItem) {
          acc.push(pmeItem);
        }
        return acc;
      }, []);
  }

  onDeleted() {
    this.paginationForm.patchValue({ page: 1 });
    this._itemsLoader.load();
  }

  canToggleUserActivationStatus = (item: IPriceRecord): boolean => {
    return this.userService.getUser().id !== item.item_id;
  };

  toggleUserActivationStatus(item: IPriceRecord): void {
    const observable = (item.gi_status === IPriceRecord.Status.INSERT_REQUESTED_SELLING_PRICE)
      ? this.pmeService.deactivateUser(item)
      : this.pmeService.activateUser(item);

    observable.subscribe(() => {
      this._itemsLoader.load();
    });
  }

  onClickDeleteItem(item: IPriceRecord) {
    this.selectedItems = [item];
  }

  changeSelection(item: IPriceRecord, checked: boolean): void {
    let i = this.getSelectedItemIndex(item);
    if (checked) {
      i > -1 || this.selectedItems.push(item);
    } else {
      i > -1 && this.selectedItems.splice(i, 1);
    }
    this.selectedItems = [...this.selectedItems];
  }

  getSelectedItemIndex(currentItem: IPriceRecord): number {
    return this.selectedItems.findIndex(item => item.item_id === currentItem.item_id);
  }

  onStatusFilter(status: IPriceRecord.Status): void {
    if (status) {
      this.searchForm.controls['status'].setValue(status);
      this._itemsLoader.load();
    }
  }

  onRecordFilter(searchMode: IPriceRecord.SearchModes): void {
    switch (searchMode) {
      case IPriceRecord.SearchModes.ALL_RECORDS:
        this.searchForm.reset();
        break;
    }

    this._itemsLoader.load();
  }

  _getItemLink = (item: IPriceRecord): string[] => {
    return [item.item_id];
  };

  _getItemTypeClass(item: IPriceRecord): { [key: string]: boolean } {
    return {
      'label': true,
      'text-capitalize': false,
      'label-default': item.recordType === IPriceRecord.RecordType.DVP,
      'label-info': item.productType === IPriceRecord.ProductType.VBM,
      'label-success': item.recordType === IPriceRecord.RecordType.QUOTE,
    };
  }

  _getItemStatusClass(item: IPriceRecord): { [key: string]: boolean } {
    return {
      'label': true,
      'text-capitalize': true,
      'label-success': item.gi_status === IPriceRecord.Status.VALIDATED_PRICE,
      'label-info': item.gi_status === IPriceRecord.Status.INSERT_REQUESTED_SELLING_PRICE,
      'label-danger': item.gi_status === IPriceRecord.Status.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD,
      'label-warning': item.gi_status === IPriceRecord.Status.REVIEW_REQUESTED_SELLING_PRICE_SM,
    };
  }

  _getItemPriorityClass(item: IPriceRecord): { [key: string]: boolean } {
    return {
      'label': true,
      'text-capitalize': true,
      'label-danger': item.priority_of_review === IPriceRecord.Priority.P1,
      'label-default': item.priority_of_review === IPriceRecord.Priority.P2,
      'label-success': item.priority_of_review === IPriceRecord.Priority.P3,
      'label-warning': item.priority_of_review === IPriceRecord.Priority.AUTO_EXTENDED,
    };
  }

  _getItemProductType(item: IPriceRecord, config, pmeService: PmeService): string {
    return config.pmeitem.productType.labels[item.productType];
  }

  _getItemRecordType(item: IPriceRecord, config, pmeService: PmeService): string {
    return config.pmeitem.recordType.labels[item.recordType];
  }

  _getPriorityStatus(item: IPriceRecord, config, pmeService: PmeService): string {
    return config.pmeitem.priority.labels[item.priority_of_review];
  }

  _getItemStatus(item: IPriceRecord, config, pmeService: PmeService): string {
    return config.pmeitem.status.labels[item.gi_status];
  }

  _getColumnStyle(alias: string): string {
    const column = this.options.columns.find(_ => _.alias === alias);
    return column ? column.style : '';
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  _userHasSelectionAccess(user: IUser , item: IPriceRecord) {
    if (user.role === UserRole.SALES_REP) {
      return item.gi_status !== IPriceRecord.Status.INSERT_REQUESTED_SELLING_PRICE && item.gi_status !== IPriceRecord.Status.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD;
    } else if (user.role === UserRole.GPO_ANALYST) {
      return item.priority_of_review !== IPriceRecord.Priority.AUTO_EXTENDED;
    }
  }

  private _initForms(): void {
    this.paginationForm = new AppFormGroup({
      page: new FormControl(1),
      page_size: new FormControl(config.defaultPageSize),
      order: new FormControl('-created'),
    });

    const searchForm = new AppFormGroup({
      searchMode: new FormControl(''),
      status: new FormControl(''),
      customerId: new FormControl(''),
      productId: new FormControl(''),
      regionId: new FormControl(''),
      salesManagerId: new FormControl(''),
      cdId: new FormControl(''),
      gmmId: new FormControl(''),
    });

    this._subscriptions = [];

    this.searchForm = searchForm;
    this.onSearchModeChange();

    this._subscriptions.push(
      Observable.merge(
        this.paginationForm.valueChanges,
        this.searchForm.valueChanges,
      )
        .debounceTime(100)
        .subscribe(() => {
          if (this.searchForm.valid) {
            this._itemsLoader.load();
          }
        }),
    );
  }

  private _getColumns() {
    return [
      { name: 'Item Id', alias: 'id' },
      { name: 'Product Type', alias: 'productType', style: 'max-width: 150px' },
      { name: 'Record Type', alias: 'recordType', style: 'max-width: 150px' },
      { name: 'Priority', alias: 'priority', style: 'max-width: 150px' },
      { name: 'Status', alias: 'status', style: 'max-width: 150px' },
      { name: 'Sales Rep', alias: 'salesRepresentative', style: 'max-width: 300px' },
      { name: 'Sales Manager', alias: 'salesManager' },
      { name: 'CD', alias: 'cd' },
      { name: 'GMM', alias: 'gmm' },
      { name: 'Customer', alias: 'customer' },
      { name: 'Product Name', alias: 'product' },
      { name: 'Material Code', alias: 'material' },
      { name: 'Region', alias: 'region' },
      { name: 'Sales District', alias: 'salesDistrict' },
      { name: 'Uom', alias: 'uom' },
    ];
  }

  private _prepareRequestParams(): IPmeSearchParams {
    const pagination = this.paginationForm.controls;
    const search = this.searchForm.controls;

    const params = {
      page: pagination['page'].value,
      page_size: pagination['page_size'].value,
      order: pagination['order'].value,
    };

    if (search['status'].value) {
      params['status'] = search['status'].value;
    }
    if (search['customerId'].value) {
      params['customerId'] = search['customerId'].value;
    }
    if (search['productId'].value) {
      params['productId'] = search['productId'].value;
    }
    if (search['regionId'].value) {
      params['regionId'] = search['regionId'].value;
    }
    if (search['salesManagerId'].value) {
      params['salesManagerId'] = search['salesManagerId'].value;
    }
    if (search['cdId'].value) {
      params['cdId'] = search['cdId'].value;
    }
    if (search['gmmId'].value) {
      params['gmmId'] = search['gmmId'].value;
    }
    if (search['searchMode'].value) {
      params['searchMode'] = search['searchMode'].value;
    }

    return params;
  }
}

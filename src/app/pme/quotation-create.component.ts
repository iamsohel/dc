import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import * as moment from 'moment';
import { from } from 'rxjs/observable/from';
import { timer } from 'rxjs/observable/timer';
import { bufferCount, concatMap, mapTo, scan } from 'rxjs/operators';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IBackendList } from '../core/interfaces/common.interface';
import { CurrencyService } from '../core/services/currency.service';
import { CustomerService } from '../core/services/customer.service';
import { MaterialService } from '../core/services/material.service';
import { SalesDistrictService } from '../core/services/sales-district.service';
import { SalesOrganizationService } from '../core/services/sales-organization.service';
import { UomService } from '../core/services/uom.service';
import { ActivityObserver } from '../utils/activity-observer';
import { ReactiveLoader } from '../utils/reactive-loader';

import { PmeService } from './pme-management.service';
import { ICurrency, ICustomer, IMaterail, ISalesDistrict, ISalesOrganization, IUom } from './pme.interfaces';

enum Uoms {
  KG = 'KG',
}

enum Currencies {
  USD = 'USD',
  INR = 'INR',
  CNY = 'CNY',
}

enum Regions {
  NORTH_AMERICA = 'NORTH_AMERICA',
  EAME = 'EAME',
  NORTH_ASIA = 'NORTH_ASIA',
  CHINA = 'CHINA',
  SOUTH_AMERICA = 'SOUTH_AMERICA',
  TURKEY = 'TURKEY',
  SOUTH_ASIA = 'SOUTH_ASIA',
  PAKISTAN = 'PAKISTAN',
}

@Component({
  selector: 'album-create',
  template: ` <div class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 col-xl-6 col-xl-offset-3">
    <h3 class="text-center">Create Single Quotation</h3>
    <app-spinner [visibility]="_customerLoader.active | async" [height]="40"></app-spinner>
    <div class="quote_alert" role="alert">
      <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true" style="color:brown"></span>
      Please submit the following information for quotation.A new price record will be generated for the selected
      customer product combination.
    </div>
    <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit()">

      <app-select
        [label]="'Regions'"
        [options]="regionOptions"
        (valueChange)="onRegionSelect($event)"
        [control]="form.controls['region']"
      ></app-select>
      <app-datalist
        [label]="'Customer Code'"
        [datalistId]="'customerList'"
        [options]="customerList"
        (valueChange)="onCustomerSelect($event);"
        [control]="form.controls['customer_code']"
      ></app-datalist>
      <!-- <app-select
        [label]="'Customer Code'"
        [options]="customerList"
        (valueChange)="onCustomerSelect($event)"
        [control]="form.controls['customer_code']"
      ></app-select> -->
      <app-spinner [visibility]="_materailLoader.active | async" [height]="40"></app-spinner>
      <app-datalist
        [label]="'Material Code'"
        [datalistId]="'materailList'"
        [options]="materailList"
        [control]="form.controls['material_code']"
      ></app-datalist>
      <app-input [label]="'Sales Organization'" [control]="form.controls['sales_organization']"> </app-input>
      <app-input [label]="'Sales District'" [control]="form.controls['sales_district']"> </app-input>
      <app-select [label]="'UoM'" [options]="uomOptions" [control]="form.controls['uom']"></app-select>
      <app-select [label]="'Currency'" [options]="currencyOptions" [control]="form.controls['currency']"></app-select>
      <app-datepicker
        [label]="'Price Validity Start Date'"
        [iconAfter]="'glyphicon-calendar'"
        [control]="form.controls['price_validity_start_date']"
      ></app-datepicker>
      <app-input [label]="'Committed Volumn(in KG)'" [control]="form.controls['commited_volume']"> </app-input>
      <button
        type="submit"
        [disabled]="!form.valid || (_savingObserver.active | async)"
        class="btn btn-success pull-right"
      >
        Create
      </button>
      <button class="btn btn-primary pull-right mr-6" (click)="onCancel()">Cancel</button>
    </form>
  </div>`,
  styleUrls: ['./pme.scss'],
})
export class QuotationCreateComponent implements OnInit {
  form: FormGroup;
  config = config;
  customerMasterList: ICustomer[] = [];
  customerList: AppSelectOptionData[] = [];
  materailList: AppSelectOptionData[] = [];
  salesDistricts: AppSelectOptionData[] = [];
  regionOptions = AppSelectOptionData.fromList(
    [
      'North America',
      'Eame',
      'North Asia',
      'China',
      'South America',
      'Turkey',
      'South Asia',
      'Pakistan',
    ],
    [
      'North America',
      'Eame',
      'North Asia',
      'China',
      'South America',
      'Turkey',
      'South Asia',
      'Pakistan',
    ],
  );
  uomOptions = AppSelectOptionData.fromList([Uoms.KG], ['KG']);

  currencyOptions = AppSelectOptionData.fromList(
    [Currencies.USD, Currencies.INR, Currencies.CNY],
    ['USD', 'INR', 'CNY'],
  );

  readonly labelModeOptions: AppSelectOptionData[] = AppSelectOptionData.fromList(
    config.album.labelMode.list,
    config.album.labelMode.labels,
  );
  readonly _savingObserver = new ActivityObserver();

  readonly _customerLoader: ReactiveLoader<IBackendList<ICustomer>, void>;
  readonly _materailLoader: ReactiveLoader<IBackendList<IMaterail>, void>;
  readonly _salesDistrictsLoader: ReactiveLoader<IBackendList<ISalesDistrict>, void>;
  readonly _salesOrganizationsLoader: ReactiveLoader<IBackendList<ISalesOrganization>, void>;
  readonly _uomLoader: ReactiveLoader<IBackendList<IUom>, void>;
  readonly _currencyLoader: ReactiveLoader<IBackendList<ICurrency>, void>;

  constructor(
    private router: Router,
    private pme: PmeService,
    public customerService: CustomerService,
    public materialService: MaterialService,
    public salesDistrictService: SalesDistrictService,
    public salesOrganizationService: SalesOrganizationService,
    public uomService: UomService,
    public currencyService: CurrencyService,
  ) {
    const numRegex = /^-?\d*[.,]?\d{0,2}$/;
    this.form = new FormGroup({
      region: new FormControl('', Validators.required),
      customer_code: new FormControl('', Validators.required),
      material_code: new FormControl('', Validators.required),
      sales_district: new FormControl('', Validators.required),
      sales_organization: new FormControl('', Validators.required),
      uom: new FormControl('', Validators.required),
      currency: new FormControl('', Validators.required),
      price_validity_start_date: new FormControl('', Validators.required),
      commited_volume: new FormControl('', [Validators.required, Validators.pattern(numRegex)]),
      file_name: new FormControl('file.csv'),
      quote_type: new FormControl('single'),
      //labelMode: new FormControl(IAlbum.LabelMode.CLASSIFICATION, Validators.required),
    });

    // customers list
    this._customerLoader = new ReactiveLoader(() => {
      return this.customerService.list(this._prepareRequestParamsCustMaster());
    });
    this._customerLoader.subscribe((customerList: IBackendList<ICustomer>) => {
      this.updateCustomerList(customerList);
    });

    // materail list
    this._materailLoader = new ReactiveLoader(() => {
      return this.materialService.list(this._prepareRequestParams());
    });
    this._materailLoader.subscribe((materailList: IBackendList<IMaterail>) => {
        this.updateMaterailList(materailList);
    });
  }

  ngOnInit(): void {
    //this._customerLoader.load();
  }

  updateCustomerList(customerList: IBackendList<ICustomer>) {
    this.customerMasterList = customerList.results;
    this.customerList = customerList.results.map((customer: ICustomer) => {
      return {
        id: customer.customer_code,
        text: customer.customer_name,
      };
    });
    // let lcustomerList = customerList.results.map((customer: ICustomer) => {
    //   return {
    //     id: customer.customer_code,
    //     text: customer.customer_name,
    //   };
    // });

    // from(lcustomerList)
    //       .pipe(
    //         bufferCount(10),
    //         concatMap((item) => timer(0).pipe(mapTo(item))),
    //         scan((acc, curr) => acc.concat(curr), []),
    //       )
    //       .subscribe((result) => {
    //         this.customerList = result;
    //       });
  }

  updateMaterailList(materailList: IBackendList<IMaterail>) {

    this.materailList = materailList.results.map((materail: IMaterail) => {
      return {
        id: materail.material_code,
        text: materail.material_name,
      };
    });

    // let lmaterailList = materailList.results.map((materail: IMaterail) => {
    //   return {
    //     id: materail.material_code,
    //     text: materail.material_name,
    //   };
    // });

    // from(lmaterailList)
    //       .pipe(
    //         bufferCount(400),
    //         concatMap((item) => timer(0).pipe(mapTo(item))),
    //         scan((acc, curr) => acc.concat(curr), []),
    //       )
    //       .subscribe((result) => {
    //         this.materailList = result;
    //       });
  }

  updateSalesDistrictList(salesDistrictList: IBackendList<ISalesDistrict>) {
    this.salesDistricts = salesDistrictList.results.map((salesDistrict: ISalesDistrict) => {
      return {
        id: salesDistrict.id,
        text: salesDistrict.name,
      };
    });
  }

  onSubmit() {
    let priceValidityStartDate = moment(this.form['price_validity_start_date']).format('DD-MM-YYYY');
    this.form.controls['price_validity_start_date'].setValue(priceValidityStartDate);

    this._savingObserver.observe(this.pme.createQuotation([this.form.value])).subscribe((data: any) => {
      data.code !== 199 && this.router.navigate(['/desk', 'pme', 'manage', 'quotation', 'list']);
    });
  }

  onCancel() {
    this.router.navigate(['/desk', 'pme', 'manage', 'quotation', 'list']);
  }

  protected onRegionSelect(saleOrg: string) {
    // let selectedCustomer = this.customerMasterList.find((c) => c.customer_code === custCode);
    // this.form.controls['sales_district'].setValue(selectedCustomer.sales_district);
    //this.form.controls['sales_organization'].setValue(selectedCustomer.sales_organization);
    // this._materailLoader.load();
    this._customerLoader.load();
  }

  protected onCustomerSelect(custCode: string) {
    let selectedCustomer = this.customerMasterList.find((c) => c.customer_code === custCode);
    this.form.controls['sales_district'].setValue(selectedCustomer.sales_district);
    this.form.controls['sales_organization'].setValue(selectedCustomer.sales_organization);
    this._materailLoader.load();
  }

  private _prepareRequestParamsCustMaster(): any {
    let params = {
      region: '',
    };
    this.form.controls['region'].value &&
      (params.region = this.form.controls['region'].value);
    return params;
  }

  private _prepareRequestParams(): any {
    let params = {
      salesOrg: '',
    };
    this.form.controls['sales_organization'].value &&
      (params.salesOrg = this.form.controls['sales_organization'].value);
    return params;
  }
}

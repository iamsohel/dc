import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { from } from 'rxjs/observable/from';
import { timer } from 'rxjs/observable/timer';
import { bufferCount, concatMap, mapTo, scan } from 'rxjs/operators';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IBackendList } from '../core/interfaces/common.interface';
import { CurrencyService } from '../core/services/currency.service';
import { CustomerService } from '../core/services/customer.service';
import { SalesDistrictService } from '../core/services/sales-district.service';
import { SalesOrganizationService } from '../core/services/sales-organization.service';
import { UomService } from '../core/services/uom.service';
import { ActivityObserver } from '../utils/activity-observer';
import { ReactiveLoader } from '../utils/reactive-loader';

import { PmeService } from './pme-management.service';
import {
  ICurrency,
  ICustomer,
  ISalesDistrict,
  ISalesOrganization,
  IUom,
} from './pme.interfaces';

enum Uoms {
  KG = 'KG',
}

enum Currencies {
  USD = 'USD',
  INR = 'INR',
  CNY = 'CNY',
}

@Component({
  selector: 'album-create',
  template: ` <div class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 col-xl-6 col-xl-offset-3">
    <h3 class="text-center">Generate Distributor Quote</h3>
    <div class="quote_alert" role="alert">
      <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true" style="color:brown"></span>
      Please fill in data to generate list of quotes. For new customer-materail combination,the price will be calculated
      according to the same logic as for the generating single/ batch quote. If the customer-materail combination exists
      then it will look up the DVP model output price.
    </div>
    <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit()">
      <app-spinner [visibility]="_customerLoader.active | async" [height]="40"></app-spinner>
      <app-datalist
        [label]="'Customer Code'"
        [datalistId]="'customerList'"
        [options]="customerList"
        (valueChange)="onCustomerSelect($event);"
        [control]="form.controls['customer_code']"
      ></app-datalist>
      <app-input [label]="'Sales District'" [control]="form.controls['sales_district']"> </app-input>
      <app-input [label]="'Sales Organization'" [control]="form.controls['sales_organization']"> </app-input>
      <app-select [label]="'UoM'" [options]="uomOptions" [control]="form.controls['uom']"></app-select>
      <app-select [label]="'Currency'" [options]="currencyOptions" [control]="form.controls['currency']"></app-select>

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
export class QuotationDistributorCreateComponent implements OnInit {
  form: FormGroup;
  config = config;

  customerList: AppSelectOptionData[] = [];
  customerMasterList: ICustomer[] = [];
  materailList: AppSelectOptionData[] = [];
  salesDistricts: AppSelectOptionData[] = [];
  salesOrganizations: AppSelectOptionData[] = [];

  uomOptions = AppSelectOptionData.fromList([Uoms.KG], ['KG']);

  currencyOptions = AppSelectOptionData.fromList([Currencies.USD, Currencies.INR, Currencies.CNY], ['USD', 'INR', 'CNY']);

  readonly labelModeOptions: AppSelectOptionData[] = AppSelectOptionData.fromList(
    config.album.labelMode.list,
    config.album.labelMode.labels,
  );
  readonly _savingObserver = new ActivityObserver();

  readonly _customerLoader: ReactiveLoader<IBackendList<ICustomer>, void>;
  readonly _salesDistrictsLoader: ReactiveLoader<IBackendList<ISalesDistrict>, void>;
  readonly _salesOrganizationsLoader: ReactiveLoader<IBackendList<ISalesOrganization>, void>;
  readonly _uomLoader: ReactiveLoader<IBackendList<IUom>, void>;
  readonly _currencyLoader: ReactiveLoader<IBackendList<ICurrency>, void>;

  constructor(
    private router: Router,
    private pme: PmeService,
    public customerService: CustomerService,
    public salesDistrictService: SalesDistrictService,
    public salesOrganizationService: SalesOrganizationService,
    public uomService: UomService,
    public currencyService: CurrencyService,
  ) {
    this.form = new FormGroup({
      customer_code: new FormControl('', Validators.required),
      sales_district: new FormControl(''),
      sales_organization: new FormControl(''),
      uom: new FormControl(''),
      currency: new FormControl(''),
    });

    // customers list
    this._customerLoader = new ReactiveLoader(() => {
      return this.customerService.list();
    });
    this._customerLoader.subscribe((customerList: IBackendList<ICustomer>) => {
      this.updateCustomerList(customerList);
    });

  }

  ngOnInit(): void {
    this._customerLoader.load();
  }

  updateCustomerList(customerList: IBackendList<ICustomer>) {
    this.customerMasterList = customerList.results;
    this.customerList = customerList.results.map((customer: ICustomer) => {
      return {
        id: customer.customer_code,
        text: customer.customer_name,
      };
    });

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


  onSubmit() {
    this._savingObserver
      .observe(this.pme.distributedQuotation(this.form.value))
      .subscribe(() => {
        this.router.navigate(['/desk', 'pme', 'manage', 'quotation', 'list']);
      });
  }

  onCancel() {
    this.router.navigate(['/desk', 'pme', 'manage', 'quotation', 'list']);
  }

  protected onCustomerSelect(custCode: string) {
    //let custCode = event.target.value;
    let selectedCustomer = this.customerMasterList.find(c => c.customer_code === custCode);
    this.form.controls['sales_district'].setValue(selectedCustomer.sales_district);
    this.form.controls['sales_organization'].setValue(selectedCustomer.sales_organization);

  }
}

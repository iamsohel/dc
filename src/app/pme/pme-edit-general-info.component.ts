import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-edit-general-info',
  template: `
    <form [formGroup]="generalInfoForm">
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input [label]="'Status'" [control]="generalInfoForm.controls['gi_status']" [disabled]="true"></app-input>

          <app-input
            [label]="'Sales manager'"
            [control]="generalInfoForm.controls['gi_sales_manager_name']"
            [disabled]="true"
          ></app-input>

          <app-input [label]="'Group Marketing Manager'" [control]="generalInfoForm.controls['gi_gmm_name']" [disabled]="true"></app-input>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
          <app-input [label]="'Item Id'" [control]="generalInfoForm.controls['item_id']" [disabled]="true"></app-input>

          <app-input
            [label]="'Sales rep Name'"
            [control]="generalInfoForm.controls['gi_sales_rep_name']"
            [disabled]="true"
          ></app-input>

          <app-input [label]="'Commerical Director'" [control]="generalInfoForm.controls['gi_commercial_director_name']" [disabled]="true"></app-input>
        </div>
      </div>
      <hr />
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input
            [label]="'Customer name'"
            [control]="generalInfoForm.controls['customer_name']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Material name'"
            [control]="generalInfoForm.controls['gi_material_name']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Portfolio Strategy'"
            [control]="generalInfoForm.controls['gi_portfolio_strategy']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Sales District'"
            [control]="generalInfoForm.controls['gi_sales_district']"
            [disabled]="true"
          ></app-input>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
          <app-input
            [label]="'Customer code'"
            [control]="generalInfoForm.controls['gi_customer_code']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Material code'"
            [control]="generalInfoForm.controls['gi_material_code']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Product name'"
            [control]="generalInfoForm.controls['gi_product_name']"
            [disabled]="true"
          ></app-input>

          <app-input [label]="'Region'" [control]="generalInfoForm.controls['gi_region']" [disabled]="true"></app-input>
        </div>
      </div>
      <hr />
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input
            [label]="'DVP model price (USD)'"
            [value]="pmeData.dvp_model_price ? pmeData.dvp_model_price.toFixed(2) : null"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'DVP model price in invoice currency'"
            [value]="pmeData.gi_dvp_model_price_in_invoice_currency ? pmeData.gi_dvp_model_price_in_invoice_currency.toFixed(2) : null"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Last invoice price (USD)'"
            [value]="pmeData.last_invoice_price ? pmeData.last_invoice_price.toFixed(2) : null"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Last invoice price currency'"
            [control]="generalInfoForm.controls['gi_last_validated_price_currency']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Last validated price currency'"
            [control]="generalInfoForm.controls['gi_last_validated_price_currency']"
            [disabled]="true"
          ></app-input>

          <app-datepicker
            [label]="'Current SAP price valid-to date'"
            [value]="pmeData.current_sap_price_validity_date"
            [iconAfter]="'glyphicon-calendar'"
            [control]="generalInfoForm.controls['current_sap_price_validity_date']"
            [disabled]="true"
          ></app-datepicker>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
          <app-input
            [label]="'Exworks DVP price (USD)'"
            [value]="pmeData.gi_exworks_dvp_price ? pmeData.gi_exworks_dvp_price.toFixed(2) : null"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Invoice currency'"
            [control]="generalInfoForm.controls['invoice_currency']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'VBP price'"
            [value]="pmeData.gi_vbp_price ? pmeData.gi_vbp_price.toFixed(2) : null"
            [disabled]="true"
          ></app-input>

          <app-datepicker
            [label]="'Last invoice price date'"
            [value]="pmeData.gi_last_invoice_price_date"
            [iconAfter]="'glyphicon-calendar'"
            [control]="generalInfoForm.controls['gi_last_invoice_price_date']"
            [disabled]="true"
          ></app-datepicker>

          <app-input
            [label]="'Last invoice price in local currency'"
            [value]="pmeData.gi_last_invoice_price_in_local_currency ? pmeData.gi_last_invoice_price_in_local_currency.toFixed(2) : null"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Last validated price (Currecnt SAP price)'"
            [value]="pmeData.last_validated_price ? pmeData.last_validated_price.toFixed(2) : null"
            [disabled]="true"
          ></app-input>
        </div>
      </div>
    </form>
  `,
})
export class PmeEditGeneralInfoComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormGroup;
  @Input() pmeData: IPriceRecord;
  generalInfoForm: FormGroup;

  constructor() {}

  ngOnInit(): void {
    this._initForm();
    this.formGroup.addControl('generalInfo', this.generalInfoForm);
  }

  ngOnDestroy(): void {}

  private _initForm(): void {
    this.generalInfoForm = new FormGroup({
      item_id: new FormControl(this.pmeData.item_id, Validators.required),
      gi_status: new FormControl(this.pmeData.gi_status, Validators.required),
      gi_sales_rep_name: new FormControl(this.pmeData.gi_sales_rep_name),
      gi_sales_manager_name: new FormControl(this.pmeData.gi_sales_manager_name),
      gi_commercial_director_name: new FormControl(this.pmeData.gi_commercial_director_name),
      gi_gmm_name: new FormControl(this.pmeData.gi_gmm_name),
      gi_customer_code: new FormControl(this.pmeData.gi_customer_code),
      customer_name: new FormControl(this.pmeData.customer_name),
      gi_material_code: new FormControl(this.pmeData.gi_material_code),
      gi_material_name: new FormControl(this.pmeData.gi_material_name),
      gi_product_name: new FormControl(this.pmeData.gi_product_name),
      gi_portfolio_strategy: new FormControl(this.pmeData.gi_portfolio_strategy),
      gi_region: new FormControl(this.pmeData.gi_region),
      gi_sales_district: new FormControl(this.pmeData.gi_sales_district),
      gi_exworks_dvp_price: new FormControl(this.pmeData.gi_exworks_dvp_price),
      dvp_model_price: new FormControl(this.pmeData.dvp_model_price),
      invoice_currency: new FormControl(this.pmeData.invoice_currency),
      gi_dvp_model_price_in_invoice_currency: new FormControl(this.pmeData.gi_dvp_model_price_in_invoice_currency),
      gi_vbp_price: new FormControl(this.pmeData.gi_vbp_price),
      last_invoice_price: new FormControl(this.pmeData.last_invoice_price), // need to talk
      gi_last_validated_price_currency: new FormControl(this.pmeData.gi_last_validated_price_currency),
      gi_last_invoice_price_date: new FormControl(this.pmeData.gi_last_invoice_price_date),
      gi_last_invoice_price_in_local_currency: new FormControl(this.pmeData.gi_last_invoice_price_in_local_currency),
      last_validated_price: new FormControl(this.pmeData.last_validated_price), // missing
      current_sap_price_validity_date: new FormControl(this.pmeData.current_sap_price_validity_date),
    });
  }
}

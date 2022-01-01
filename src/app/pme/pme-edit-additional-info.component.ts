import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import config from '../config';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-edit-additional-info',
  template: `
    <form [formGroup]="additionalInfoForm">
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input
            [label]="'Sales Organization'"
            [control]="additionalInfoForm.controls['ai_sales_organization']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Duty Applied (%)'"
            [control]="additionalInfoForm.controls['ai_duty_applied']"
            [disabled]="!(user.getUser() | apply: _userHasRole: userRole.KEY_USER) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'Buffer (%)'"
            [control]="additionalInfoForm.controls['ai_buffer']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Rebate (%)'"
            [control]="additionalInfoForm.controls['ai_rebate']"
            [disabled]="!(user.getUser() | apply: _userHasRole: userRole.KEY_USER) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
          <app-input
            [label]="'Product Site'"
            [control]="additionalInfoForm.controls['ai_product_site']"
            [disabled]="true"
          ></app-input>

          <app-input
            [label]="'Freight (USD/uom)'"
            [control]="additionalInfoForm.controls['ai_freight']"
            [disabled]="!(user.getUser() | apply: _userHasRole: userRole.KEY_USER) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'Last Mile (USD/uom)'"
            [control]="additionalInfoForm.controls['ai_last_mile']"
            [disabled]="!(user.getUser() | apply: _userHasRole: userRole.KEY_USER) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'Commission (%)'"
            [control]="additionalInfoForm.controls['ai_commission']"
            [disabled]="!(user.getUser() | apply: _userHasRole: userRole.KEY_USER) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'FX Rate'"
            [value]="pmeData.ai_fx_rate ? pmeData.ai_fx_rate.toFixed(2) : null"
            [disabled]="true"
          ></app-input>
        </div>
      </div>
      <hr />
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12" *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)">
          <app-input
            [label]="'Total Product Cost'"
            [value]="pmeData.ai_total_product_cost ? pmeData.ai_total_product_cost.toFixed(2) : null"
            [disabled]="true"
          ></app-input>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12">
          <app-input [label]="'Party'" [control]="additionalInfoForm.controls['ai_party']" [disabled]="true"></app-input>
        </div>
      </div>
      <hr />
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input
            [label]="'Profit sharing'"
            [control]="additionalInfoForm.controls['ai_profit_sharing']"
            [disabled]="!(user.getUser() | apply: _userHasRole: userRole.KEY_USER) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
          <app-input
            [label]="'Freight Surcharge in Local Currency'"
            [control]="additionalInfoForm.controls['ai_freight_surcharge']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) &&
                        !(user.getUser() | apply: _userHasRole:userRole.KEY_USER)||
                        (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                        pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>
        </div>
      </div>
    </form>
  `,
})
export class PmeEditAdditionalInfoComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormGroup;
  @Input() pmeData: IPriceRecord;
  additionalInfoForm: FormGroup;
  readonly userRole = UserRole;
  config = config;
  constructor(readonly user: UserService) {}

  ngOnInit(): void {
    this._initForm();
    this.formGroup.addControl('additionalInfo', this.additionalInfoForm);
  }

  ngOnDestroy(): void {}

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  private _initForm(): void {
    const numRegex = /^-?\d*[.,]?\d{0,2}$/;

    this.additionalInfoForm = new FormGroup({
      ai_product_site: new FormControl(this.pmeData.ai_product_site),
      ai_sales_organization: new FormControl(this.pmeData.ai_sales_organization),
      ai_freight: new FormControl(this.pmeData.ai_freight ? this.pmeData.ai_freight.toFixed(2) : null, Validators.pattern(numRegex)),
      ai_duty_applied: new FormControl(this.pmeData.ai_duty_applied, Validators.pattern(numRegex)),
      ai_last_mile: new FormControl(this.pmeData.ai_last_mile, Validators.pattern(numRegex)),
      ai_buffer: new FormControl(this.pmeData.ai_buffer),
      ai_commission: new FormControl(this.pmeData.ai_commission, Validators.pattern(numRegex)),
      ai_rebate: new FormControl(this.pmeData.ai_rebate, Validators.pattern(numRegex)),
      ai_fx_rate: new FormControl(this.pmeData.ai_fx_rate),
      ai_party: new FormControl(this.pmeData.ai_party),
      ai_total_product_cost: new FormControl(this.pmeData.ai_total_product_cost),
      ai_freight_surcharge: new FormControl(this.pmeData.ai_freight_surcharge ? this.pmeData.ai_freight_surcharge.toFixed(2) : null, Validators.pattern(numRegex)),
      ai_profit_sharing: new FormControl(this.pmeData.ai_profit_sharing, Validators.pattern(numRegex)),
    });
  }
}

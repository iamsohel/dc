import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as moment from 'moment';

import config from '../config';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';
import { AppValidators } from '../utils/validators';

import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-edit-price-review',
  template: `
    <div>
      <form [formGroup]="pricereviewForm">
        <div class="row">
          <!-- Col 1 -->
          <div class="col-md-6 col-sm-12 col-md-push-6">
            <app-input [label]="'UoM'" [control]="pricereviewForm.controls['uom']" [disabled]="true"></app-input>

            <app-input
              [label]="'Last Invoice Price in Local currency'"
              [value]="
                pmeData.gi_last_invoice_price_in_local_currency
                  ? pmeData.gi_last_invoice_price_in_local_currency.toFixed(2)
                  : null
              "
              [disabled]="true"
            ></app-input>
            <app-input
              [label]="'Last validated price currency'"
              [control]="pricereviewForm.controls['gi_last_validated_price_currency']"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'Last validated price(Current SAP price)'"
              [value]="pmeData.last_validated_price ? pmeData.last_validated_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'Last Validated price NM%'"
              *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)"
              [value]="pmeData.last_validated_price_nm ? pmeData.last_validated_price_nm.toFixed(2) : null"
              (valueChange)="onLastValidatedPriceChange()"
              [disabled]="true"
            >
            </app-input>
          </div>

          <!-- Col 2 -->
          <div class="col-md-6 col-sm-12 col-md-pull-6">
            <app-input
              [label]="'Priority of Review'"
              [control]="pricereviewForm.controls['priority_of_review']"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'Invoice currency'"
              [control]="pricereviewForm.controls['invoice_currency']"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'DVP model price in invoice currency'"
              [value]="
                pmeData.gi_dvp_model_price_in_invoice_currency
                  ? pmeData.gi_dvp_model_price_in_invoice_currency.toFixed(2)
                  : null
              "
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'VBP price'"
              [value]="pmeData.gi_vbp_price ? pmeData.gi_vbp_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'Last Transaction NM%'"
              *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)"
              [value]="pmeData.last_transaction_nm ? pmeData.last_transaction_nm.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>
        </div>
        <hr />
        <div class="row" *ngIf="pmeData.productType == 'VBM'">
          <!-- Col 1 -->
          <div class="col-md-6 col-sm-12 col-md-push-6">
            <app-input
              [label]="'Voulmn Tier 1'"
              [value]="pmeData.rsp_tier_1 ? pmeData.rsp_tier_1.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'Voulmn Tier 2'"
              [value]="pmeData.rsp_tier_2 ? pmeData.rsp_tier_2.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'Voulmn Tier 3'"
              [value]="pmeData.rsp_tier_3 ? pmeData.rsp_tier_3.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>

          <!-- Col 2 -->
          <div class="col-md-6 col-sm-12 col-md-pull-6">
            <app-input
              [label]="'VBM 1 Price'"
              [value]="pmeData.vbm_1_price ? pmeData.vbm_1_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'VBM 2 Price'"
              [value]="pmeData.vbm_2_price ? pmeData.vbm_2_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'VBM 3 Price'"
              [value]="pmeData.vbm_3_price ? pmeData.vbm_3_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>
        </div>
        <hr />
        <div class="row">
          <div class="col-md-6 col-sm-12 col-md-push-6">
            <app-input
              [label]="'Requested selling price(RSP) NM%'"
              *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)"
              [value]="pmeData.requested_selling_price_nm ? pmeData.requested_selling_price_nm.toFixed(2) : null"
              [disabled]="true"
            ></app-input>

            <app-input
              [label]="'CD Threshold Price'"
              *ngIf="
                (user.getUser() | apply: _userHasRole:userRole.CD) ||
                (user.getUser() | apply: _userHasRole:userRole.GMM)
              "
              [value]="pmeData.cd_threshold_price ? pmeData.cd_threshold_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>
          <div class="col-md-6 col-sm-12 col-md-pull-6">
            <app-input
              [iconBefore]="
                !(user.getUser() | apply: _userHasRole:userRole.SALES_REP)
                  ? 'glyphicon-info-sign'
                  : 'glyphicon-asterisk'
              "
              [label]="'Requested selling price(RSP) in local currency'"
              [control]="pricereviewForm.controls['requested_selling_price']"
              [disabled]="
                !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                  pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)
              "
            >
            </app-input>

            <app-input
              [label]="'SM Threshold Price'"
              *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)"
              [value]="pmeData.sm_threshold_price ? pmeData.sm_threshold_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>
        </div>
        <hr />
        <div class="row" *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)">
          <div class="col-md-6 col-sm-12 col-md-push-6">
            <app-input
              [label]="'RSP change % vs Last Validated price'"
              [value]="pmeData.rsp_change_vs_last_validated_price ? pmeData.rsp_change_vs_last_validated_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>
          <div class="col-md-6 col-sm-12 col-md-pull-6">
            <app-input
              [label]="'RSP change % vs Last Transacted price'"
              [value]="pmeData.rsp_change_vs_last_transacted_price ? pmeData.rsp_change_vs_last_transacted_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
            <app-input
              [label]="'RSP vs Adjusted NBA price'"
              [value]="pmeData.rsp_vs_adjusted_nba_price ? pmeData.rsp_vs_adjusted_nba_price.toFixed(2) : null"
              [disabled]="true"
            ></app-input>
          </div>
        </div>
        <hr *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)" />
        <div class="row">
          <!-- Col 1 -->
          <div class="col-md-6 col-sm-12 col-md-push-6">
            <app-input
              [label]="'Last 12 month volume'"
              [control]="pricereviewForm.controls['last_twelve_months_volume']"
              [disabled]="true"
            ></app-input>

            <app-datepicker
              [label]="'Current SAP price valid date'"
              [value]="pmeData.current_sap_price_validity_date"
              [iconAfter]="'glyphicon-calendar'"
              [control]="pricereviewForm.controls['current_sap_price_validity_date']"
              [disabled]="true"
            ></app-datepicker>

            <app-datepicker
              *ngIf="pmeData.final_valid_from"
              [label]="'Final Validity From'"
              [value]="pmeData.final_valid_from"
              [iconAfter]="'glyphicon-calendar'"
              [control]="pricereviewForm.controls['final_valid_from']"
              [disabled]="true"
            ></app-datepicker>

            <app-datepicker
              *ngIf="pmeData.final_valid_to"
              [label]="'Final Validity To'"
              [value]="pmeData.final_valid_to"
              [iconAfter]="'glyphicon-calendar'"
              [control]="pricereviewForm.controls['final_valid_to']"
              [disabled]="true"
            ></app-datepicker>
          </div>

          <!-- Col 2 -->
          <div class="col-md-6 col-sm-12 col-md-pull-6">
            <app-input
              [iconBefore]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ? '' : 'glyphicon-asterisk'"
              [label]="'Annualized Volume Commitment'"
              [control]="pricereviewForm.controls['annualized_volume_commitment']"
              [disabled]="
                !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                  pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)
              "
            >
            </app-input>

            <!-- <div class="col-md-9 pl0"> -->
            <app-datepicker
              [iconBefore]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ? '' : 'glyphicon-asterisk'"
              [label]="'Price Valid from'"
              [value]="pmeData.price_valid_from"
              [iconAfter]="'glyphicon-calendar'"
              [control]="pricereviewForm.controls['price_valid_from']"
              [disabled]="
                (user.getUser() | apply: _userHasRole:userRole.SALES_MANAGER) ||
                (user.getUser() | apply: _userHasRole:userRole.CD) ||
                (user.getUser() | apply: _userHasRole:userRole.GMM) ||
                (user.getUser() | apply: _userHasRole:userRole.READER) ||
                ((user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) &&
                  pmeData.priority_of_review !== config.pmeitem.priority.labels.AUTO_EXTENDED) ||
                (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                  pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)
              "
            ></app-datepicker>
            <!-- </div> -->
            <div
              *ngIf="pricereviewForm.errors?.price_valid_from && (pricereviewForm.touched || pricereviewForm.dirty)"
              class="cross-validation-error-message alert alert-danger"
            >
              Invalid from date
            </div>
            <!--<div class="col-md-3 pr0">
                <app-check
                  [(checked)]="_isBackDated"
                  [label]="'is Back Dated'"
                ></app-check>
              </div>-->

            <app-datepicker
              [iconBefore]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ? '' : 'glyphicon-asterisk'"
              [label]="'Price Valid to'"
              [value]="pmeData.price_valid_to"
              [iconAfter]="'glyphicon-calendar'"
              [control]="pricereviewForm.controls['price_valid_to']"
              [disabled]="
                (user.getUser() | apply: _userHasRole:userRole.SALES_MANAGER) ||
                (user.getUser() | apply: _userHasRole:userRole.CD) ||
                (user.getUser() | apply: _userHasRole:userRole.GMM) ||
                (user.getUser() | apply: _userHasRole:userRole.READER) ||
                ((user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) &&
                  pmeData.priority_of_review !== config.pmeitem.priority.labels.AUTO_EXTENDED) ||
                (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                  pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)
              "
            ></app-datepicker>
            <div
              *ngIf="pricereviewForm.errors?.price_valid_to && (pricereviewForm.touched || pricereviewForm.dirty)"
              class="cross-validation-error-message alert alert-danger"
            >
              Invalid to date
            </div>
            <div
              *ngIf="pricereviewForm.errors?.fromToDate && (pricereviewForm.touched || pricereviewForm.dirty)"
              class="cross-validation-error-message alert alert-danger"
            >
              From date should be less than to date
            </div>
          </div>
        </div>
        <hr />
        <div class="row">
          <!-- Col 1 -->
          <div
            [class]="
              (user.getUser() | apply: _userHasRole:userRole.SALES_REP) ? 'col-md-6 col-sm-12' : 'col-md-12 col-sm-12'
            "
          >
            <div class="" role="alert">
              <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true" style="color:brown"></span>
              Justification for lower volume commitment from last volume sold
            </div>
            <app-input
              [label]="'Justification'"
              [control]="pricereviewForm.controls['srep_justification_for_lower_volume']"
              [disabled]="
                !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                  pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)
              "
            ></app-input>
          </div>
          <!-- Col 2 -->
          <div
            [class]="
              (user.getUser() | apply: _userHasRole:userRole.SALES_REP) ? 'col-md-6 col-sm-12' : 'col-md-12 col-sm-12'
            "
          >
            <div class="" role="alert">
              <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true" style="color:brown"></span>
              Justification for lower Requestd Selling price than DVP of current SAP price
            </div>
            <app-input
              [label]="'Justification'"
              [control]="pricereviewForm.controls['srep_justification_for_lower_rsp']"
              [disabled]="
                !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
                  pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)
              "
            ></app-input>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class PmeEditPriceReviewComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormGroup;
  @Input() pmeData: IPriceRecord;
  pricereviewForm: FormGroup;
  config = config;
  readonly userRole = UserRole;
  protected _isBackDated: boolean = false;

  constructor(
    readonly user: UserService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this._initForm();
    this.formGroup.addControl('priceReview', this.pricereviewForm);
  }

  ngOnDestroy(): void {}

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  onLastValidatedPriceChange(): void {}

  private _initForm(): void {
    const userRole = this.user.getUser().role;
    const dateFormat = 'YYYY-MM-DD';
    const currentDate = moment(Date.now()).format(dateFormat);
    const fromDate = moment(this.pmeData.price_valid_from).format(dateFormat);
    const setFormDate =
      this.pmeData.gi_status !== config.pmeitem.status.labels.VALIDATED_PRICE &&
      userRole === UserRole.SALES_REP &&
      fromDate < currentDate
        ? currentDate
        : fromDate;
    this.pmeData.final_valid_from =
      this.pmeData.final_valid_from && this.pmeData.final_valid_from.toString() === '0001-01-01T00:00:00Z'
        ? null
        : this.pmeData.final_valid_from;
    this.pmeData.final_valid_to =
      this.pmeData.final_valid_to && this.pmeData.final_valid_to.toString() === '0001-01-01T00:00:00Z'
        ? null
        : this.pmeData.final_valid_to;

    let validators = [
      AppValidators.fromToDate('price_valid_from', 'price_valid_to'),
      AppValidators.validDate('price_valid_from'),
      AppValidators.validDate('price_valid_to'),
    ];

    // const lastValidatedPriceNm: number = ((Number(this.pmeData.requested_selling_price) - Number(this.pmeData.last_validated_price)) / Number(this.pmeData.last_validated_price)) * 100;
    // const adjustedNbaPrice: number = Number(this.pmeData.requested_selling_price) / Number(this.pmeData.pdm_adjusted_nba_price_per_kg);
    const numRegex =
      /^(?!(?:^[-+]?[0.]+(?:[Ee]|$)))(?!(?:^-))(?:(?:[+-]?)(?=[0123456789.])(?:(?:(?:[0123456789]+)(?:(?:[.])(?:[0123456789]*))?|(?:(?:[.])(?:[0123456789]+))))(?:(?:[Ee])(?:(?:[+-]?)(?:[0123456789]+))|))$/;
    //const numRegex = /^[0-9]\d*(?:\.\d{1,2})?$/;

    this.pricereviewForm = this.fb.group(
      {
        // id: new FormControl(this.pmeData.item_id, Validators.required),
        priority_of_review: new FormControl(this.pmeData.priority_of_review),
        invoice_currency: new FormControl(this.pmeData.gi_last_invoice_price_currency),
        gi_dvp_model_price_in_invoice_currency: new FormControl(this.pmeData.gi_dvp_model_price_in_invoice_currency),
        gi_vbp_price: new FormControl(this.pmeData.gi_vbp_price),
        last_transaction_nm: new FormControl(this.pmeData.last_transaction_nm),
        uom: new FormControl(this.pmeData.uom),
        vbm_1_price: new FormControl(this.pmeData.vbm_1_price),
        vbm_2_price: new FormControl(this.pmeData.vbm_2_price),
        vbm_3_price: new FormControl(this.pmeData.vbm_3_price),
        rsp_tier_1: new FormControl(this.pmeData.rsp_tier_1),
        rsp_tier_2: new FormControl(this.pmeData.rsp_tier_2),
        rsp_tier_3: new FormControl(this.pmeData.rsp_tier_3),
        gi_last_invoice_price_in_local_currency: new FormControl(this.pmeData.gi_last_invoice_price_in_local_currency),
        gi_last_validated_price_currency: new FormControl(this.pmeData.gi_last_validated_price_currency),
        last_validated_price: new FormControl(this.pmeData.last_validated_price),
        last_validated_price_nm: new FormControl(this.pmeData.last_validated_price_nm), // calculated
        requested_selling_price: new FormControl(
          this.pmeData.requested_selling_price ? this.pmeData.requested_selling_price.toFixed(2) : null,
        ),
        sm_threshold_price: new FormControl(this.pmeData.sm_threshold_price),
        requested_selling_price_nm: new FormControl(this.pmeData.requested_selling_price_nm),
        cd_threshold_price: new FormControl(this.pmeData.cd_threshold_price),
        rsp_change_vs_last_transacted_price: new FormControl(
          this.pmeData.rsp_change_vs_last_transacted_price,
        ),
        rsp_vs_adjusted_nba_price: new FormControl(
          this.pmeData.rsp_vs_adjusted_nba_price,
        ), //calculated
        rsp_change_vs_last_validated_price: new FormControl(
          this.pmeData.rsp_change_vs_last_validated_price,
        ),
        annualized_volume_commitment: new FormControl(
          this.pmeData.annualized_volume_commitment ? this.pmeData.annualized_volume_commitment.toFixed(2) : null,
        ),
        price_valid_from: new FormControl(setFormDate),
        price_valid_to: new FormControl(moment(this.pmeData.price_valid_to).format(dateFormat)),
        final_valid_from: new FormControl(moment(this.pmeData.final_valid_from).format(dateFormat)),
        final_valid_to: new FormControl(moment(this.pmeData.final_valid_to).format(dateFormat)),
        last_twelve_months_volume: new FormControl(this.pmeData.last_twelve_months_volume),
        current_sap_price_validity_date: new FormControl(this.pmeData.current_sap_price_validity_date),
        srep_justification_for_lower_rsp: new FormControl(this.pmeData.srep_justification_for_lower_rsp),
        srep_justification_for_lower_volume: new FormControl(this.pmeData.srep_justification_for_lower_volume),
      },
      {
        validator: validators,
      },
    );

    if (this.user.getUser().role === UserRole.SALES_REP) {
      this.pricereviewForm.controls['requested_selling_price'].setValidators([
        Validators.required,
        Validators.pattern(numRegex),
      ]);
      this.pricereviewForm.controls['annualized_volume_commitment'].setValidators([
        Validators.required,
        Validators.pattern(numRegex),
      ]);
    } else {
      this.pricereviewForm.controls['requested_selling_price'].setValidators(Validators.nullValidator);
      this.pricereviewForm.controls['annualized_volume_commitment'].setValidators(Validators.nullValidator);
    }
    this.pricereviewForm.controls['requested_selling_price'].updateValueAndValidity();
    this.pricereviewForm.controls['annualized_volume_commitment'].updateValueAndValidity();
  }
}

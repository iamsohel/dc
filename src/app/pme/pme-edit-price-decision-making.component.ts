import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { DvpModelValue } from './display-column-list.data';
import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-edit-price-decision-making',
  template: `
    <form [formGroup]="priceDecisionMakingForm">
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input
            [label]="'NBA company name'"
            [control]="priceDecisionMakingForm.controls['pdm_nba_company_name']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'Relative strength Huntsman'"
            [value]="pmeData.pdm_rltv_strength_huntsman ? pmeData.pdm_rltv_strength_huntsman.toFixed(2) : null"
            [control]="priceDecisionMakingForm.controls['pdm_rltv_strength_huntsman']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'NBA price currency'"
            [control]="priceDecisionMakingForm.controls['pdm_nba_price_currency']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>
          <app-select
            [label]="'Source of NBA price'"
            [control]="priceDecisionMakingForm.controls['pdm_source_of_nba_price']"
            [options]="sourceNbaPriceOptions"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
            (valueChange)="changeSourceOfNbaPriceLabel($event)"
          ></app-select>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
        <app-select
            [label]="'Existing or new business'"
            [control]="priceDecisionMakingForm.controls['pdm_business_type']"
            [options]="pdmbusinesstypeoptions"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-select>

          <!-- <app-input
            [label]="'Existing or new business'"
            [control]="priceDecisionMakingForm.controls['pdm_business_type']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)"
          ></app-input> -->

          <app-input
            [label]="'NBA product'"
            [control]="priceDecisionMakingForm.controls['pdm_nba_product']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'Relative strength NBA'"
            [control]="priceDecisionMakingForm.controls['pdm_rltv_strength_nba']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-input
            [label]="'NBA price per kg'"
            [value]="pmeData.pdm_nba_price_per_kg ? pmeData.pdm_nba_price_per_kg.toFixed(2) : null"
            [control]="priceDecisionMakingForm.controls['pdm_nba_price_per_kg']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <!--<app-input
            [label]="'Customer name'"
            [control]="priceDecisionMakingForm.controls['customer_name']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)"
          ></app-input>-->
        </div>
      </div>
      <hr />
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12 col-md-push-6">
          <app-input
            [label]="'Adjusted NBA price per kg'"
            [value]="pmeData.pdm_adjusted_nba_price_per_kg ? pmeData.pdm_adjusted_nba_price_per_kg.toFixed(2) : null"
            [control]="priceDecisionMakingForm.controls['pdm_adjusted_nba_price_per_kg']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-select
            [label]="'Specify top value driver for differentiation'"
            [control]="priceDecisionMakingForm.controls['pdm_top_value_drivers_differentiation']"
            [options]="driverForDiffOptions"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-select>

          <app-select
            [label]="'Is it a spot deal?'"
            [control]="priceDecisionMakingForm.controls['pdm_spot_deal']"
            [options]="spotDealOptions"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-select>
        </div>

        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12 col-md-pull-6">
          <app-input *ngIf="sourceOfNbaPriceLabel != ''"
            [label]="sourceOfNbaPriceLabel"
            [control]="priceDecisionMakingForm.controls['pdm_third_party']"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-input>

          <app-select
            [label]="'Overall Huntsman product differentiation vs NBA'"
            [control]="priceDecisionMakingForm.controls['pdm_product_differentiation']"
            [options]="productDiffVSNbaOptions"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-select>

          <app-select
            [label]="'Specify other value driver for differentiation'"
            [control]="priceDecisionMakingForm.controls['pdm_other_value_drivers_differentiation']"
            [options]="driverForDiffOptions"
            [disabled]="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
            (pmeData.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
            pmeData.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR)"
          ></app-select>
        </div>
      </div>
    </form>
  `,
})
export class PmeEditPriceDecisionMakingComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormGroup;
  @Input() pmeData: IPriceRecord;
  config = config;
  priceDecisionMakingForm: FormGroup;
  readonly userRole = UserRole;
  sourceNbaPriceOptions = ['Not Set', 'Customer', 'Public Websites', 'Third Party Publications'];
  productDiffVSNbaOptions = ['Not Set', 'Inferior', 'At Par', 'Superior'];
  spotDealOptions = ['Not Set', 'Yes', 'No'];
  driverForDiffOptions = DvpModelValue.data;
  sourceOfNbaPriceLabel: any = '';
  pdmbusinesstypeoptions = AppSelectOptionData.fromList( [true, false], ['New', 'Existing']);

  constructor(readonly user: UserService) { }

  ngOnInit(): void {
    this._initForm();
    this.formGroup.addControl('priceDecisionMaking', this.priceDecisionMakingForm);
    this.changeSourceOfNbaPriceLabel(this.pmeData.pdm_source_of_nba_price);
  }

  ngOnDestroy(): void { }

  changeSourceOfNbaPriceLabel(nbaPriceOption: String) {
    switch (nbaPriceOption) {
      case 'Not Set': this.sourceOfNbaPriceLabel = '';
        break;
      case 'Customer': this.sourceOfNbaPriceLabel = 'Customer name';
        break;
      case 'Public Websites': this.sourceOfNbaPriceLabel = 'Website';
        break;
      case 'Third Party Publications': this.sourceOfNbaPriceLabel = 'Name of the third-party publication';
        break;
    }
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  private _initForm(): void {
    this.priceDecisionMakingForm = new FormGroup({
      pdm_business_type: new FormControl(this.pmeData.pdm_business_type),
      pdm_nba_company_name: new FormControl(this.pmeData.pdm_nba_company_name),
      pdm_nba_product: new FormControl(this.pmeData.pdm_nba_product),
      pdm_rltv_strength_huntsman: new FormControl(this.pmeData.pdm_rltv_strength_huntsman),
      pdm_rltv_strength_nba: new FormControl(this.pmeData.pdm_rltv_strength_nba),
      pdm_nba_price_currency: new FormControl(this.pmeData.pdm_nba_price_currency),
      pdm_nba_price_per_kg: new FormControl(this.pmeData.pdm_nba_price_per_kg),
      pdm_source_of_nba_price: new FormControl(this.pmeData.pdm_source_of_nba_price),
      customer_name: new FormControl(this.pmeData.customer_name), // missing
      pdm_third_party: new FormControl(this.pmeData.pdm_third_party),
      pdm_adjusted_nba_price_per_kg: new FormControl(this.pmeData.pdm_adjusted_nba_price_per_kg),
      pdm_product_differentiation: new FormControl(this.pmeData.pdm_product_differentiation && this.pmeData.pdm_product_differentiation !== '' ? this.pmeData.pdm_product_differentiation : 'Not Set'),
      pdm_top_value_drivers_differentiation: new FormControl( this.pmeData.pdm_top_value_drivers_differentiation ),
      pdm_other_value_drivers_differentiation: new FormControl(this.pmeData.pdm_other_value_drivers_differentiation),
      pdm_spot_deal: new FormControl( this.pmeData.pdm_spot_deal && this.pmeData.pdm_spot_deal !== '' ? this.pmeData.pdm_spot_deal : 'Not Set' ),
    });
  }
}

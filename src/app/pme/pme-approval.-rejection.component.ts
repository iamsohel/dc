import { Component, Input, OnInit } from '@angular/core';

import * as moment from 'moment';

import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-approval-rejection',
  template: `
  <div *ngIf="!pmeData.review_validations" class="text-center">
    No review comment added yet
  </div>
  <div *ngFor="let review of pmeData.review_validations">
    <div class="row">
      <div class="col-md-10 col-sm-12 ">
        <h4> <span *ngIf="review.review_by_role_name === 'SalesManager' ">
          Sales Manager Review ({{ review.review_by }})
        </span>
        <span *ngIf="review.review_by_role_name === 'CD' ">
          Commercial Director Review ({{ review.review_by }})
        </span>
        <span *ngIf="review.review_by_role_name === 'SalesRep' ">
          Sales Rep Justification ({{ review.review_by }})
        </span>
        <span *ngIf="review.review_by_role_name === 'GMM' ">
          GMM Review ({{ review.review_by }})
        </span>
        </h4>
      </div>
      <div class="col-md-2 col-sm-12 ">
        <small class="pull-right"> {{ review.updated_at | date }} </small>
      </div>
    </div>
    <div class="row" *ngIf="review.review_by_role_name !=='SalesRef' ">
      <!-- Col 1 -->
      <div class="col-md-6 col-sm-12 col-md-push-6">
        <app-input
          [label]="'Suggested Price'"
          [value]="review.proposed_rsp"
          [disabled]="true"
        ></app-input>
      </div>

      <!-- Col 2 -->
      <div class="col-md-6 col-sm-12 col-md-pull-6">
        <!-- <app-select
          [label]="'Review status'"
          [options]="reviewStatusOptions"
          [value]="review.review_status"
          [disabled]="true"
        ></app-select> -->
        <app-input
          [label]="'Review status'"
          [value]="review.review_status"
          [disabled]="true"
        ></app-input>
      </div>
      <div class="col-md-12 col-sm-12 ">
        <app-input
          [label]="'Reason'"
          [value]="review.reason"
          [disabled]="true"
        ></app-input>
      </div>
      <div class="col-md-6 col-sm-6 ">
      <app-datepicker *ngIf="review.suggested_valid_from"
          [label]="'Suggested Valid From'"
          [value]="review.suggested_valid_from"
          [iconAfter]="'glyphicon-calendar'"
          [disabled]="true"
      ></app-datepicker>
      </div>
      <div class="col-md-6 col-sm-6 ">
      <app-datepicker *ngIf="review.suggested_valid_to"
          [label]="'Suggested Valid To'"
          [value]="review.suggested_valid_to"
          [iconAfter]="'glyphicon-calendar'"
          [disabled]="true"
      ></app-datepicker>
      </div>
    </div>
    <div class="row" *ngIf="review.review_by_role_name ==='SalesRef' ">
      <!-- Col 1 -->
      <div class="col-md-6 col-sm-12">
        <app-input
          [label]="'Requested Price'"
          [value]="pmeData.requested_selling_price"
          [disabled]="true"
        ></app-input>
      </div>
      <div class="col-md-12 col-sm-12">
        <p>Justification for lower Requested Selling price than DVP or Current SAP price</p>
      </div>
      <div class="col-md-12 col-sm-12">
        <app-input
          [label]="'Justification'"
          [value]="pmeData.srep_justification_for_lower_rsp"
          [disabled]="true"
         ></app-input>
      </div>
      <div class="col-md-12 col-sm-12">
        <p>Justification for lower volume commitment from last volume sold </p>
      </div>
      <div class="col-md-12 col-sm-12">
        <app-input
          [label]="'Justification'"
          [value]="pmeData.srep_justification_for_lower_volume"
          [disabled]="true"
         ></app-input>
      </div>
    </div>
  </div>
  `,
})
export class PmeApprovalRejectionComponent implements OnInit {
  @Input() pmeData: IPriceRecord;
  reviewStatusOptions = ['Not Set', 'Rejected', 'Approved'];

  constructor() {}

  ngOnInit(): void {
    const dateFormat = 'YYYY-MM-DD';
    if (this.pmeData && this.pmeData.review_validations && this.pmeData.review_validations.length > 0){
      this.pmeData.review_validations.map(rv => {
        rv.suggested_valid_from && (rv.suggested_valid_from = moment(rv.suggested_valid_from).format(dateFormat));
        rv.suggested_valid_to && (rv.suggested_valid_to = moment(rv.suggested_valid_to).format(dateFormat));
      });
    }
  }
}

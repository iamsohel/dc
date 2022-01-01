import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { HasUnsavedData } from '../core/core.interface';
import { TObjectId } from '../core/interfaces/common.interface';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';
import { ActivityObserver } from '../utils/activity-observer';
import { ReactiveLoader } from '../utils/reactive-loader';

import { PmeService } from './pme-management.service';
import { IPmeUpdateRequest, IPriceRecord } from './pme.interfaces';

interface FormLoaderData {
  pme?: IPriceRecord;
}

@Component({
  selector: 'pme-edit',
  template: `
    <app-spinner [visibility]="loader.active | async"></app-spinner>

    <div *ngIf="!(loader.active | async)">
      <div class="operations-toolbar row row-flex pt5 pb5" style="align-items: flex-end; flex-wrap: wrap;">
        <div class="col-xs-12 flex-static">
          <!-- Common Buttons -->
          <ul class="asset-btn-panel nav nav-pills">
            <li class="nav-item">
              <a class="nav-link link-colorless" [routerLink]="['/desk', 'pme', 'manage']">
                <i class="imgaction glyphicon glyphicon-arrow-left center-block"></i>
                <div>Back</div>
              </a>
            </li>
            <li
              class="nav-item"
              *ngIf="
                (user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)
              "
              [ngClass]="{ disabled: form.invalid || form.disabled || (savingObserver.active | async) || !canCommit }"
            >
              <a
                class="nav-link link-colorless red-tooltip"
                tooltip
                data-toggle="tooltip"
                data-placement="bottom"
                [tooltipTitle]="form.invalid ? 'Invalid input.Please correct and try again.' : ''"
                (click)="form.invalid || form.disabled || !canCommit || onSubmit(true)"
              >
                <i class="imgaction glyphicon glyphicon-ok center-block red-tooltip"></i>
                <!-- <i class="glyphicon" style="background: url('../../assets/img/icons/pme-commit-icon.png'); height:30px; width:30px; margin-top: 25px;margin-bottom: 5px;"></i> -->
                <div>Commit</div>
              </a>
            </li>
            <li
              class="nav-item"
              *ngIf="
                (user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) ||
                (user.getUser() | apply: _userHasRole:userRole.KEY_USER)
              "
              [ngClass]="{
                disabled: form.invalid || form.disabled || form.pristine || (savingObserver.active | async) || !canSave
              }"
            >
              <a
                class="nav-link link-colorless red-tooltip"
                tooltip
                data-toggle="tooltip"
                data-placement="bottom"
                [tooltipTitle]="form.invalid ? 'Invalid input.Please correct and try again.' : ''"
                (click)="form.invalid || form.disabled || form.pristine || !canSave || onSubmit()"
              >
                <i class="imgaction glyphicon glyphicon-floppy-disk center-block red-tooltip"> </i>
                <div>Save</div>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link link-colorless" [routerLink]="['/desk', 'pme', 'manage']">
                <i class="imgaction glyphicon glyphicon-eye-close center-block"></i>
                <div>Close</div>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <!-- <small class="btn btn-link"
        ><i class="glyphicon glyphicon-arrow-left"></i>
        <a [routerLink]="['/desk', 'pme', 'manage']" class="mt-0 mb-0"> Price Records </a></small
      > -->
      <h3 *ngIf="pmeData" class="mt-0">
        {{ "#" + pmeData.item_id }}
        <span
          class="giStatus"
          [style.background-color]="
            pmeData.gi_status === config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE
              ? '#17A2B8'
              : pmeData.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_SM
              ? '#F8A748'
              : pmeData.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_GMM
              ? '#F8A748'
              : pmeData.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_CD
              ? '#F8A748'
              : pmeData.gi_status === config.pmeitem.status.labels.VALIDATED_PRICE
              ? '#39B54A'
              : pmeData.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD
              ? '#DC3545'
              : pmeData.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SM
              ? '#DC3545'
              : pmeData.gi_status === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR
              ? '#DC3545'
              : ''
          "
        >
          {{ pmeData.gi_status }}</span
        >

        <div *ngIf="pmeData.parent_id" style="font-size: 16px;">
          <a style="text-decoration:underline" [routerLink]="['/desk', 'pme', 'manage', pmeData.parent_id]">
            Parent Item: {{ pmeData.parent_id }}
          </a>
        </div>
      </h3>

      <div class="row">
        <div class="col-md-3">
          <app-input
            [label]="'Assigned to'"
            [value]="
              pmeData.assigned_to
                ? pmeData.assigned_to
                : !pmeData.assigned_to && (user.getUser() | apply: _userHasRole:userRole.SALES_REP)
                ? user.getUser().firstName + ' ' + user.getUser().lastName
                : ''
            "
            [disabled]="true"
          ></app-input>
        </div>
        <!-- <div class="col-md-9">
          <div class="pull-right">
            <button
              *ngIf="(user.getUser() | apply: _userHasRole:userRole.SALES_REP) || (user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)"
              type="submit"
              (click)="onSubmit(true)"
              [disabled]="(form.invalid || form.disabled  || (savingObserver.active | async) || !canCommit)"
              class="btn btn-md btn-success btn-apply"
              [style.background-color]="'#48C248'"
              [style.border]="'none'"
              [style.color]="'white'"
            >
              {{ "Commit" }}
            </button>
            <button
              *ngIf="(user.getUser() | apply: _userHasRole:userRole.SALES_REP) || (user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)"
              type="submit"
              (click)="onSubmit()"
              [disabled]="form.disabled || form.pristine || (savingObserver.active | async) || !canSave"
              class="btn btn-info btn-md"
              style="background: #0D47A1; border-radius: 3px; height: 33px; margin-bottom: 1px;"
            >
              {{ "SAVE" }} &nbsp; &nbsp;
              <i class="glyphicon glyphicon-floppy-disk" style="margin-top: 2px; margin-top: 2px;"></i>
            </button>
            <button
              type="submit"
              [routerLink]="['/desk', 'pme', 'manage']"
              class="btn btn-md "
              style="background: #696969; border-radius: 3px; height: 33px; margin-bottom: 1px; color:white;"
            >
              {{ "CLOSE" }}
            </button>
          </div>
        </div> -->
      </div>
      <form [formGroup]="form">
        <div class="row">
          <div
            [class]="
              !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) &&
              !(user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) &&
              !(user.getUser() | apply: _userHasRole:userRole.KEY_USER) &&
              !(user.getUser() | apply: _userHasRole:userRole.READER) &&
              !(user.getUser() | apply: _userHasRole:userRole.SALES_SUPPORT)
                ? 'col-md-7 col-sm-12'
                : 'col-md-12 col-sm-12'
            "
          >
            <app-accordian [label]="'General Info'" [isCollapsed]="true">
              <pme-edit-general-info [formGroup]="form" [pmeData]="pmeData"></pme-edit-general-info>
            </app-accordian>

            <app-accordian [label]="'Price Decision Making'" [isCollapsed]="true">
              <pme-edit-price-decision-making [formGroup]="form" [pmeData]="pmeData"></pme-edit-price-decision-making>
            </app-accordian>

            <app-accordian [label]="'Additional Info'" [isCollapsed]="true">
              <pme-edit-additional-info [formGroup]="form" [pmeData]="pmeData"></pme-edit-additional-info>
            </app-accordian>

            <app-accordian
              [label]="'Threshold Info'"
              [isCollapsed]="true"
              [style.display]="
                (user.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
                (user.getUser() | apply: _userHasRole:userRole.KEY_USER) ||
                (user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) ||
                (user.getUser() | apply: _userHasRole:userRole.READER) ||
                (user.getUser() | apply: _userHasRole:userRole.SALES_SUPPORT)
                  ? 'none'
                  : null
              "
            >
              <!-- *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_REP)" -->
              <pme-edit-threshold-info [formGroup]="form" [pmeData]="pmeData"></pme-edit-threshold-info>
            </app-accordian>

            <app-accordian [label]="'Price Review'" [isCollapsed]="true">
              <pme-edit-price-review [formGroup]="form" [pmeData]="pmeData"></pme-edit-price-review>
            </app-accordian>

            <app-accordian
              [label]="'Approval/Rejection Comments'"
              [isCollapsed]="true"
              [style.display]="
                !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) &&
                !(user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) &&
                !(user.getUser() | apply: _userHasRole:userRole.KEY_USER)
                  ? 'none'
                  : null
              "
            >
              <pme-approval-rejection [pmeData]="pmeData"></pme-approval-rejection>
            </app-accordian>
          </div>
          <div
            class="col-md-5 col-sm-12"
            *ngIf="
              !(user.getUser() | apply: _userHasRole:userRole.SALES_REP) &&
              !(user.getUser() | apply: _userHasRole:userRole.GPO_ANALYST) &&
              !(user.getUser() | apply: _userHasRole:userRole.KEY_USER) &&
              !(user.getUser() | apply: _userHasRole:userRole.READER) &&
              !(user.getUser() | apply: _userHasRole:userRole.SALES_SUPPORT)
            "
          >
            <app-accordian [label]="'Price Impact Analysis'" [isCollapsed]="false" [canToggled]="false">
            </app-accordian>

            <app-accordian [label]="'Approval/Rejection Comments'" [isCollapsed]="true">
              <pme-approval-rejection [pmeData]="pmeData"></pme-approval-rejection>
            </app-accordian>

            <app-accordian [label]="'Approval'" [isCollapsed]="true">
              <pme-approval [pmeData]="pmeData"> </pme-approval>
            </app-accordian>
          </div>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./pme.scss'],
})
export class PmeEditComponent implements OnInit, OnDestroy, HasUnsavedData {
  config = config;
  readonly loader: ReactiveLoader<FormLoaderData, TObjectId>;
  readonly savingObserver = new ActivityObserver();
  readonly userRole = UserRole;

  pmeData: IPriceRecord;

  form: FormGroup;
  canCommit: boolean = true;
  canSave: boolean = true;

  private _subscriptions: Subscription[] = [];
  private _formSubscriptions: Subscription[] = [];
  private _updateSubscriptions: Subscription;

  constructor(
    readonly pmeService: PmeService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    readonly user: UserService,
  ) {
    this.loader = new ReactiveLoader((userId: TObjectId) => {
      return userId ? this._editFormLoader(userId) : this._createFormLoader();
    });

    const loaderSubscription = this.loader.subscribe(this._onPageDataLoaded.bind(this));
    this._subscriptions.push(loaderSubscription);
  }

  ngOnInit(): void {
    const paramsSubscription = this._activatedRoute.params.subscribe((params: Params) => {
      this.loader.load(params['userId']);
    });

    this._subscriptions.push(paramsSubscription);
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((_) => _.unsubscribe());
    this._formSubscriptions.forEach((_) => _.unsubscribe());
    if (this._updateSubscriptions) {
      this._updateSubscriptions.unsubscribe();
    }
  }

  onSubmit(commit?: boolean): void {
    const generalInfo = this.form.get(['generalInfo']).value;
    const priceDecisionMaking = this.form.get(['priceDecisionMaking']).value;
    const additionalInfo = this.form.get(['additionalInfo']).value;
    const thresholdInfo = this.form.get(['thresholdInfo']).value;
    let priceReview = this.form.get(['priceReview']).value;
    delete priceReview.invoice_currency;
    delete priceReview.final_valid_from;
    delete priceReview.final_valid_to;
    // priceReview.requested_selling_price =
    //   this.user.getUser().role === UserRole.GPO_ANALYST &&
    //   this.pmeData.priority_of_review === config.pmeitem.priority.labels.AUTO_EXTENDED
    //     ? this.pmeData.dvp_model_price
    //     : priceReview.requested_selling_price;
    let formData = { ...generalInfo, ...priceDecisionMaking, ...additionalInfo, ...thresholdInfo, ...priceReview };
    if (commit) {
      formData.commit = 1;
    }

    this.pmeService.makeEmptyPropertiesNull(formData);

    this._updateSubscriptions = this.pmeService
      .update(this.pmeData.item_id, <IPmeUpdateRequest> formData)
      .subscribe((data) => {
        this._router.navigate(['/desk', 'pme', 'manage']);
      });
  }

  hasUnsavedData(): boolean {
    return this.form && this.form.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  public onPageUnload($event: BeforeUnloadEvent) {
    if (this.hasUnsavedData()) {
      $event.returnValue = true;
    }
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  _userHasSelectionAccess(item) {
    if (this.user.getUser().role === UserRole.SALES_REP) {
      if (
        item.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
        (item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD ||
          item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SM ||
          item.gi_status !== config.pmeitem.status.labels.VALIDATED_PRICE) &&
        item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR
      ) {
        this.canCommit = false;
      }
      if (
        item.gi_status !== config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE &&
        item.gi_status !== config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR
      ) {
        this.canSave = false;
      }
    } else if (this.user.getUser().role === UserRole.GPO_ANALYST) {
      if (
        item.priority_of_review !== config.pmeitem.priority.labels.AUTO_EXTENDED ||
        !(item.gi_status === config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE)
      ) {
        this.canCommit = false;
      }
    }
  }

  private _editFormLoader(itemId: TObjectId): Observable<FormLoaderData> {
    return this.pmeService.get(itemId).map((pme) => {
      return { pme };
    });
  }

  private _createFormLoader(): Observable<FormLoaderData> {
    return Observable.of({});
  }

  private _onPageDataLoaded(data: FormLoaderData): void {
    this.pmeData = data.pme;
    this._initForm();
    this.canSave = true;
    this.canCommit = true;
    this._userHasSelectionAccess(this.pmeData);
  }

  private _initForm(): void {
    this._formSubscriptions.forEach((_) => _.unsubscribe());
    this.form = new FormGroup({});
  }
}

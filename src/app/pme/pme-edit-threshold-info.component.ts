import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-edit-threshold-info',
  template: `
    <form [formGroup]="thresholdInfoForm">
      <div class="row">
        <!-- Col 1 -->
        <div class="col-md-6 col-sm-12">
          <!-- <app-input
            [label]="'SM Threshold NM%'"
            [control]="thresholdInfoForm.controls['ti_sm_threshold_nm']"
            [disabled]="true"
          ></app-input> -->

          <app-input
            [label]="'SM Threshold Price'"
            [control]="thresholdInfoForm.controls['sm_threshold_price']"
            [disabled]="true"
          ></app-input>
        </div>
        <!-- Col 2 -->
        <div class="col-md-6 col-sm-12" *ngIf="!(user.getUser() | apply: _userHasRole:userRole.SALES_MANAGER)">
          <!-- <app-input
            [label]="'CD Threshold NM%'"
            [control]="thresholdInfoForm.controls['ti_cd_threshold_nm']"
            [disabled]="true"
          ></app-input> -->

          <app-input
            [label]="'CD Threshold Price'"
            [control]="thresholdInfoForm.controls['cd_threshold_price']"
            [disabled]="true"
          ></app-input>
        </div>
      </div>
    </form>
  `,
})
export class PmeEditThresholdInfoComponent implements OnInit, OnDestroy {
  @Input() formGroup: FormGroup;
  @Input() pmeData: IPriceRecord;
  thresholdInfoForm: FormGroup;
  readonly userRole = UserRole;

  constructor(readonly user: UserService) {}

  ngOnInit(): void {
    this._initForm();
    this.formGroup.addControl('thresholdInfo', this.thresholdInfoForm);
  }

  ngOnDestroy(): void {}

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  private _initForm(): void {
    this.thresholdInfoForm = new FormGroup({
      ti_sm_threshold_nm: new FormControl(this.pmeData.ti_sm_threshold_nm),
      sm_threshold_price: new FormControl(this.pmeData.sm_threshold_price),
      ti_cd_threshold_nm: new FormControl(this.pmeData.ti_cd_threshold_nm),
      cd_threshold_price: new FormControl(this.pmeData.cd_threshold_price),
    });
  }
}

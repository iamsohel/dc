import { Component } from '@angular/core';

import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

@Component({
  selector: 'user-context',
  template: `
    <div class="group">
      <!-- <button type="button"
        class="btn btn-primary btn-block"
        [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'list']"
        routerLinkActive #quoteCreateActive="routerLinkActive"
        [ngClass]="{'btn-alt': !quoteCreateActive.isActive}"
      >
        Quotation
      </button>

      <button type="button"
        class="btn btn-primary btn-block"
        [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'file']"
        routerLinkActive #quotationFileActive="routerLinkActive"
        [ngClass]="{'btn-alt': !quotationFileActive.isActive}"
      >
        Upload Batch Quotation
       </button>
      <button type="button"
        class="btn btn-primary btn-block"
        [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'create-distributor']"
        routerLinkActive #distributeCreateActive="routerLinkActive"
        [ngClass]="{'btn-alt': !distributeCreateActive.isActive}"
      >
        Distributor Quote
      </button> -->
    </div>

    <div class="menu">
      <ul class="nav nav-stacked">
        <li>
          <a [routerLink]="['/desk', 'pme', 'manage']" [routerLinkActive]="['active']">
            <i
              class="glyphicon"
              style="background: url('../../assets/img/icons/price-cal-icon2-hover.svg'); height:20px; width:20px; margin-right: 25px;margin-left: 17px;"
            ></i>
            <span>Price Management</span>
          </a>
        </li>
        <li *ngIf="userService.getUser() | apply: _userHasRole:userRole.GPO_ANALYST">
          <a
            [routerLink]="['/desk', 'pme', 'manage', 'approver', 'list']"
            routerLinkActive
            #priceRecordActive="routerLinkActive"
          >
            <i
              class="glyphicon"
              style="background: url('../../assets/img/icons/price-cal-icon2-hover.svg'); height:20px; width:20px; margin-right: 25px;margin-left: 17px;"
            ></i>
            <span>Price Record Staging</span>
          </a>
        </li>
        <li
          *ngIf="
            (userService.getUser() | apply: _userHasRole:userRole.KEY_USER) ||
            (userService.getUser() | apply: _userHasRole:userRole.SALES_SUPPORT) ||
            (userService.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)
          "
        >
          <a
            [routerLink]="['/desk', 'pme', 'manage', 'quotation', 'list']"
            routerLinkActive
            #quoteListActive="routerLinkActive"
          >
            <!-- <i class="glyphicon glyphicon-usd"></i> -->
            <i
              class="glyphicon"
              style="background: url('../../assets/img/icons/price-cal-icon2-hover.svg'); height:20px; width:20px; margin-right: 25px;margin-left: 17px;"
            ></i>
            <span>Quotation Requests</span>
          </a>
        </li>
      </ul>
    </div>
  `,
})
export class PmeContextComponent {
  readonly userRole = UserRole;
  constructor(readonly userService: UserService) {}

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }
}

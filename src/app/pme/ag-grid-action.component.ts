import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

import config from '../config';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { PmeService } from './pme-management.service';

@Component({
  selector: 'ag-grid-action',
  template: `
    <div class="dots-menu btn-group" role="button">
      <a data-toggle="dropdown" class="glyphicon glyphicon-option-vertical"></a>
      <ul class="dropdown-menu">
        <li><a [routerLink]="['/desk', 'pme', 'manage', cellValue]">View/Edit</a></li>
        <!-- <li class="delete-row">
          <a [routerLink]="['/desk', 'pme', 'manage', cellValue]">Commit</a>
        </li> -->
        <li [ngClass]="{'disabled': disabledClone}"><a (click)="disabledClone || clone(cellValue)">Clone</a></li>
      </ul>
    </div>
  `,
  styleUrls: ['./pme.scss'],
})
export class AgGridActionComponent implements AgRendererComponent {
  isOpen: boolean = false;
  disabledClone: boolean = false;
  cellValue: string;
  constructor(
    readonly pmeService: PmeService,
    private userService: UserService,
    private _router: Router,
  ) {}

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.cellValue = this.getValueToDisplay(params);

    this.disabledClone = this.userService.getUser().role !== UserRole.SALES_REP ||
    params.data.gi_status !== config.pmeitem.status.labels.VALIDATED_PRICE;
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  // gets called whenever the user gets the cell to refresh
  refresh(params: ICellRendererParams) {
    // set value into cell again
    this.cellValue = this.getValueToDisplay(params);
    return false;
  }

  onOpenDropdown() {
    this.isOpen = !this.isOpen;
  }

  getValueToDisplay(params: ICellRendererParams) {
    return params.data.item_id;
  }

  clone(itemId: string) {
    this.pmeService.clone(itemId).subscribe((data) => {
      this._router.navigate(['/desk', 'pme', 'manage', data]);
    });

    // this._router.navigate(['/desk', 'pme', 'manage', itemId]);
  }
}

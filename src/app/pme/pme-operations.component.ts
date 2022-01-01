import {
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { PmeCommitModalComponent } from './pme-commit-modal';
import { PmeService } from './pme-management.service';
import { PmeUploadModalComponent } from './pme-upload-modal.component';
import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-operations',
  template: `
    <div class="operations-toolbar row row-flex pt5 pb5" style="align-items: flex-end; flex-wrap: wrap;">
      <div class="col-xs-12 flex-static">
        <!-- Common Buttons -->
        <ul class="asset-btn-panel nav nav-pills">
          <li
            class="nav-item"
            *ngIf="
              (userService.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
              (userService.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)
            "
            [ngClass]="{ disabled: !selectedItems.length }"
          >
            <a class="nav-link link-colorless" (click)="disabledCommit || commit()">
              <i class="imgaction glyphicon glyphicon-ok center-block"></i>
              <div>Commit</div>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link link-colorless" (click)="onDownloadCsv()">
              <i class="imgaction glyphicon glyphicon-cloud-download center-block"></i>
              <div>Download</div>
            </a>
          </li>
          <li
            class="nav-item"
            *ngIf="
              (userService.getUser() | apply: _userHasRole:userRole.SALES_REP) ||
              (userService.getUser() | apply: _userHasRole:userRole.GPO_ANALYST)
            "
          >
            <a class="nav-link link-colorless" (click)="onUploadCsv()">
              <i class="imgaction glyphicon glyphicon-cloud-upload center-block"></i>
              <div>Upload</div>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <pme-commit-modal
      #confirmCommitModal
      [selectedItems]="selectedItems"
      (committed)="onCommitted($event)"
    ></pme-commit-modal>
  `,
})
export class PmeOperationsComponent implements OnChanges, OnDestroy {
  @Input() selectedItems: IPriceRecord[] = [];
  @Output() selectedItemsChange = new EventEmitter<IPriceRecord[]>();
  @Output() committed = new EventEmitter<IPriceRecord[]>();
  @Output() downloadCsv = new EventEmitter();
  @Output() uploadCsv = new EventEmitter();

  disabledCommit: boolean = false;
  readonly userRole = UserRole;
  @ViewChild('confirmCommitModal') confirmDeleteModal: PmeCommitModalComponent;

  private _subscriptions: Subscription[] = [];

  constructor(
    public pmeService: PmeService,
    public userService: UserService,
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {
    this._updateButtonsAvailability();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedItems'] && changes['selectedItems'].currentValue !== changes['selectedItems'].previousValue) {
      this._updateButtonsAvailability();
    }
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((_) => _.unsubscribe());
  }

  onCommitted(items: IPriceRecord[]): void {
    this.resetSelection();
    this.committed.emit(items);
  }

  onDownloadCsv(): void {
    this.downloadCsv.emit();
  }

  onUploadCsv(): void {
    const factory = this.componentFactoryResolver.resolveComponentFactory(PmeUploadModalComponent);
    const modalRef = this.viewContainer.createComponent(factory);
    modalRef.instance.open().subscribe(() => modalRef.destroy());

  }

  resetSelection(): void {
    this.selectedItemsChange.emit([]);
  }

  editRoute(): string[] {
    return ['/desk', 'users', 'manage', this.selectedItems[0].item_id];
  }

  commit(): void {
    this.confirmDeleteModal.show();
  }

  _userHasRole(user: IUser, role: UserRole) {
    return user.role === role;
  }

  private _updateButtonsAvailability(): void {
    const actionsDisabled = this.selectedItems.some((_) => {
      return (
        this.userService.getUser().role === UserRole.ADMIN ||
        this.userService.getUser().role === UserRole.SALES_REP ||
        this.userService.getUser().role === UserRole.GPO_ANALYST
      );
    });
    this.disabledCommit = !actionsDisabled || this.selectedItems.length <= 0;
  }
}

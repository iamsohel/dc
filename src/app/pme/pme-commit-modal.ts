import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';

import 'rxjs/add/operator/shareReplay';
import { Subscription } from 'rxjs/Subscription';

import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IModalButton } from '../core-ui/components/modal.component';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';
import { ActivityObserver } from '../utils/activity-observer';
import { ReactiveLoader } from '../utils/reactive-loader';

import { PmeService } from './pme-management.service';
import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-commit-modal',
  template: `
    <app-modal #confirmCommitModal
      [caption]="'Commit price record' + (selectedItems.length > 1 ? 's' : '')"
      [buttons]="[
        {class: 'btn-clear', title: 'Cancel', id: 'cancel', disabled: (_loader.active | async)},
        {class: 'btn-apply', title: 'Confirm', id: 'confirm', disabled: (_loader.active | async) || _savingObserver.isActive || invalidRecords.length > 0}
      ]"
      (buttonClick)="onConfirmCommit(selectedItems, $event)"
    >
      <app-spinner [visibility]="_loader.active | async"></app-spinner>
      <ng-container>
        <ng-container *ngIf="selectedItems.length === 1">
          <p>Are you sure you want to submit the record for approval? <br> <strong>Price Record # {{selectedItems[0] | apply: getPriceRecord}}</strong></p>
        </ng-container>
        <ng-container *ngIf="invalidRecords && invalidRecords.length > 0">
          <p>The following price records has invalid data.Please fix these and try again.</p>
          <ul>
            <li *ngFor="let item of invalidRecords"><strong style="color:red">Price Record # {{item | apply: getPriceRecord}}</strong></li>
          </ul>
        </ng-container>
        <ng-container *ngIf="invalidRecords.length <=0 && selectedItems.length > 1">
          <p>Are you sure you want to submit the following price records for approval?</p>
          <ul>
            <li *ngFor="let item of selectedItems"><strong>Price Record # {{item | apply: getPriceRecord}}</strong></li>
          </ul>
        </ng-container>
      </ng-container>
    </app-modal>
  `,
})
export class PmeCommitModalComponent implements OnDestroy, OnChanges {
  @Input() selectedItems: IPriceRecord[] = [];
  @ViewChild('confirmCommitModal') confirmCommitModal: PmeCommitModalComponent;
  @Output() committed = new EventEmitter<IPriceRecord[]>();

  transferTo: IPriceRecord;
  invalidRecords: IPriceRecord[] = [];

  readonly _savingObserver = new ActivityObserver();

  private _allPmes: IPriceRecord[] = [];
  private _subscriptions: Subscription[] = [];
  private _loader: ReactiveLoader<IPriceRecord[], void>;

  constructor(
    public pmeService: PmeService,
    readonly user: UserService,
  ) {
    this._loader = new ReactiveLoader<IPriceRecord[], void>(() => this.pmeService.listAll());
    this._subscriptions.push(this._loader.subscribe(pmes => {
      this._allPmes = pmes;
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.invalidRecords = [];

    this.selectedItems.map(priceRecord => {
      if ((this.user.getUser().role !== UserRole.GPO_ANALYST)) {
        if (!priceRecord.requested_selling_price || priceRecord.requested_selling_price <= 0 ) {
          this.invalidRecords.push(priceRecord);
        }
      } else if ((this.user.getUser().role !== UserRole.GPO_ANALYST)) {
        if (!priceRecord.annualized_volume_commitment || priceRecord.annualized_volume_commitment.toString() === '' ) {
          this.invalidRecords.push(priceRecord);
        }
      } else if (!priceRecord.price_valid_from || priceRecord.price_valid_from === null ) {
        this.invalidRecords.push(priceRecord);
      } else if (!priceRecord.price_valid_to || priceRecord.price_valid_to === null ) {
        this.invalidRecords.push(priceRecord);
      } else if (priceRecord.price_valid_to < priceRecord.price_valid_from) {
        this.invalidRecords.push(priceRecord);
      }

    });
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(_ => _.unsubscribe());
  }

  onSelect(matchId: string): void {
    this.transferTo = this._allPmes.find(_ => _.item_id === matchId);
  }

  getPriceRecord = (priceRecord: IPriceRecord): string => {
    return this.pmeService.getPmeInformation(priceRecord);
  };

  prepareUserOptions = (allUsers: IPriceRecord[], selectedItems: IPriceRecord[]): AppSelectOptionData[] => {
    const nonSelectedUsers: IPriceRecord[] = (allUsers || [])
      .filter(_ => !selectedItems.find(selectedItem => _.item_id === selectedItem.item_id));
    return nonSelectedUsers.map((filteredUser: IPriceRecord) => ({
      id: filteredUser.item_id,
      text: this.pmeService.getPmeInformation(filteredUser),
    }));
  };

  onConfirmCommit(items: IPriceRecord[], button: IModalButton): void {
    if (button.id === 'confirm') {
      const observable = this.pmeService.commit(items);

      this._savingObserver.observe(observable);
      const subscription = observable
        .subscribe(commitResults => {
          //const actuallyCommittedIds = commitResults.filter(_ => !!_).map(_ => _.id);
          this.committed.emit(items);
          this.hide();
        });
      this._subscriptions.push(subscription);
    } else {
      this.hide();
    }
  }

  show() {
    this._reset();
    //this._loader.load();
    this.confirmCommitModal.show();
  }

  hide() {
    this.confirmCommitModal.hide();
  }

  private _reset() {
    this.transferTo = null;
  }
}

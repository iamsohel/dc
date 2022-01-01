import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';

import 'rxjs/add/operator/shareReplay';
import { Subscription } from 'rxjs/Subscription';

import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { IModalButton } from '../core-ui/components/modal.component';
import { ActivityObserver } from '../utils/activity-observer';
import { bulkAction } from '../utils/observable';
import { ReactiveLoader } from '../utils/reactive-loader';

import { UserManagementService } from './user-management.service';
import { IUMUser } from './user.interfaces';

@Component({
  selector: 'user-delete-modal',
  template: `
    <app-modal #confirmDeleteModal
      [caption]="'Delete user' + (selectedItems.length > 1 ? 's' : '')"
      [buttons]="[
        {class: 'btn-clear', title: 'Cancel', id: 'cancel', disabled: (_loader.active | async)},
        {class: 'btn-apply', title: 'Confirm', id: 'confirm', disabled: (_loader.active | async) || _savingObserver.isActive}
      ]"
      (buttonClick)="onConfirmDelete(selectedItems, $event)"
    >
      <app-spinner [visibility]="_loader.active | async"></app-spinner>
      <ng-container *ngIf="_loader.loaded">
        <ng-container *ngIf="selectedItems.length === 1">
          <p>Are you sure you want to delete user: <strong>{{selectedItems[0] | apply: getUserInfo}}</strong></p>
        </ng-container>

        <ng-container *ngIf="selectedItems.length > 1">
          <p>Are you sure you want to delete these users:</p>
          <ul>
            <li *ngFor="let item of selectedItems"><strong>{{item | apply: getUserInfo}}</strong></li>
          </ul>
        </ng-container>
        <app-select
          [label]="'Transfer Ownership To'"
          [options]="_allUsers | apply: prepareUserOptions: selectedItems"
          (valueChange)="onSelect($event)"
        >
        </app-select>
      </ng-container>
    </app-modal>
  `,
})
export class UserDeleteModalComponent implements OnDestroy {
  @Input() selectedItems: IUMUser[] = [];
  @ViewChild('confirmDeleteModal') confirmDeleteModal: UserDeleteModalComponent;
  @Output() deleted = new EventEmitter<IUMUser[]>();

  transferTo: IUMUser;

  readonly _savingObserver = new ActivityObserver();

  private _allUsers: IUMUser[] = [];
  private _subscriptions: Subscription[] = [];
  private _loader: ReactiveLoader<IUMUser[], void>;

  constructor(
    public umService: UserManagementService,
  ) {
    this._loader = new ReactiveLoader<IUMUser[], void>(() => this.umService.listAll());
    this._subscriptions.push(this._loader.subscribe(users => this._allUsers = users));
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(_ => _.unsubscribe());
  }

  onSelect(matchId: string): void {
    this.transferTo = this._allUsers.find(_ => _.id === matchId);
  }

  getUserInfo = (user: IUMUser): string => this.umService.getUserInformation(user);

  prepareUserOptions = (allUsers: IUMUser[], selectedItems: IUMUser[]): AppSelectOptionData[] => {
    const nonSelectedUsers: IUMUser[] = (allUsers || [])
      .filter(_ => !selectedItems.find(selectedItem => _.id === selectedItem.id));
    return nonSelectedUsers.map((filteredUser: IUMUser) => ({
      id: filteredUser.id,
      text: this.umService.getUserInformation(filteredUser),
    }));
  };

  onConfirmDelete(items: IUMUser[], button: IModalButton): void {
    if (button.id === 'confirm') {
      const observable = bulkAction(items.map(_ => {
        return this.umService.delete(_, this.transferTo ? this.transferTo : null);
      }));
      this._savingObserver.observe(observable);
      const subscription = observable
        .subscribe(deleteResults => {
          const actuallyDeletedIds = deleteResults.filter(_ => !!_).map(_ => _.id);
          this.deleted.emit(items.filter(_ => actuallyDeletedIds.includes(_.id)));
          this.hide();
        });
      this._subscriptions.push(subscription);
    } else {
      this.hide();
    }
  }

  show() {
    this._reset();
    this._loader.load();
    this.confirmDeleteModal.show();
  }

  hide() {
    this.confirmDeleteModal.hide();
  }

  private _reset() {
    this.transferTo = null;
  }
}

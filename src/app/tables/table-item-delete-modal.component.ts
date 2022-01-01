import { Component, EventEmitter, Output, ViewChild } from '@angular/core';

import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';

@Component({
  selector: 'table-item-delete-modal',
  template: `
    <app-modal #confirmDeleteModal
      [caption]="'Delete ' + _itemType + (_count > 1 ? 's' : '')"
      [buttons]="[
        {'class': 'btn-primary', 'title': 'Confirm'},
        {'class': 'btn-secondary', 'title': 'Cancel'}
      ]"
      (buttonClick)="onConfirmDelete($event)"
    >
      <div class="panel">
        <div class="panel-body">
          <div *ngIf="_itemType.toLowerCase() === 'column'">
            <p>Are you sure you want to delete the following {{_itemType.toLowerCase()}}?</p>
            <ul>
              <li *ngFor="let name of _names">{{name}}</li>
            </ul>
          </div>
          <div *ngIf="_itemType.toLowerCase() === 'row'">
            <p>Are you sure you want to delete {{_count}} row{{_count > 1 ? 's' : ''}}?</p>
          </div>
        </div>
      </div>
    </app-modal>
  `,
})
export class TableItemDeleteModalComponent {
  @ViewChild('confirmDeleteModal') modal: ModalComponent;
  @Output() deleted = new EventEmitter<string>();

  private _itemType: string = 'column';
  private _names: any[] = [];
  private _count: number;

  onDelete() {
    this.deleted.emit(this._itemType);
    this.modal.hide();
  }

  onConfirmDelete(button: IModalButton) {
    if (button.title === 'Confirm') {
      this.onDelete();
    }

    if (button.title === 'Cancel') {
      this.modal.hide();
    }
  }

  public show(data) {
    this.init(data);
    this.modal.show();
  }

  private init(data: any) {
    this._itemType = data.itemType;
    this._names = data.names;
    this._count = data.count;
  }
}

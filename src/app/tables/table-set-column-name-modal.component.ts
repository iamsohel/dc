import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';
import { AppFormGroup } from '../utils/forms';

@Component({
  selector: 'set-column-name-modal',
  template: `
    <app-modal #modal
      [caption]="(renameOperation ? 'Rename Column Name' : 'Set Column Name')"
      [buttons]="[
        {'class': 'btn-primary', 'title': (renameOperation ? 'Rename' : 'Add Column'), 'disabled': form.invalid},
        {'class': 'btn-secondary', 'title': 'Cancel', 'disabled': false}
      ]"
      (buttonClick)="onButtonClick($event)">
      <div class="panel">
        <div class="panel-body">
          <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit()">
            <app-input
              [control]="form.controls.columnName"
              label="Column Name "
            ></app-input>
          </form>
        </div>
      </div>
    </app-modal>
  `,
})
export class TableSetColumnNameModalComponent {
  @Output() onSaved = new EventEmitter<any>();
  @Output() onRename = new EventEmitter<any>();
  @ViewChild('modal') private modal: ModalComponent;

  private renameOperation: boolean = false;

  private form: AppFormGroup<{
    columnName: FormControl,
  }>;

  constructor() {
    this.form = new AppFormGroup({
      columnName: new FormControl('', Validators.required),
    });
  }

  onSubmit() {
    let val = this.form.value;

    if (this.renameOperation) {
      this.onRename.emit(val);
    } else {
      this.onSaved.emit(val);
    }

    this.modal.hide();
  }

  onButtonClick(button: IModalButton) {
    if (button.title === 'Add Column') {
      this.onSubmit();
    }

    if (button.title === 'Rename') {
      this.onSubmit();
    }

    if (button.title === 'Cancel') {
      this.modal.hide();
    }
  }

  public show(defaultColumnName: string = '') {
    this.form.reset();
    this.init(defaultColumnName);
    this.modal.show();
  }

  private init(columnName: string) {
    if (columnName) {
      this.renameOperation = true;
      this.form.setValue({columnName: columnName});
    } else {
      this.renameOperation = false;
    }
  }
}

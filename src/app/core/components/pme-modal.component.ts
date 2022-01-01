import { ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

import { ModalComponent } from '../../core-ui/components/modal.component';

export abstract class PmeModalComponent<IP> {
  file: File;
  readonly defaultFormValue = {name: ''};
  @ViewChild('modal') protected modal: ModalComponent;

  protected constructor(
    readonly uploadForm: FormGroup,
  ) {}

  onSelectFile(file: File) {
    this.file = file;
    if (this.uploadForm.controls.hasOwnProperty('name')) {
      this.uploadForm.controls['name'].setValue(file.name.replace(/\.\w+$/, ''));
      this.uploadForm.controls['file'].setValue(this.file);
    }
  }

  abstract getImportParams(): IP;

  // doUpload() {
  //   //this.service.import(this.file, this.getImportParams());
  //   this.modal.hide();
  // }

  open(): Observable<void> {
    this.uploadForm.reset(this.defaultFormValue);
    this.file = null;
    return this.modal.show();
  }
}

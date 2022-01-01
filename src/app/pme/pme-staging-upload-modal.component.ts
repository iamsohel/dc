import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { PmeModalComponent } from '../core/components/pme-modal.component';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { PmeAgGridDisplayList } from './display-column-list.data';
import { PmeService as PmeService } from './pme-management.service';
import { IPriceRecordImport } from './pme.interfaces';

@Component({
  selector: 'pme-staging-upload-modal',
  template: `
    <app-modal
      #modal
      [caption]="'Upload cv-model file'"
      [buttons]="[{ class: 'btn-primary', disabled: uploadForm.invalid || !file, title: 'Upload' }]"
      (buttonClick)="uploadForm.valid && file && doUpload()"
    >
      <form [formGroup]="uploadForm" enctype="multipart/form-data">
        <app-input [label]="'Name'" [readonly]="true" [control]="uploadForm.controls['name']"></app-input>
        <app-input
          [label]="'File'"
          [readonly]="true"
          [iconAfter]="'glyphicon-file'"
          file-upload
          [accept]="acceptList"
          [file-upload-click]="true"
          [value]="file?.name"
          (onSelectFile)="onSelectFile($event)"
          >Choose File
        </app-input>
      </form>
    </app-modal>
  `,
})
export class PmeStagingUploadModalComponent extends PmeModalComponent<IPriceRecordImport> {
  fileExtensions: String[] = ['.csv'];
  readonly userRole = UserRole;
  allColoumn = PmeAgGridDisplayList.items;

  readonly acceptList = this.fileExtensions;

  constructor(private user: UserService, private pmeService: PmeService) {
    super(
      new FormGroup({
        name: new FormControl(''),
        file: new FormControl(''),
      }),
    );
  }

  getImportParams(): IPriceRecordImport {
    return this.uploadForm.value;
  }

  doUpload() {
    let updateColumn = [];
    if (this.user.getUser().role === UserRole.GPO_ANALYST) {
      for (let i = 0; i < this.allColoumn.length; i++) {
        const element = this.allColoumn[i];
        updateColumn.push(element.field);
      }
    }

    const formdata = {
      file: this.file,
      columns_to_update: updateColumn,
    };
    this.pmeService.pmestagingcsvupload(formdata).subscribe((data) => {
      this.modal.hide();
    });
  }
}

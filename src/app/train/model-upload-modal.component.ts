import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { ImportModalComponent } from '../core/components/import-modal.component';

import { IModelImport } from './model.interface';
import { ModelService } from './model.service';
import { trainConfig } from './train.config';

@Component({
  selector: 'model-upload-modal',
  template: `
    <app-modal #modal
      [caption]="'Upload model file'"
      [buttons]="[{'class': 'btn-primary', disabled: (uploadForm.invalid || !file), title: 'Upload' }]"
      (buttonClick)="uploadForm.valid && file && doUpload()">
      <form [formGroup]="uploadForm">
        <app-input
          [label]="'Name'"
          [control]="uploadForm.controls['name']"></app-input>
        <app-input
          [label]="'File'"
          [readonly]="true"
          [iconAfter]="'glyphicon-file'"
          file-upload
          [accept]="acceptList"
          [file-upload-click]="true"
          [value]="file?.name"
          (onSelectFile)="onSelectFile($event)">Choose File
        </app-input>
      </form>
    </app-modal>
  `,
})
export class ModelUploadModalComponent extends ImportModalComponent<IModelImport> {
  readonly acceptList = trainConfig.model.fileExtensions;

  constructor(service: ModelService) {
    super(
      new FormGroup({
        name: new FormControl(''),
      }),
      service,
    );
  }

  getImportParams(): IModelImport {
    return {name: this.uploadForm.value.name};
  }
}

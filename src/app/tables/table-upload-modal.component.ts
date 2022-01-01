import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { ImportModalComponent } from '../core/components/import-modal.component';
import { ActivityObserver } from '../utils/activity-observer';
import { AppFormGroup } from '../utils/forms';
import { describeEnum } from '../utils/misc';
import { AppValidators } from '../utils/validators';

import { ITable } from './table.interface';
import { ITableImport, ITableImportFromS3, TableService } from './table.service';

enum TableLocation {
  LOCAL_FILE = 'LOCAL_FILE',
  BUCKET_PATH = 'BUCKET_PATH',
}

const importTableMode = describeEnum(TableLocation, {
  labels: {
    LOCAL_FILE: 'Local Desktop File',
    BUCKET_PATH: 'S3 Bucket Path',
  },
});

@Component({
  selector: 'table-upload-modal',
  template: `
    <app-modal #modal
      [caption]="'Upload file'"
      [buttons]="[{'class': 'btn-primary',
       disabled: (tablePathMode === TableLocationVariable.LOCAL_FILE && (uploadForm.invalid || !file)) ||
       (tablePathMode === TableLocationVariable.BUCKET_PATH && s3UploadForm.invalid) ||
       (_savingObserver.active | async),
        title: 'Upload' }]"
      (buttonClick)="doTableUpload()"
    >
      <form [formGroup]="uploadForm">
        <app-input
          [label]="'Table Name'"
          [control]="uploadForm.controls.name"
        ></app-input>
        <app-description
          [label]="'Table Description'"
          [control]="uploadForm.controls.description"
          [editMode]="true"
        ></app-description>
        <app-select
          [label]="'Format Type'"
          [control]="uploadForm.controls.format"
          [options]="formatList"
        ></app-select>
        <app-select
          *ngIf="uploadForm.value.format === 'csv'"
          [label]="'Delimiter'"
          [control]="uploadForm.controls.delimiter"
          [options]="delimiterList"
          [allowNull]="true"
          [nullSelectedText]="'Custom'"
        ></app-select>
        <app-input
          *ngIf="!uploadForm.controls.delimiter.value"
          [label]="'Custom Delimiter'"
          [control]="uploadForm.controls.customDelimiter"
        ></app-input>
        <ng-container *ngIf="uploadForm.value.format === 'csv'">
          <app-check
            [label]="'Determine Null Values'"
            [control]="uploadForm.controls.determineNulls"
          ></app-check>
          <app-input
            *ngIf="uploadForm.value.determineNulls"
            [label]="'Null Value'"
            [control]="uploadForm.controls.nullValue"
          ></app-input>
        </ng-container>
        <app-select
          [label]="'Upload Mode'"
          [options]="importTableOptions"
          [(value)]="tablePathMode"
        >
        </app-select>
        <ng-container [ngSwitch]="tablePathMode">
          <ng-container *ngSwitchCase="TableLocationVariable.BUCKET_PATH">
            <s3-bucket-form [form]="s3UploadForm"></s3-bucket-form>
            <app-input
              [label]="'S3 Bucket Path'"
              [control]="s3UploadForm.controls.filePath"
              [placeholder]="'path/to/file'"
            ></app-input>
          </ng-container>
          <ng-container *ngSwitchCase="TableLocationVariable.LOCAL_FILE">
            <app-input
              [label]="'File'"
              [readonly]="true"
              [iconAfter]="'glyphicon-file'"
              file-upload
              [accept]="acceptList"
              [sizeLimit]="config.table.import.sizeLimit"
              [file-upload-click]="true"
              [value]="file?.name"
              (onSelectFile)="onSelectFile($event)"
            >Choose File</app-input>
          </ng-container>
        </ng-container>
      </form>
    </app-modal>
  `,
})
export class TableUploadModalComponent extends ImportModalComponent<ITableImport> {
  readonly config = config;
  readonly delimiterList = [
    { id: ',', text: 'Comma (CSV)' },
    { id: '\t', text: 'Tabulation (TSV)' },
    { id: ';', text: 'Semicolon' },
  ];
  readonly formatList = [
    { id: 'csv', text: 'CSV-UTF8/TXT' },
    { id: 'json', text: 'JSON' },
  ];
  readonly uploadForm: AppFormGroup<{
    format: FormControl,
    name: FormControl,
    delimiter: FormControl,
    nullValue: FormControl,
    determineNulls: FormControl,
    description: FormControl,
    customDelimiter: FormControl,
  }>;
  readonly acceptList = config.table.import.accept;
  readonly defaultFormValue = {format: 'csv', name: null, delimiter: ',', nullValue: 'NULL', determineNulls: false};
  readonly TableLocationVariable = TableLocation;
  readonly s3UploadForm: AppFormGroup<{
    AWSS3BucketId: FormControl,
    AWSRegion: FormControl,
    AWSS3BucketName: FormControl,
    AWSAccessKey: FormControl,
    AWSSecretKey: FormControl,
    AWSSessionToken: FormControl,
    filePath: FormControl,
  }>;
  readonly importTableOptions: AppSelectOptionData[] =
    AppSelectOptionData.fromList(importTableMode.list, importTableMode.labels);
  readonly _savingObserver = new ActivityObserver();

  tablePathMode: TableLocation;

  constructor(private tableService: TableService) {
    super(
      new AppFormGroup({
        format: new FormControl('csv', Validators.required),
        name: new FormControl(null, Validators.required),
        delimiter: new FormControl(','),
        nullValue: new FormControl('NULL'),
        determineNulls: new FormControl(false),
        description: new FormControl(''),
        customDelimiter: new FormControl(),
      }),
      tableService,
    );

    const delimiter = this.uploadForm.controls['delimiter'];
    const customDelimiter = this.uploadForm.controls['customDelimiter'];
    AppValidators.crossValidate(delimiter, [customDelimiter], (value: string) => {
      return (value == null) ? Validators.required : Validators.nullValidator;
    });

    const buckedIdControl = new FormControl(null);
    const regionControl = new FormControl(null, Validators.required);
    const bucketNameControl = new FormControl(null, Validators.required);
    const accessKeyControl = new FormControl(null, Validators.required);
    const secretKeyControl = new FormControl(null, Validators.required);
    const sessionTokenControl = new FormControl(null, Validators.required);
    AppValidators.crossValidate(
      buckedIdControl,
      [regionControl, bucketNameControl, accessKeyControl, secretKeyControl, sessionTokenControl],
      (bucketId: string) => {
        return !bucketId
          ? Validators.required
          : Validators.nullValidator;
      },
    );

    this.s3UploadForm = new AppFormGroup({
      AWSS3BucketId: buckedIdControl,
      AWSRegion: regionControl,
      AWSS3BucketName: bucketNameControl,
      AWSAccessKey: accessKeyControl,
      AWSSecretKey: secretKeyControl,
      AWSSessionToken: sessionTokenControl,
      filePath: new FormControl(null, Validators.required),
    });
  }

  open(): Observable<void> {
    this.tablePathMode = TableLocation.LOCAL_FILE;
    this.s3UploadForm.reset();
    return super.open();
  }

  getImportParams(): ITableImport {
    const formValue = this.uploadForm.value;
    return {
      format: formValue.format,
      name: formValue.name,
      description: formValue.description,
      nullValue: formValue.determineNulls ? formValue.nullValue : undefined,
      delimiter: formValue.delimiter || formValue.customDelimiter,
    };
  }

  getS3ImportParams(): ITableImportFromS3 {
    const s3FormValue = this.s3UploadForm.value;
    return {
      ...this.getImportParams(),
      ...s3FormValue,
    };
  }

  doTableUpload() {
    this._savingObserver.observe(this.resolveTableUploadFunction());
    this.modal.hide();
  }

  resolveTableUploadFunction(): Observable<ITable> {
    switch (this.tablePathMode) {
      case TableLocation.BUCKET_PATH:
        return this.tableService.importFromS3(this.getS3ImportParams());
      case TableLocation.LOCAL_FILE:
        return this.tableService.import(this.file, this.getImportParams());
      default:
        throw new Error('Unknown Path Mode');
    }
  }
}

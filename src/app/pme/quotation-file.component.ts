import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import * as moment from 'moment';
import { from } from 'rxjs/observable/from';
import { timer } from 'rxjs/observable/timer';
import { bufferCount, concatMap, mapTo, scan } from 'rxjs/operators';

import config from '../config';
import { ActivityObserver } from '../utils/activity-observer';

import { PmeService } from './pme-management.service';
import { ICSVQuotRecord } from './pme.interfaces';

@Component({
  selector: 'album-create',
  template: `
    <Div>
      <div class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 col-xl-6 col-xl-offset-3">
        <h3 class="text-center">Upload Batch Quotation</h3>
        <div class="quote_alert" role="alert">
          <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true" style="color:brown"></span>
          Please download the template, fill up data according to the format and upload to submit. The app will verify
          your uploaded data structure before processing
        </div>
        <div class="row">
          <div class="col-md-4">
            <p>Input Data</p>
          </div>
          <div class="col-md-8">
            <a class="pull-right" type="text/csv" href="assets/files/pme/batch_input_template.csv">
              <i class="glyphicon glyphicon-save" role="button" >
                <span class="downTemp"> DOWNLOAD TEMPLATE </span></i
              >
            </a>
          </div>
        </div>
        <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit() && fileExtention === 'csv'">
          <app-input
            [label]="'Quotes CSV file'"
            [readonly]="true"
            [iconAfter]="'glyphicon-file'"
            file-upload
            [accept]="config.table.import.accept"
            [sizeLimit]="config.table.import.sizeLimit"
            [value]="form.value['file']?.name"
            [file-upload-click]="true"
            [disabled]="loading"
            (onSelectFile)="onUploadCSV($event)"
            >Upload Images
          </app-input>
          <button
            (click)="onSubmit()"
            type="submit"
            [disabled]="csvRecords.length <= 0 || loading ||fileErrors.length > 0 || rowErrors.length > 0"
            class="btn btn-primary pull-right"
          >
            Submit
          </button>
          <button class="btn btn-primary pull-right mr-6" (click)="onCancel()">Cancel</button>
          <br />
          <br />
          <br />
          <div *ngIf="fileErrors.length > 0" class="cross-validation-error-message alert alert-danger">
            <span *ngFor="let err of fileErrors"> {{ err }} <br /> </span>
          </div>
          <div *ngIf="rowErrors.length > 0" class="cross-validation-error-message alert alert-danger">
            {{ "The csv file has invalid record, Please fix and upload again." }}
          </div>
        </form>
      </div>
      <div class="col-md-10 col-md-offset-1">
        <app-spinner [visibility]="loading" [height]="40"></app-spinner>
        <div class="table-scroll mt-6" [adaptiveHeight]="{ minHeight: 450 }">
          <table class="table dataTable table-hover" *ngIf="csvRecords.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>customer_code</th>
                <th>uom</th>
                <th>currency</th>
                <th>sales_organization</th>
                <th>sales_district</th>
                <th>materail_code</th>
                <th>price_validity_start_date</th>
                <th>commited_volume</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let record of csvRecords; let i = index"
                [ngStyle]="{ 'background-color': !record.isValid ? '#ddd' : '' }"
              >
                <td>
                  <div style="width:33px">
                    {{ i }}
                    <span
                      *ngIf="!record.isValid"
                      class="glyphicon glyphicon-exclamation-sign"
                      aria-hidden="true"
                      style="color:brown"
                    ></span>
                  </div>
                </td>
                <td>
                  <span>{{ record.customer_code }}</span>
                </td>
                <td>
                  <span>{{ record.uom }}</span>
                </td>
                <td>
                  <span>{{ record.currency }}</span>
                </td>
                <td>
                  <span>{{ record.sales_organization }}</span>
                </td>
                <td>
                  <span>{{ record.sales_district }}</span>
                </td>
                <td>
                  <span>{{ record.materail_code }}</span>
                </td>
                <td>
                  <span>{{ record.price_validity_start_date }}</span>
                </td>
                <td>
                  <span>{{ record.commited_volume }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Div>
  `,
  styleUrls: ['./pme.scss'],
})
export class QuotationFileComponent {
  form: FormGroup;
  config = config;
  fileExtention: string;
  loading: boolean = false;
  public csvRecords: ICSVQuotRecord[] = [];
  fileErrors: String[] = [];
  rowErrors: String[] = [];
  readonly _savingObserver = new ActivityObserver();

  constructor(private router: Router, private pmeService: PmeService) {
    this.form = new FormGroup({
      file: new FormControl('', Validators.required),
      filename: new FormControl(''),
    });
  }

  downloadFile() {
    let link = document.createElement('a');
    link.download = 'batch_input_template';
    link.href = 'assets/files/pme/batch_input_template.csv';
    link.click();
  }

  onUploadCSV(file: File) {
    this.fileErrors = [];
    this.rowErrors = [];
    if (this.isValidCSVFile(file)) {
      this.loading = true;
      let reader = new FileReader();
      reader.readAsText(file);

      reader.onload = () => {
        let csvData = reader.result;
        let csvRecordsArray = (<string> csvData).split(/\r\n|\n/);

        let headersRow = this.getHeaderArray(csvRecordsArray);

        let csvRecordsfile = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, headersRow.length, file.name);

        from(csvRecordsfile)
          .pipe(
            bufferCount(500),
            concatMap((item) => timer(1).pipe(mapTo(item))),
            scan((acc, curr) => acc.concat(curr), []),
          )
          .subscribe((result) => {
            this.csvRecords = result;
            if (result.length === csvRecordsfile.length) this.loading = false;
          });
      };
      reader.onerror = () => {
        // this.loading = false;
        this.fileErrors.push('error is occured while reading file!');
      };
    } else {
      this.fileErrors.push('Please upload csv file');
      this.csvRecords = [];
    }
    // this.form.controls['file'].setValue(file);
    // this.form.controls['filename'].setValue(file.name.replace(/\.\w+$/, ''));
    // this.fileExtention = this.form.controls['file'].value.name.split('.').pop();
  }

  getHeaderArray(csvRecordsArr: any) {
    let headers = (<string> csvRecordsArr[0]).split(',');
    let headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: number ,  fileName: string) {
    let csvArr: ICSVQuotRecord[] = [];
    // let regex = /(\s*'[^']+'|\s*[^,]+)(?=,|$)/g;
    for (let i = 1; i < csvRecordsArray.length; i++) {
      let curruntRecord = (<string> csvRecordsArray[i]).split(',');
      if (curruntRecord.length === headerLength) {
        let csvRecord: ICSVQuotRecord = {};
        csvRecord.customer_code = curruntRecord[0].trim();
        csvRecord.materail_code = curruntRecord[1].trim();
        csvRecord.sales_district = curruntRecord[2].trim();
        csvRecord.sales_organization = curruntRecord[3].trim();
        csvRecord.uom = curruntRecord[4].trim();
        csvRecord.currency = curruntRecord[5].trim();
        // let price_validity_start_date = moment(curruntRecord[6].trim()).format('YYYY-MM-DD');
        csvRecord.price_validity_start_date = moment(curruntRecord[6].trim()).format('DD-MM-YYYY');
        csvRecord.commited_volume = Number(curruntRecord[7].trim());
        csvRecord.fileName = fileName;
        if (
          csvRecord.customer_code === '' ||
          csvRecord.uom === '' ||
          csvRecord.currency === '' ||
          csvRecord.sales_organization === '' ||
          csvRecord.sales_district === '' ||
          csvRecord.materail_code === '' ||
          csvRecord.price_validity_start_date === '' ||
          csvRecord.price_validity_start_date === 'Invalid date' ||
          csvRecord.commited_volume === null
        ) {
          csvRecord.isValid = false;
          this.rowErrors.push(i.toString());
        } else {
          csvRecord.isValid = true;
        }
        csvArr.push(csvRecord);
      } else {
        // this.rowErrors.push(i.toString());
      }
    }
    return csvArr;
  }

  onSubmit() {
    let quotes: ICSVQuotRecord[] = [];
    this.csvRecords.map((record) => {
      let quote = {
        customer_code: record.customer_code,
        uom: record.uom,
        currency: record.currency,
        sales_organization: record.sales_organization,
        sales_district: record.sales_district,
        material_code: record.materail_code,
        price_validity_start_date: record.price_validity_start_date,
        commited_volume: Number(record.commited_volume),
        file_name: record.fileName,
        quote_type: 'batch',
      };
      quotes.push(quote);
    });


    // const formValue = this.form.value;
    this._savingObserver
      .observe(this.pmeService.batchQuotation(quotes))
      .subscribe((data) => {
        this.router.navigate(['/desk', 'pme', 'manage', 'quotation', 'list']);
      });
  }

  onCancel() {
    this.router.navigate(['/desk', 'pme', 'manage', 'quotation', 'list']);
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith('.csv');
  }
}

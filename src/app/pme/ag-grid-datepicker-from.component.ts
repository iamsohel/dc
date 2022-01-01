import { Component } from '@angular/core';

import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import * as moment from 'moment';

@Component({
  selector: 'ag-grid-datepicker-from',
  template: `
  <div>
    <app-datepicker [value] ='cellValue' (valueChange) ="onvalueChange($event)" [iconAfter]="'glyphicon-calendar'" >
    </app-datepicker>
  </div>
  `,
   styleUrls: ['./pme.scss'],
})
export class AgGridDatepickerFromComponent implements AgRendererComponent {
  cellValue: string;
  changedValue: string;
  constructor() {
  }

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.cellValue = this.getValueToDisplay(params);
  }

  // gets called whenever the user gets the cell to refresh
  refresh(params: ICellRendererParams) {
    // set value into cell again
    this.cellValue = this.getValueToDisplay(params);
    return false;
  }

  onvalueChange(event) {
    this.changedValue = event;
  }

  getValue() {
    const dateFormat = 'YYYY-MM-DD';
    const currentDate = moment(Date.now()).format(dateFormat);
    const fromDate = moment(this.changedValue).format(dateFormat);
    const setFormDate =  fromDate < currentDate ? currentDate : fromDate;

    return setFormDate;
  }

  getValueToDisplay(params: ICellRendererParams) {
    this.changedValue = params.value;
    return params.value;
  }
}

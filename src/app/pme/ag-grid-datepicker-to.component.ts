import { Component } from '@angular/core';

import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

@Component({
  selector: 'ag-grid-datepicker-to',
  template: `
  <div>
    <app-datepicker [value] ='cellValue' (valueChange) ="onvalueChange($event)" [iconAfter]="'glyphicon-calendar'">
    </app-datepicker>
  </div>
  `,
   styleUrls: ['./pme.scss'],
})
export class AgGridDatepickerToComponent implements AgRendererComponent {
  cellValue: string;
  changedValue: string;
  paramsData: any;
  constructor() {
  }

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.paramsData = params.data;
    this.cellValue = this.getValueToDisplay(params);
  }

  // gets called whenever the user gets the cell to refresh
  refresh(params: ICellRendererParams) {
    // set value into cell again
    this.cellValue = this.getValueToDisplay(params);
    return false;
  }

  onvalueChange(event) {
    // this.changedValue = this.paramsData.price_valid_from > event ? this.paramsData.price_valid_from : event;
    this.changedValue = event;
  }

  getValue() {
    return this.changedValue;
  }

  getValueToDisplay(params: ICellRendererParams) {
    this.changedValue = params.value;
    return params.value;
  }
}

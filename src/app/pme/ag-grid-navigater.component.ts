import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';



@Component({
  selector: 'ag-grid-navigater',
  template: `
  <div (click)="onNavigate()" style="cursor: pointer;">
  {{ cellValue }}
  </div>
  `,
   styleUrls: ['./pme.scss'],
})
export class AgGridNavigaterComponent implements AgRendererComponent {
  isOpen: boolean = false;
  cellValue: string;
  constructor(private router: Router) {
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

  onNavigate() {
    this.router.navigate(['/desk', 'pme', 'manage', this.cellValue]);
  }


  getValueToDisplay(params: ICellRendererParams) {
    return params.data.item_id;
  }
}

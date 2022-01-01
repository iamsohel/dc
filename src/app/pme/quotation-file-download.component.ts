import { Component } from '@angular/core';

import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';

import { PmeService } from './pme-management.service';

@Component({
  selector: 'quotation-file-download',
  template: `
    <button *ngIf="displayDownload"
      (click)="onFileDownload(id)"
      type="submit"
      class="btn btn-success pull-right"
      style="width:70px; height: 30px;font-size: xx-small;padding: 2px;max-width:70px;text-align: center;"
    >
      Download
    </button>
  `,
  styleUrls: ['./pme.scss'],
})
export class QuotationFileDownloadComponent implements AgRendererComponent {
  isOpen: boolean = false;
  id: string;
  displayDownload: boolean = false;
  constructor(private pmeService: PmeService) {}

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.id = this.getValueToDisplay(params);
    this.displayDownload = (params.data.quote_type === 'distributed' && params.data.status === 'Completed') ;
  }

  // gets called whenever the user gets the cell to refresh
  refresh(params: ICellRendererParams) {
    // set value into cell again
    this.id = this.getValueToDisplay(params);
    return false;
  }

  onFileDownload(id: string) {
    this.pmeService.downloadQuotation(id).subscribe((data) => {
      let link = document.createElement('a');

      link.target = '_blank';
      link.href = 'data:attachment/csv;charset=utf-8,' + encodeURI(data);
      link.download = 'quotation.csv';
      link.click();
    });
  }

  getValueToDisplay(params: ICellRendererParams) {
    return params.data.quote_case_id;
  }
}

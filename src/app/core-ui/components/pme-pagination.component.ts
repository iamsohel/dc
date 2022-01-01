import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-pme-pagination',
  template: `
    <div class="btn-toolbar pull-right" role="toolbar">
      <div class="btn-group btn-group-tight" role="group">
        <button
          type="button"
          class="btn btn-link"
          *ngIf="pageSize.value !== -1"
          (click)="page.setValue(page.value - 1)"
          [disabled]="page.value === 1"
        >
          <i class="glyphicon glyphicon-arrow-left"></i>
        </button>
        <span class="btn btn-text"
        *ngIf="pageSize.value !== -1"
          >{{ (page.value - 1) * pageSize.value + 1 }} - {{ (page.value - 1) * pageSize.value + currentPageSize }}</span
        >
        <button
          type="button"
          class="btn btn-link"
          *ngIf="pageSize.value !== -1"
          (click)="page.setValue(page.value + 1)"
          [disabled]="page.value * pageSize.value >= rowsCount"
        >
          <i class="glyphicon glyphicon-arrow-right"></i>
        </button>
        <div class="btn-group">
          <button
            class="btn btn-link dropdown-toggle"
            type="button"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {{ pageSize.value !== -1 ? pageSize.value : 'All'}} per page
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu">
            <li *ngFor="let value of pageSizeOptions" class="link" [ngClass]="{ active: pageSize.value === value }">
              <a (click)="setPageSize(value)">{{ value !== -1 ? value : "All" }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class PmePaginationComponent implements OnInit {
  @Input() page: FormControl;
  @Input() pageSize: FormControl;
  @Input() currentPageSize: number = 0;
  @Input() rowsCount: number;
  @Input() hasAllOption?: boolean = false;
  pageSizeOptions = [10, 20, 50, 100, 500, 1000];

  ngOnInit(): void {
    if (this.hasAllOption) {
      this.pageSizeOptions.push(-1);
    }
  }

  setPageSize(value: number) {
    this.pageSize.setValue(value);
    this.page.setValue(1);
  }
}

import { Component } from '@angular/core';

import { ITooltipAngularComp } from '@ag-grid-community/angular';

@Component({
    selector: 'table-header-tooltip-component',
    template: `
<div class="tooltip-inner" *ngIf="isHeader && !_isGroupedHeader && !!_valueToDisplay">
  <div>
    <ng-container *ngIf="!!_valueToDisplay.uniqueCount">
        <table class='graph-info'>
          <tr>
            <td>Name</td>
            <td>{{_valueToDisplay.columnName}}</td>
          </tr>
          <tr>
            <td>Unique vals</td>
            <td>{{_valueToDisplay.uniqueCount | number: '1.0' }}</td>
          </tr>
        </table>
    </ng-container>
    <ng-container *ngIf="!_valueToDisplay.uniqueCount">
        <table class='graph-info'>
          <tr>
            <td>Name</td>
            <td>{{_valueToDisplay.columnName}}</td>
          </tr>
          <tr>
            <td>Min</td>
            <td>{{_valueToDisplay.min | number: '1.0-3'}}</td>
          </tr>
          <tr>
            <td>Max</td>
            <td>{{_valueToDisplay.max | number: '1.0-3'}}</td>
          </tr>
          <tr>
            <td>Avg</td>
            <td>{{_valueToDisplay.avg | number: '1.0-3'}}</td>
          </tr>
          <tr>
            <td>Std</td>
            <td>{{_valueToDisplay.std | number: '1.0-3'}}</td>
          </tr>
        </table>
    </ng-container>
  </div>
</div>
<div class="tooltip-inner" *ngIf="!isHeader && !!_valueToDisplay">
  <div [innerHtml]="_valueToDisplay"></div>
</div>
`,
    styles: [ `
:host {
    position: absolute;
    pointer-events: none;
    transition: opacity 1s;
}
:host.ag-tooltip-hiding {
 opacity: 0;
}
.tooltip-inner div {
  color: #0b3d89;
}
.tooltip-inner div table.graph-info {
  color: #0b3d89;
  text-align: left;
  font-size: 0.9em;
  font-weight: 600;
}
.tooltip-inner div table.graph-info td {
  padding: 5px;
}
`,
    ],
})
export class TableHeaderTooltipComponent implements ITooltipAngularComp {
    private _valueToDisplay: any = null;
    private isHeader: boolean;
    private _isGroupedHeader: boolean;

    agInit(params: any): void {
        this.isHeader = params.rowIndex === undefined;
        this._isGroupedHeader = !!params.colDef.children;
        if (!!params.value) {
          this._valueToDisplay = this.isHeader
                                 ? this.getValueForHeader(params.value)
                                 : params.value;
        }

        if (typeof this._valueToDisplay === 'string') {
          this.isHeader = false; //we don't need to show the tabular data even if it's a header
        }
    }

    getValueForHeader(val: string): any {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
}

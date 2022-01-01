import { DecimalPipe } from '@angular/common';

import config from '../config';
import { IBackendList } from '../core/interfaces/common.interface';

import { IDataset } from './dataset.interface';
import { ITable, ITableColumn, ITableColumnStats } from './table.interface';

export class TableViewCommon {
  table: ITable;
  tableDataset: IBackendList<IDataset>;
  tableStatisticTooltips: {[key: string]: string } = {};
  private readonly decimalPipe: DecimalPipe = new DecimalPipe('en-US');

  protected fillStatisticTooltips(status: string) {
    this.table && this.table.columns.map((col: ITableColumn) => {
      this.tableStatisticTooltips[col.name] = config.tableStats.status.labels[status] || status;
    });
  }

  protected _getTableColumnStatisticTooltipContent(tableColumnStatistic: ITableColumnStats): string {
    if (tableColumnStatistic.uniqueCount) { // categorical
      return `
        <table class='graph-info'>
          <tr><td>Name</td><td>${tableColumnStatistic.columnName}</td></tr>
          <tr><td>Unique vals</td><td>${this.decimalPipe.transform(tableColumnStatistic.uniqueCount, '1.0')}</td></tr>
        </table>
      `;
    }
    return `
      <table class='graph-info'>
        <tr><td>Name</td><td>${tableColumnStatistic.columnName}</td></tr>
        <tr><td>Min</td><td>${this.decimalPipe.transform(tableColumnStatistic.min, '1.0-3')}</td></tr>
        <tr><td>Max</td><td>${this.decimalPipe.transform(tableColumnStatistic.max, '1.0-3')}</td></tr>
        <tr><td>Avg</td><td>${this.decimalPipe.transform(tableColumnStatistic.avg, '1.0-3')}</td></tr>
        <tr><td>Std</td><td>${this.decimalPipe.transform(tableColumnStatistic.std, '1.0-3')}</td></tr>
        <!-- tr><td>Std Population</td><td>${tableColumnStatistic.stdPopulation}</td></tr -->
        <!-- tr><td>Median</td><td>${this.decimalPipe.transform(tableColumnStatistic.median, '1.0-3')}</td></tr -->
      </table>
    `;
  }

}

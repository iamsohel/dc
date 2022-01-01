import { DecimalPipe } from '@angular/common';
import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy } from '@angular/core';

import * as Chart from 'chart.js';
import * as _ from 'lodash';

import { ITable, ITableColumn, ITableColumnHistogram, ITableColumnHistogramRow } from './table.interface';

const DESIRED_HISTOGRAM_SIZE = 12;

@Directive({
  selector: '[table-column-histogram]',
})
export class TableColumnHistogramDirective implements OnChanges, OnDestroy {
  @Input('table-column-histogram') histogram: ITableColumnHistogram;
  @Input('table-column') column: ITableColumn;

  private readonly el: HTMLCanvasElement;
  private chartConfig: Chart.ChartConfiguration;
  private chart: Chart;
  private decimalPipe: DecimalPipe = new DecimalPipe('en-US');

  constructor(
    el: ElementRef,
    private zone: NgZone,
  ) {
    this.el = el.nativeElement;
  }

  ngOnChanges() {
    const isContinuous = this.column.variableType === ITable.ColumnVariableType.CONTINUOUS;

    const compacted = this._compactHistogram(this.histogram, isContinuous);
    const data = compacted.map(row => row.count);
    const labels = isContinuous
      ? compacted.map(_ => _.min).concat([_.last(compacted).max]).map(_ => this._formatFloat(_))
      : compacted.map(row => {
        if (row.value == null) {
          return 'Other...';
        }
        switch (this.column.dataType) {
          case ITable.ColumnDataType.DOUBLE:
            return this._formatFloat(<number> row.value);
          case ITable.ColumnDataType.INTEGER:
          case ITable.ColumnDataType.LONG:
            return row.value.toString();
          default:
            return String(row.value);
        }
      });

    this.chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          borderWidth: 0,
          backgroundColor: '#0d47a1',
          data,
        }],
      },
      options: {
        scales: {
          xAxes: isContinuous
            ? [
              {
                display: false,
                categoryPercentage: 1,
                barPercentage: 1,
                ticks: {
                  max: _.last(labels.slice(0, -1)),
                  maxRotation: 90,
                  minRotation: 0,
                },
              },
              {
                display: true,
                gridLines: {
                  drawOnChartArea: false,
                },
                ticks: {
                  autoSkip: false,
                  max: _.last(labels),
                },
              },
            ]
            : [
              {
                categoryPercentage: 1,
                barPercentage: 1,
                gridLines: {
                  offsetGridLines: false,
                  drawOnChartArea: false,
                },
                ticks: {
                  autoSkip: false,
                  maxRotation: 90,
                  minRotation: 0,
                },
              },
            ],
          yAxes: [{
            //type: 'logarithmic',
            ticks: {
              min: 0,
            },
          }],
        },
        tooltips: <Chart.ChartTooltipOptions> {
          callbacks: isContinuous ? {
            title: (tooltip) => tooltip.map(i => `${labels[i.index]} - ${labels[i.index + 1]}`).join(''),
          } : {},
          mode: 'x',
          intersect: false,
        },
        elements: {
          rectangle: {
            borderWidth: 2,
          },
        },
        responsive: true,
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'histogram',
        },
      },
    };

    this.zone.runOutsideAngular(() => {
      this.chart && this.chart.destroy();
      this.chart = new Chart(this.el, this.chartConfig);
    });
  }

  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => {
      this.chart && this.chart.destroy();
    });
  }

  private _compactHistogram(histogram: ITableColumnHistogram, isContinuous: boolean): ITableColumnHistogram {
    if (isContinuous) {
      const chunks: ITableColumnHistogramRow[][] = _.chunk(histogram, Math.ceil(histogram.length / DESIRED_HISTOGRAM_SIZE));
      return chunks.map<ITableColumnHistogramRow>(rows => {
        return {
          count: _.sumBy(rows, _ => _.count),
          min: _.minBy(rows, _ => _.min).min,
          max: _.maxBy(rows, _ => _.max).max,
        };
      });
    } else {
      if (histogram.length <= DESIRED_HISTOGRAM_SIZE) {
        return histogram;
      }
      /* Since null == undefined is true, the following statements will catch both null and undefined */
      const known = _.sortBy(histogram.filter(_ => _.value != null), _ => -_.count);
      const taken = _.take(known, DESIRED_HISTOGRAM_SIZE - 1);
      const otherCount = _.sumBy([
        ..._.drop(known, DESIRED_HISTOGRAM_SIZE - 1),
        ...histogram.filter(_ => _.value == null),
      ], _ => _.count);
      return [...taken, {value: null, count: otherCount}];
    }
  }

  private _formatFloat(value: number): string {
    return this.decimalPipe.transform(value, '1.0-2');
  }
}

import { Component, HostBinding, Input, Pipe, PipeTransform } from '@angular/core';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';

import { DashboardEditState, IColumnInfo } from './dashboard-edit-state';
import { IDashboard } from './dashboard.interface';
import { TabularDataRequest } from './visualize.interface';

@Pipe({ name: 'metricslist' })
export class MetricsListPipe implements PipeTransform {
  transform(items: IColumnInfo[], metrics: TabularDataRequest.Aggregation[]): (IColumnInfo & { type: IDashboard.DashboardAggregationType })[] {
    return items.map(item => {
      const foundMetric = metrics.find(metric => metric.columnName === item.name);
      return {
        ...item,
        type: foundMetric ? foundMetric.aggregator : null,
      };
    });
  }
}

@Pipe({ name: 'attributeslist' })
export class AttributesListPipe implements PipeTransform {
  transform(items: IColumnInfo[], attributes: string[]): (IColumnInfo & { isActive: boolean })[] {
    return items.map(item => {
      const isActive = !!attributes.find(attribute => attribute === item.name);
      return {
        ...item,
        isActive,
      };
    });
  }
}

@Component({
  selector: 'chart-edit-context',
  template: `
    <ul class="nav nav-stacked" *ngIf="state.widgetForm">
      <li class="open">
        <a class="brand-background">
          <i class="glyphicon glyphicon-menu-left"
            (click)="state.navigateBack()" title="Back to Dashboard Layout"></i>
          <span>{{state.widgetForm.controls['name'].value}}</span>
          <i class="iconapp iconapp-visuals"></i>
        </a>
      </li>
      <li class="has-submenu" [ngClass]="{'open': menuOpen[0]}">
        <a (click)="menuOpen[0] = !menuOpen[0]">
          <i class="glyphicon glyphicon-th-list"></i>
          <span>Input</span>
        </a>
        <ul class="nav nav-pills submenu with-dropdown">
          <li *ngFor="let item of state.tableList" [ngClass]="{'active': item && state.isCurrentTable(item.id)}">
            <span class="dropdown pull-right">
              <a (click)="state.setWidgetTable(item.id)">
                <i [ngClass]="{'glyphicon glyphicon-ok': state.isCurrentTable(item.id)}"></i>
              </a>
            </span>
            <a class="dot-iconapp iconapp-tables"
              (click)="state.setWidgetTable(item.id)"
              [title]="item.name">
              {{item.name}}
            </a>
          </li>
          <li *ngFor="let item of state.modelList" [ngClass]="{'active': item && state.isCurrentModel(item.id)}">
            <span class="dropdown pull-right">
              <a (click)="state.setWidgetModel(item.id)">
                <i [ngClass]="{'glyphicon glyphicon-ok': state.isCurrentModel(item.id)}"></i>
              </a>
            </span>
            <a class="dot-iconapp iconapp-models"
              (click)="state.setWidgetModel(item.id)"
              [title]="item.name">
              {{item.name}}
            </a>
          </li>
          <li *ngIf="!state.tableList.length && !state.modelList.length"><a>No inputs available</a></li>
        </ul>
      </li>
      <li metrics-list-submenu
        [metrics]="state.metrList | metricslist : state.widgetForm.controls.metrics.value"
        (onMetricSet)="state.setMetric($event.name, $event.type || null)"
      ></li>
      <li attributes-list-submenu
        [attributes]="state.attrList | attributeslist : state.widgetForm.controls.attributes.value"
        (onAttributeToggle)="state.toggleAttribute($event.name, !$event.active)"
      ></li>
    </ul>`,
})
export class ChartEditContextComponent {
  @Input() state: DashboardEditState;
  @HostBinding('class') classes = 'glued';
  readonly types = AppSelectOptionData.fromList(config.chart.options.aggregationType.list, config.chart.options.aggregationType.labels);
  menuOpen: boolean[] = [true, true, true];
}

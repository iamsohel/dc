import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';

import { IColumnInfo } from './dashboard-edit-state';
import { IDashboard } from './dashboard.interface';

@Component({
  //tslint:disable-next-line:component-selector
  selector: 'li[metrics-list-submenu]',
  template: `
    <a (click)="collapsed = !collapsed">
      <i class="glyphicon glyphicon-stats"></i>
      <span>Metrics</span>
    </a>
    <ul class="nav nav-pills submenu with-dropdown tiny">
      <li *ngFor="let item of metrics"
        [ngClass]="{'active': !!item.type}">
            <span class="dropdown pull-right" dropdown>
              <a data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                <i class="glyphicon glyphicon-option-horizontal"></i>
              </a>
              <ul class="dropdown-menu">
                <li *ngFor="let type of types" [ngClass]="{'active': item.type === type.id}">
                  <a class="dropdown-item link" (click)="onMetricSet.emit({name: item.name, type: type.id})">
                    {{type.text}}
                  </a>
                </li>
                <ng-template [ngIf]="!!item.type">
                  <li role="separator" class="divider"></li>
                  <li><a (click)="onMetricSet.emit({name: item.name})" class="dropdown-item link">Remove</a></li>
                </ng-template>
              </ul>
            </span>
        <a *ngIf="!item.type" [title]="item.displayName">
          {{item.displayName}}
        </a>
        <a *ngIf="!!item.type" [title]="item.displayName">
          {{item.type}}({{item.displayName}})
        </a>
      </li>
      <li *ngIf="!metrics.length"><a>No Metrics Available</a></li>
    </ul>
  `,
})
export class MetricsListComponent {
  @Input() metrics: (IColumnInfo & { type: IDashboard.DashboardAggregationType })[];
  @HostBinding('class') get class() { return 'has-submenu' + (this.collapsed ? '' : ' open'); }
  @Output() onMetricSet = new EventEmitter<{name: string, type?: IDashboard.DashboardAggregationType}>();
  readonly types = AppSelectOptionData.fromList(config.chart.options.aggregationType.list, config.chart.options.aggregationType.labels);
  collapsed: boolean = false;
}

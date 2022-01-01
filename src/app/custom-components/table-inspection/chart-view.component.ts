import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import config from '../../config';
import { TTableValue } from '../../tables/table.interface';
import { AppFormGroup } from '../../utils/forms';
import { MiscUtils } from '../../utils/misc';
import { ChartAbstract } from '../../visualize/chart.abstract';
import { ChartFactory } from '../../visualize/chart.factory';
import { ChartOptionsAbstract } from '../../visualize/charts/chart-options';
import { DashboardCharts } from '../../visualize/charts/chart.interfaces';
import { IColumnInfo, TWidgetFormGroup } from '../../visualize/dashboard-edit-state';
import { IDashboard, IDashboardWidget } from '../../visualize/dashboard.interface';
import { TabularDataRequest, TabularDataResponse } from '../../visualize/visualize.interface';

@Component({
  selector: 'table-inspection-chart-view',
  template: `
    <div class="panel panel-primary">
      <div class="panel-heading">
        <app-check
          [class]="'inline'"
          [(checked)]="_enabled"
          (checkedChange)="syncFromFormValue(widgetForm.value)"
          label="Charting"
        ></app-check>
      </div>
      <div class="panel-body" [hidden]="!_enabled">
        <div class="row">
          <div class="col-md-2 left-side" style="min-height:450px;">
            <div class="menu" style="margin-top: 0px">
              <ul class="nav nav-stacked">
                <li metrics-list-submenu
                  [metrics]="metrics | apply: _getMetricsList: widgetForm.controls.metrics.value"
                  (onMetricSet)="_selectMetric($event)"
                ></li>
                <li attributes-list-submenu
                  [attributes]="attributes | apply: _getAttributesList: widgetForm.controls.attributes.value"
                  (onAttributeToggle)="_toggleAttribute($event)"
                ></li>
              </ul>
            </div>
          </div>
          <div class="col-md-5" [hidden]="_chartExpanded">
            <div class="tabpanel">
              <!-- Nav tabs -->
              <ul class="nav nav-tabs" role="tablist">
                <li role="presentation" [ngClass]="{'active': _activeTab === 0}">
                  <a (click)="_activeTab = 0">Basics</a>
                </li>
                <li role="presentation" [ngClass]="{'active': _activeTab === 1}">
                  <a (click)="_activeTab = 1">Options</a>
                </li>
                <li
                  role="presentation" [ngClass]="{'active': _activeTab === 3}">
                  <a (click)="_activeTab = 3">Grouping</a>
                </li>
              </ul>
            </div>
            <div class="panel panel-default" [hidden]="_activeTab !== 0">
              <div class="panel-body">
                <table-inspection-chart-basics
                  [type]="widgetForm.controls.type.value"
                  (typeChange)="widgetForm.controls.type.setValue($event)"
                  [selectedMetrics]="widgetForm.controls.metrics.value"
                  (selectedMetricsChange)="widgetForm.controls.metrics.setValue($event)"
                  (selectedAttributesChange)="widgetForm.controls.attributes.setValue($event)"
                  [selectedAttributes]="widgetForm.controls.attributes.value"
                ></table-inspection-chart-basics>
              </div>
            </div>
            <div class="panel panel-default" [hidden]="_activeTab !== 1">
              <div class="panel-body">
                <div #chartOptions></div>
              </div>
            </div>
            <div class="panel panel-default" [hidden]="_activeTab !== 3">
              <chart-edit-groups
                [widgetForm]="widgetForm"
                [widgetAttributeColumns]="attributes | apply: _getWidgetAttributesColumns: widgetForm.controls.attributes.value"
                [columnValuesLoader]="columnValuesLoader"
              ></chart-edit-groups>
            </div>
          </div>
          <div style="padding-left: 0px;" [ngClass]="{ 'col-md-5': !_chartExpanded, 'col-md-10': _chartExpanded }">
            <div class="p-Widget p-DockPanel" style="margin-bottom: 10px;">
              <div class="p-Widget p-SplitDockTab p-DockPanel-tab">
                <div title="" class="p-SplitDockTab-tab p-mod-current p-mod-closable">
                  <div class="p-SplitDockTab-tabExpandIcon" (click)="_toggleExpandChart()"></div>
                  <div class="p-SplitDockTab-tabLabel"></div>
                </div>
              </div>
              <div class="p-Widget p-DockPanel-widget" style="height: 350px; min-width: auto;">
                <div #widgetPlaceholder></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TableInspectionChartViewComponent implements OnInit {
  readonly config = config;
  @Input() metrics: { name: string, displayName: string, type: IDashboard.DashboardAggregationType }[];
  @Input() attributes: { name: string, displayName: string, isActive: boolean }[];
  @Input() columnValuesLoader: (col: string) => Observable<{columnName: string; values: TTableValue[]}>;
  @Input() aggregatedDataLoader: (request: TabularDataRequest) => Observable<TabularDataResponse>;
  @ViewChild('widgetPlaceholder', { read: ViewContainerRef }) private widgetPlaceholder: ViewContainerRef;
  @ViewChild('chartOptions', { read: ViewContainerRef }) private chartOptions: ViewContainerRef;
  private widgetForm: TWidgetFormGroup = new AppFormGroup({
    input: new FormControl(null),
    type: new FormControl(IDashboard.DashboardChartType.LINE, Validators.required),
    name: new FormControl(null),
    chartFilters: new FormControl([]),
    filters: new FormControl([]),
    generators: new FormControl([]),
    chartGenerators: new FormControl([]),
    metrics: new FormControl([]),
    attributes: new FormControl([]),
    options: new FormControl(DashboardCharts.defaultChartOptions),
    guid: new FormControl(null, Validators.required),
    groups: new FormControl([]),
  });

  private _activeTab: number = 0;
  private _enabled: boolean = false;
  private _chartExpanded: boolean = false;

  private formSubscription: Subscription;

  private compRef: ComponentRef<ChartAbstract<any>>;
  private optsRef: ComponentRef<ChartOptionsAbstract>; //@TODO make common
  private groupsForm: FormArray = new FormArray([
    new FormGroup({
      columnName: new FormControl(null, Validators.required),
      mergedValue: new FormControl(null, Validators.required),
      values: new FormControl([], Validators.minLength(1)),
    }),
  ]);
  private _compRefFiltersSubscription: Subscription;


  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {
  }

  public ngOnInit(): void {
    this.formSubscription && this.formSubscription.unsubscribe();
    this.formSubscription = MiscUtils
      .distinctUntilChangedDeep(this.widgetForm.valueChanges)
      .debounceTime(100).subscribe(_ => this.syncFromFormValue(_));

    this.syncFromFormValue(this.widgetForm.value);
  }

  private syncFromFormValue(widget: IDashboardWidget) {
    if (!this._enabled) {
      return;
    }
    const oldConfig = this.compRef ? this.compRef.instance.config : null;
    const newConfig: IDashboardWidget = _.cloneDeep(widget);

    MiscUtils.fillForm(this.groupsForm, newConfig.groups);

    // change replace ComponentWidget to another
    if (!oldConfig || !_.isEqual(oldConfig.type, newConfig.type)) {
      this.compRef && this.compRef.destroy();
      this.compRef = ChartFactory.createComponentInstance(
        this.widgetPlaceholder,
        this.componentFactoryResolver,
        _.cloneDeep(newConfig),
        this.aggregatedDataLoader,
      );
      this.optsRef && this.optsRef.destroy();
      this.optsRef = ChartFactory.createOptionsComponentInstance(
        this.chartOptions,
        this.componentFactoryResolver,
        this.widgetForm.value.type,
        this.widgetForm.value.options,
        this.attributes,
      );
      if (this.optsRef) {
        this.optsRef.instance.onOptionsChange.subscribe(options => {
          this.widgetForm.controls.options.setValue(options);
        });
      }
      this._compRefFiltersSubscription && this._compRefFiltersSubscription.unsubscribe();
      this._compRefFiltersSubscription = this.compRef.instance.filtersChange.asObservable().subscribe(filters => {
        this.widgetForm.controls['filters'].setValue(filters, { emitEvent: false });
      });
    } else if (this.compRef) {
      this.compRef.instance.config = _.cloneDeep(newConfig);
    }
  }

  private _selectMetric(data: {name: string, type?: IDashboard.DashboardAggregationType}) {
    const selectedMetrics = this.widgetForm.controls.metrics.value as TabularDataRequest.Aggregation[];
    const selected = selectedMetrics.find(m => m.columnName === data.name);
    if (!data.type && selected) {
      this.widgetForm.controls.metrics.setValue(selectedMetrics.filter(m => m.columnName !== data.name));
    } else if (data.type) {
      if (!selected) {
        this.widgetForm.controls.metrics.setValue([...selectedMetrics, {resultColumnName: data.name, columnName: data.name, aggregator: data.type}]);
      } else {
        this.widgetForm.controls.metrics.setValue(selectedMetrics.map(
          m => m.columnName === data.name ? {...m, aggregator: data.type} : m,
        ));
      }
    }
  }

  private _toggleAttribute(data: {name: string, active: boolean}) {
    const selectedAttributes = this.widgetForm.controls.attributes.value as string[];
    const selected = selectedAttributes.includes(data.name);
    if (data.active && !selected) {
      this.widgetForm.controls.attributes.setValue([...selectedAttributes, data.name]);
    } else if (!data.active && selected) {
      this.widgetForm.controls.attributes.setValue(selectedAttributes.filter(_ => _ !== data.name));
    }
  }

  private _getMetricsList(metrics: IColumnInfo[], selectedMetrics: TabularDataRequest.Aggregation[]) {
    return metrics.map(m => {
      const foundMetric = selectedMetrics.find(_ => _.columnName === m.name);
      return {...m, type: foundMetric ? foundMetric.aggregator : null};
    });
  }

  private _getAttributesList(attributes: IColumnInfo[], selectedAttributes: string[]) {
    return attributes.map(a => {
      return {...a, isActive: !!selectedAttributes.find(_ => _ === a.name)};
    });
  }

  private _getWidgetAttributesColumns(columns: IColumnInfo[], widgetAttributes: string[]): IColumnInfo[] {
    return columns.filter(c => widgetAttributes.includes(c.name));
  }

  private _toggleExpandChart() {
    this._chartExpanded = !this._chartExpanded;
    if (this.compRef) {
      setTimeout(() => {
        this.compRef.instance.refresh();
      }, 0);
    }
  }
}

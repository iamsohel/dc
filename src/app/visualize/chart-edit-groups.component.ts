import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { ITableColumn, TTableValue } from '../tables/table.interface';
import { AppFormArray, AppFormGroup } from '../utils/forms';
import { MiscUtils } from '../utils/misc';
import { ReactiveLoader } from '../utils/reactive-loader';

import { TWidgetFormGroup } from './dashboard-edit-state';
import { IDashboardWidget } from './dashboard.interface';
import { TabularDataRequest } from './visualize.interface';

interface ITableValuesCache {
  columnName: string;
  values: TTableValue[];
}

type GroupForm = AppFormGroup<{columnName: FormControl, mergedValue: FormControl, values: FormControl}>;

@Component({
  selector: 'chart-edit-groups',
  template: `
    <app-spinner [visibility]="_valuesLoader.active | async"></app-spinner>
    <div *ngIf="_valuesLoader.loaded" class="panel-body">
      <div class="row pt5">
        <div class="col-xs-6">
          <app-select [label]="'Attribute'" [control]="attributeControl"
            [options]="widgetAttributeColumns | tableColumnSelectOptions"></app-select>
        </div>
        <div class="col-xs-6">
          <button class="btn btn-default btn-block" (click)="addGroup(attributeControl.value)"
            [disabled]="!attributeControl.value"
            title="Add Group">Add Group
            <i class="glyphicon glyphicon-plus"></i>
          </button>
        </div>
      </div>
      <div class="row pt5" *ngFor="let controlGroup of groupsForm.controls; let j = index">
        <ng-template [ngIf]="controlGroup.controls.columnName.value">
          <div class="col-xs-6">
            <app-input [value]="controlGroup.controls.columnName.value" [readonly]="true"></app-input>
          </div>
          <div class="col-xs-6">
            <app-input [control]="controlGroup.controls.mergedValue"></app-input>
          </div>
          <div class="col-xs-10">
            <app-select
              [multiple]="true"
              [control]="controlGroup.controls.values"
              [options]="findAttrValues(controlGroup.controls.columnName.value)"></app-select>
          </div>
          <div class="col-xs-2">
            <button class="btn btn-default pull-right" (click)="groupsForm.removeAt(j)"
              title="Remove Group">
              <i class="glyphicon glyphicon-remove"></i>
            </button>
          </div>
        </ng-template>
      </div>
      <button class="btn btn-block btn-primary" [disabled]="groupsForm.invalid" (click)="fillWidgetForm()">Update</button>
    </div>
  `,
})
export class ChartEditGroupsComponent implements OnChanges, OnDestroy {
  readonly config = config;
  readonly _valuesLoader: ReactiveLoader<ITableValuesCache[], string[]>;
  @Input() widgetForm: TWidgetFormGroup;
  @Input() widgetAttributeColumns: ITableColumn[] = [];
  @Input() columnValuesLoader: (attribute: string) => Observable<ITableValuesCache>;
  attributeControl = new FormControl(null);
  groupsForm: AppFormArray<GroupForm> = new AppFormArray(<GroupForm[]> []);
  private formGroupsSubscription: Subscription;
  private formAttributesSubscription: Subscription;
  private uniqueValues: ITableValuesCache[] = [];

  constructor(
  ) {
    // todo: remove loader here
    this._valuesLoader = new ReactiveLoader((attributes: string[]): Observable<ITableValuesCache[]> => {
      const currentCache = this.uniqueValues;
      const uncachedAttributes = attributes.filter(attribute => {
        return !currentCache.find(_ => _.columnName === attribute);
      });

      if (!uncachedAttributes.length) {
        return of(currentCache);
      }

      const observables: Observable<ITableValuesCache>[] = uncachedAttributes.map(this.columnValuesLoader);

      return forkJoin(observables).map(values => {
        return currentCache.concat(values);
      });
    });

    this._valuesLoader.subscribe(newCache => {
      this.uniqueValues = newCache;
    });
  }

  ngOnChanges() {
    // groups binding
    this.formGroupsSubscription = this.widgetForm.controls.groups.valueChanges.subscribe((groups: TabularDataRequest.MergeGroup[]) => {
      MiscUtils.fillForm(this.groupsForm, groups);
    });
    MiscUtils.fillForm(this.groupsForm, (<IDashboardWidget> this.widgetForm.value).groups);

    // attributes binding
    this.formAttributesSubscription = this.widgetForm.controls.attributes.valueChanges.subscribe((attributes: string[]) => {
      this._valuesLoader.load(attributes);
      MiscUtils.fillForm(this.groupsForm, []);
      this.fillWidgetForm();
    });
    this._valuesLoader.load(this.widgetForm.controls['attributes'].value);
  }

  ngOnDestroy() {
    this.formGroupsSubscription && this.formGroupsSubscription.unsubscribe();
    this.formAttributesSubscription && this.formAttributesSubscription.unsubscribe();
  }

  addGroup(attribute: string) {
    this.groupsForm.push(this.newGroupForm(attribute));
  }

  newGroupForm(attribute: string): GroupForm {
    return new AppFormGroup({
      columnName: new FormControl(attribute, Validators.required),
      mergedValue: new FormControl(null, Validators.required),
      values: new FormControl([], Validators.minLength(1)),
    });
  }

  findAttrValues(attr: string): TTableValue[] {
    const valuesCache = this.uniqueValues.find(_ => _.columnName === attr);
    return valuesCache ? valuesCache.values : [];
  }

  fillWidgetForm() {
    if (this.groupsForm.valid) {
      this.widgetForm.controls.groups.setValue(this.groupsForm.value);
    }
  }
}

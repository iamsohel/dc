import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { empty } from 'rxjs/observable/empty';
import { Subscription } from 'rxjs/Subscription';

import { ReactiveLoader } from '../../utils/reactive-loader';
require('bootstrap-multiselect');

export interface AppSelectOptionData<T extends AppSelectOptionData.IdType = AppSelectOptionData.IdType> {
  id: T;
  text?: string;
  disabled?: boolean;
  children?: AppSelectOptionData[];
}

interface InternalSelectOptionDataFlat {
  value: AppSelectOptionData.IdType;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

interface InternalSelectOptionData extends InternalSelectOptionDataFlat {
  children?: InternalSelectOptionDataFlat[];
}

export namespace AppSelectOptionData {
  export type IdType = string | number | boolean;

  export function isOptionData(x: any): x is AppSelectOptionData {
    return x && x.hasOwnProperty('id');
  }

  export const fromList = <T extends IdType>(
    list: T[],
    labels?: string[] | { [key: string]: string },
    disabled?: { [key: string]: boolean },
  ): AppSelectOptionData[] => {
    if (Array.isArray(labels)) {
      return list.map((id, idx): AppSelectOptionData => {
        return { id: id, text: labels[idx] || String(id), disabled: !!(disabled && disabled[String(id)]) };
      });
    } else if (labels) {
      return list.map((id): AppSelectOptionData => {
        return { id: id, text: labels[String(id)] || String(id), disabled: !!(disabled && disabled[String(id)]) };
      });
    } else {
      return list.map((id): AppSelectOptionData => {
        return { id: id, text: String(id), disabled: !!(disabled && disabled[String(id)]) };
      });
    }
  };

  export const fromDict = (dict: {[key: string]: string}): AppSelectOptionData<string>[] => {
    return Object.keys(dict).map((id) => {
      return { id: id, text: dict[id] };
    });
  };
}

export type AppSelectValueType = AppSelectOptionData.IdType | AppSelectOptionData.IdType[];

export type AppSelectOptionsType = (AppSelectOptionData | AppSelectOptionData.IdType)[];

export type AppSelectOptionsProvider = () => Observable<AppSelectOptionsType>;

@Component({
  selector: 'app-datalist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="form-group p0"
      [formControlValidator]="control"
      [ngClass]="{
        'dropdown-overflow-fix': this.fixOverflowClipping
      }"
    >
      <div class="input-group" [ngClass]="{'has-label': label}">
        <label class="input-group-addon input-group-label text-truncate"
          *ngIf="label || iconBefore || helpText"
          tooltip
          data-toggle="tooltip"
          [tooltipTitle]="label"
          [ngClass]="{'disabled': disabled || control?.disabled, 'label-bare': !label}">
          <i *ngIf="iconBefore" class="glyphicon" [ngClass]="iconBefore"></i>
          {{label}}<i *ngIf="helpText"
            class="helpText glyphicon glyphicon-question-sign icon-suffix"
            tooltip
            data-toggle="tooltip"
            data-html="true"
            data-placement="top"
            [tooltipTitle]="helpText"
          ></i></label>
          <!-- <app-input (valueChange)="onChange($event)" > </app-input> -->
          <input type="text" class="datalist-input" [attr.list]="datalistId" (change)="onChange($event)" />
          <datalist [id]="datalistId">
            <option *ngFor="let item of options" [value]="item.id">{{item.text}}</option>
          </datalist>
        <!-- <span [ngClass]="{'disabled': disabled || control?.disabled}" class="input-group-addon" (click)="activateSelect($event)">
          <i class="glyphicon" [ngClass]="{'glyphicon-th': multiple, 'glyphicon-chevron-down': !multiple}"></i>
        </span> -->
      </div>
      <div class="pt5" *ngIf="showErrors && !!control" [formControlValidatorFeedback]="control"></div>
    </div>
  `,
})
export class AppDataListComponent implements OnDestroy, AfterViewInit, OnChanges {
  @Input() value: AppSelectValueType;
  @Input() disabled: boolean = false;
  @Input() showErrors: boolean = true;
  @Input() label: string;
  @Input() multiple: boolean = false;
  @Input() allowNull: boolean = false;
  @Input() placeholder: string = '-Select-';
  @Input() control: FormControl;
  @Input() options: any = [];
  @Input() optionsProvider?: AppSelectOptionsProvider = null;
  @Input() iconBefore: string;
  @Input() helpText: string;
  @Input() nullSelectedText: string = 'None';
  @Input() fixOverflowClipping: boolean = false;
  @Input() datalistId: string = 'optionList';
  @Output() valueChange = new EventEmitter<AppSelectValueType>();
  // refers to http://davidstutz.github.io/bootstrap-multiselect/

  constructor(
    private zone: NgZone,
    private el: ElementRef,
  ) {

  }

  ngOnChanges(changes: SimpleChanges) {

  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {

  }

  activateSelect(event: MouseEvent) {
    event.stopPropagation();
    jQuery(this.el.nativeElement).find('.btn-select').dropdown('toggle');
  }

  onChange(event) {
    if (event.target.value) {
      this.control.setValue(event.target.value);
      this.valueChange.emit(event.target.value);
    } else {
      this.control.reset();
    }
  }

}

import { EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Subscription } from 'rxjs/Subscription';

import { MiscUtils } from '../../utils/misc';
import { DashboardEditState, IColumnInfo } from '../dashboard-edit-state';

export abstract class ChartOptionsAbstract implements OnDestroy {
  readonly onOptionsChange = new EventEmitter<any>();
  public attributes: IColumnInfo[] = [];
  form: FormGroup;
  protected _state: DashboardEditState;
  private formSubscription: Subscription;

  ngOnDestroy() {
    this.formSubscription && this.formSubscription.unsubscribe();
  }

  public set options(options: any) {
    MiscUtils.fillForm(this.form, options);
    this.formSubscription = this.form.valueChanges.distinctUntilChanged().debounceTime(200).subscribe(value => {
      this.onOptionsChange.emit(value);
    });
  }
}

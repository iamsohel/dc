import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subscription } from 'rxjs/Subscription';

import { ExperimentCreateForm } from '../experiments/experiment-create.component';
import { IExperimentPipelineForm } from '../experiments/experiment-pipeline.component';
import { IAbstractExperimentPipeline } from '../experiments/experiment.interfaces';
import { AppFormGroup } from '../utils/forms';

@Component({
  selector: 'test-experiment-pipeline-form',
  template: `
    <app-input
      [label]="'Test Field 1'"
      [control]="form.controls.testField1"
    ></app-input>
    <app-input
      [label]="'Test Field 2'"
      [control]="form.controls.testField2"
    ></app-input>
  `,
})
export class TestExperimentPipelineFormComponent
  implements OnInit, OnDestroy, IExperimentPipelineForm<IAbstractExperimentPipeline> {
  @Input() experimentCreateForm: ExperimentCreateForm;
  @Output() validityChange = new EventEmitter<boolean>();

  form: AppFormGroup<{
    testField1: FormControl;
    testField2: FormControl;
  }>;

  private _subscription = new Subscription();

  ngOnInit(): void {
    this.form = new AppFormGroup({
      testField1: new FormControl(null, Validators.required),
      testField2: new FormControl(null),
    });

    this._onFormChanged();

    this._subscription.add(this.form.valueChanges.subscribe(() => this._onFormChanged()));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  getPipeline(): Observable<IAbstractExperimentPipeline> {
    return of(this.form.value);
  }

  private _onFormChanged(): void {
    this.validityChange.emit(this.form.valid);
  }
}

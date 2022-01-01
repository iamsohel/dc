import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import { ActivityObserver } from '../utils/activity-observer';

import { IDCProject } from './dc-project.interfaces';
import { DCProjectService } from './dc-project.service';

@Component({
  selector: 'dc-project-create',
  template: `
    <app-spinner *ngIf="!form"></app-spinner>

    <div *ngIf="form" class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 col-xl-6 col-xl-offset-3">
      <h3 class="text-center">Create DC Project</h3>
      <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit()">
        <app-input [label]="'Name'" [control]="form.controls['name']"></app-input>
        <app-description [control]="form.controls['description']" [editMode]="true"></app-description>
        <button type="submit"
          [disabled]="!form.valid || ((_savingObserver.active) | async)" class="btn btn-success pull-right">Create
        </button>
      </form>
    </div>
  `,
})
export class DCProjectCreateComponent implements OnInit, OnDestroy {
  form: FormGroup;
  readonly _savingObserver: ActivityObserver = new ActivityObserver();
  private _subscriptions: Subscription[] = [];

  constructor(
    private _router: Router,
    private _dcProjects: DCProjectService,
  ) {
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl(null),
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._subscriptions.forEach((_) => _.unsubscribe());
  }

  onSubmit() {
    const create$ = this._savingObserver
      .observe(this._dcProjects.create(this.form.value))
      .do((dcProject: IDCProject) => {
        this._router.navigate(['/desk', 'develop', 'projects', dcProject.id]);
      });

    this._subscriptions.push(create$.subscribe());
  }
}

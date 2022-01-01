import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ISubscription } from 'rxjs/Subscription';

import config from '../config';
import { TObjectId } from '../core/interfaces/common.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { AclService } from '../services/acl.service';
import { MiscUtils } from '../utils/misc';
import { ReactiveLoader } from '../utils/reactive-loader';

import { IModel } from './model.interface';
import { ModelService } from './model.service';
import { trainConfig } from './train.config';

@Component({
  selector: 'model-view',
  template: `
    <asset-operations [type]="config.asset.values.MODEL" [selectedItems]="[model]"
      (onDelete)="_onModelDeleted()"></asset-operations>
    <app-spinner [visibility]="!model"></app-spinner>
    <form *ngIf="model" [formGroup]="modelEditForm" class="brand-tab">
      <div class="row">
        <div class="col-md-6">
          <app-input [label]="'Model Name'" [control]="modelEditForm.controls['name']"></app-input>
        </div>
        <div class="col-md-6">
          <div class="btn-group pull-right" role="group">
            <button
              type="button"
              *ngIf="model?.status === IModel.Status.ACTIVE"
              [disabled]="modelEditForm.invalid || modelEditForm.disabled || modelEditForm.pristine"
              (click)="submit()"
              class="btn btn-md btn-apply"
            >
              Update
            </button>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <app-description [control]="modelEditForm.controls['description']"></app-description>
        </div>
      </div>
    </form>
    <div class="panel" *ngIf="model">
      <div class="panel-body">
        <dl>
          <ng-template [ngIf]="model.experimentId">
            <dt>Experiment</dt>
            <dd><a [routerLink]="['/desk','experiments', model.experimentId]">go to</a></dd>
          </ng-template>
          <dt>Model Type:</dt>
          <dd>{{model.dataType}}</dd>
          <dt>Model Tag:</dt>
          <dd>{{model.tag}}</dd>
        </dl>
      </div>
    </div>
  `,
})
export class ModelViewComponent implements OnInit, OnDestroy {
  readonly config = config;
  readonly trainConfig = trainConfig;
  readonly IModel = IModel;

  modelEditForm: FormGroup;
  model: IModel;

  private eventSubscription: ISubscription;
  private processSubscription: ISubscription;
  private _loader: ReactiveLoader<IModel, TObjectId>;
  private routeSubscription: ISubscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private models: ModelService,
    private events: EventService,
    private acl: AclService,
  ) {
    this.modelEditForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      description: new FormControl(null),
    });
    this.eventSubscription = this.events.subscribe((event) => {
      if (event.type === IEvent.Type.DELETE_MODEL && this.model.id === event.data.id) {
        this._onModelDeleted();
      }
    });

    this._loader = new ReactiveLoader(id => {
      return this.models.get(id);
    });

    this._loader.subscribe((model: IModel) => {
      this.setModel(model);
    });
  }

  ngOnInit() {
    this.routeSubscription = this.route.params.subscribe(params => {
      this._loader.load(params['itemId']);
    });
  }

  setModel(model: IModel) {
    this.model = model;
    this.fillModelsForm(this.modelEditForm, model);
  }

  ngOnDestroy() {
    this.processSubscription && this.processSubscription.unsubscribe();
    this.eventSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
  }

  submit() {
    const { name, description } = this.modelEditForm.value;
    this.models.update(this.model.id, { name, description }).subscribe(() => {
      this._loader.load(this.model.id);
    });
  }

  _onModelDeleted() {
    this.router.navigate(['/desk', 'train']);
  }

  private fillModelsForm(form: FormGroup, model?: any | IModel) {
    const canUpdate = this.acl.canUpdateModel(model);
    form.reset({
      name: null,
      description: null,
    });
    MiscUtils.fillForm(form, model, !canUpdate);
  }
}


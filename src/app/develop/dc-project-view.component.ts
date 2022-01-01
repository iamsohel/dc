import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { ProcessService } from '../core/services/process.service';
import { ActivityObserver } from '../utils/activity-observer';
import { ReactiveLoader } from '../utils/reactive-loader';

import {
  IDCProject,
  IDCProjectUpdate,
} from './dc-project.interfaces';
import { DCProjectService } from './dc-project.service';

@Component({
  selector: 'dc-project-view',
  template: `
    <asset-operations
      [type]="config.asset.values.DC_PROJECT"
      [selectedItems]="[dcProject]"
      (onDelete)="onProjectDeleted()"
    >
      <h2 class="asset-view-title">
        {{dcProject?.name}}
      </h2>
    </asset-operations>

    <app-spinner [visibility]="_projectLoader.active | async"></app-spinner>

    <dc-project-session
      [dcProject]="dcProject"
    ></dc-project-session>

    <div class="row brand-tab">
      <div class="col-md-6">
        <app-input
          [label]="'Name'"
          [control]="form.controls['name']"
        ></app-input>

        <app-description
          [control]="form.controls['description']"
        ></app-description>
      </div>

      <div class="col-md-6">
        <div class="btn-group pull-right">
          <button type="button" class="btn btn-primary"
            [disabled]="form.invalid || form.pristine || form.disabled || (_savingObserver.active | async)"
            (click)="saveProject()">
            Update&nbsp;<i class="glyphicon glyphicon-ok"></i></button>
        </div>
      </div>
    </div>
  `,
})
export class DCProjectViewComponent implements OnInit, OnDestroy {
  @HostBinding('class') _cssClass = 'app-spinner-box';

  readonly config = config;

  dcProject: IDCProject = null;
  dcProjectProcess: IProcess;

  form: FormGroup;

  protected readonly _savingObserver = new ActivityObserver();
  protected readonly _projectLoader: ReactiveLoader<IDCProject, TObjectId>;
  private _subscriptions: Subscription[] = [];
  private _isSessionTabAutoOpenEnabled = false;

  private processSubscription: Subscription;

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _processService: ProcessService,
    private readonly _eventService: EventService,
    private readonly _dcProjectService: DCProjectService,
  ) {
    this._projectLoader = new ReactiveLoader(projectId => {
      this._isSessionTabAutoOpenEnabled = false;
      return this._dcProjectService.get(projectId);
    });
    this._subscriptions.push(this._projectLoader.subscribe(dcProject => {
      this.setDcProject(dcProject);
      this.dcProject = dcProject;
    }));

    this._subscriptions.push(this._eventService.subscribe((event: IEvent) => {
      if (event.type === IEvent.Type.UPDATE_DC_PROJECT && this.dcProject && event.data.id === this.dcProject.id) {
        this._projectLoader.load(this.dcProject.id);
      }
      if (event.type === IEvent.Type.DELETE_DC_PROJECT && this.dcProject && this.dcProject.id === event.data.id) {
        this.onProjectDeleted();
      }
    }));

    this._initForm();
  }

  ngOnInit(): void {
    const paramsSubscription = this._route.params
      .subscribe((params) => {
        const projectId = params['projectId'];
        this.dcProject = null;
        if (projectId) {
          this._projectLoader.load(projectId);
        }
      });

    this._subscriptions.push(paramsSubscription);
  }

  ngOnDestroy(): void {
    this.processSubscription && this.processSubscription.unsubscribe();
    this._subscriptions.forEach((_) => _.unsubscribe());
  }

  setDcProject(dcProject: IDCProject) {
    this.dcProject = dcProject;
    this.form.reset(dcProject);

    this.processSubscription && this.processSubscription.unsubscribe();
    this.processSubscription = this._dcProjectService.getActiveProcess(dcProject)
      .do(process => {
        this.dcProjectProcess = process;
      })
      .filter(_ => !!_)
      .flatMap(process => {
        return this._processService.observe(process);
      })
      .subscribe(() => {
        this._projectLoader.load(dcProject.id);
      });
  }

  saveProject(): void {
    const update = {
      name: this.form.controls['name'].value,
      description: this.form.controls['description'].value,
    } as IDCProjectUpdate;

    this._savingObserver.observe(this._dcProjectService.update(this.dcProject.id, update));
  }

  onProjectDeleted(): void {
    this._router.navigate(['/desk', 'develop', 'projects']);
  }

  private _initForm(): void {
    this.form = new FormGroup({
      name: new FormControl(''),
      description: new FormControl(''),
    });
  }
}

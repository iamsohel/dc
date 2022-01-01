import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { ISubscription, Subscription } from 'rxjs/Subscription';

import config from '../config';
import { TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { ProcessService } from '../core/services/process.service';
import { ReactiveLoader } from '../utils/reactive-loader';

import { IDCProject } from './dc-project.interfaces';
import { DCProjectService } from './dc-project.service';
import { PackageOperationsComponent } from './package-operations.component';
import { IPackage } from './package.interfaces';

@Component({
  selector: 'dc-project-packages',
  template: `
    <package-operations
      #packageOperations
      [hidden]="!selectedPackages.length"
      [(selectedItems)]="selectedPackages"
      (deleted)="onPackageDeleted()"
    ></package-operations>
    <asset-operations
      [hidden]="!!selectedPackages.length"
      [type]="config.asset.values.DC_PROJECT"
      [selectedItems]="[dcProject]"
      (onDelete)="onProjectDeleted()"
    >
      <h2 style="padding: 0; margin-top: 0;">
        {{dcProject?.name}}
      </h2>
    </asset-operations>

    <app-spinner [visibility]="(isLoading$ | async)"></app-spinner>

    <dc-project-session [dcProject]="dcProject"></dc-project-session>

    <process-indicator [process]="dcProjectProcess"></process-indicator>

    <packages-list
      *ngIf="dcProject"
      [(selectedItems)]="selectedPackages"
      [searchParams]="{dcProjectId: dcProject.id}"
      (onDelete)="onDeletePackage()"
    ></packages-list>
  `,
})
export class DcProjectPackagesComponent implements OnInit, OnDestroy {
  @HostBinding('class') _cssClass = 'app-spinner-box';
  @ViewChild('packageOperations') packageOperations: PackageOperationsComponent;

  dcProject: IDCProject;
  selectedPackages: IPackage[] = [];
  dcProjectProcess: IProcess;
  readonly config = config;
  protected _projectLoader: ReactiveLoader<IDCProject, TObjectId>;
  private _subscription: Subscription = new Subscription();
  private _processSubscription: ISubscription;

  constructor(
    protected dcProjects: DCProjectService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _processService: ProcessService,
    private readonly _eventService: EventService,
  ) {
    this._projectLoader = new ReactiveLoader(projectId => this.dcProjects.get(projectId));

    this._subscription.add(this._projectLoader.subscribe(dcProject => {
      this.dcProject = dcProject;
      this._handleProcessUpdates(dcProject);
    }));

    this._subscription.add(this._eventService.subscribe((event: IEvent) => {
      if (event.type === IEvent.Type.UPDATE_DC_PROJECT && this.dcProject && event.data.id === this.dcProject.id) {
        this._projectLoader.load(this.dcProject.id);
      }
      if (event.type === IEvent.Type.DELETE_DC_PROJECT && this.dcProject && this.dcProject.id === event.data.id) {
        this.onProjectDeleted();
      }
    }));
  }

  get isLoading$(): Observable<boolean> {
    return this._projectLoader.active;
  }

  ngOnInit(): void {
    this._subscription.add(this._route.params.subscribe((params) => {
      const projectId = params['projectId'];
      if (projectId) {
        this._projectLoader.load(projectId);
      } else {
        delete this.dcProject;
      }
    }));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._processSubscription && this._processSubscription.unsubscribe();
  }

  onProjectDeleted(): void {
    this._router.navigate(['/desk', 'develop', 'projects']);
  }

  onPackageDeleted(): void {
    this.selectedPackages = [];
  }

  onDeletePackage(): void {
    this.packageOperations.trash();
  }

  private _handleProcessUpdates(dcProject: IDCProject): void {
    this._processSubscription && this._processSubscription.unsubscribe();
    this._processSubscription = this.dcProjects.getActiveProcess(dcProject)
      .do(_ => this.dcProjectProcess = _)
      .filter(Boolean)
      .flatMap(_ => this._processService.observe(_))
      .subscribe(() => this._projectLoader.load(dcProject.id));
  }
}

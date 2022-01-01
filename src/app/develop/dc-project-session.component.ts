import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { TObjectId } from '../core/interfaces/common.interface';
import { EventService } from '../core/services/event.service';
import { ProcessService } from '../core/services/process.service';
import { ReactiveLoader } from '../utils/reactive-loader';

import {
  IDCProject,
  IDCProjectSession,
  IDCProjectSessionCreate,
} from './dc-project.interfaces';
import { DCProjectService } from './dc-project.service';

interface IProjectViewToolbarButton {
  name: string;
  title?: string;
  iconClass?: string;
  isVisible?: () => boolean;
  onClick?: () => void;
  isDisabled?: () => boolean;
  subActions?: IProjectViewToolbarButton[];
}

@Component({
  selector: 'dc-project-session',
  template: `
    <app-spinner [visibility]="_sessionLoader.active | async"></app-spinner>

    <div class="row bg-gray" style="margin-top: 10px">
      <div
        class="col-xs-12 col-md-4 col-md-offset-4"
        style="padding: 5px 15px;"
        *ngIf="this.dcProject && !(_sessionLoader.active | async)"
      >
        <label class="text-uppercase">
          <span>Interactive IDE: </span>
          <span
            [ngClass]="sessionStatus | apply: _getSessionStatusClass"
            class="label"
          >{{sessionStatus | apply: _getSessionStatus: dcProject}}</span>
        </label>

        <span class="btn-group">
          <ng-container *ngFor="let button of buttons">
            <button
              *ngIf="!button.isVisible || button.isVisible()"
              class="btn btn-default btn-sm"
              [ngClass]="{
                'dropdown-toggle': !!button.subActions
              }"
              [title]="button.title"
              placement="bottom"
              (click)="button.onClick && button.onClick()"
              [attr.data-toggle]="button.subActions ? 'dropdown' : null"
              [disabled]="button.isDisabled && button.isDisabled()"
            >
              <i *ngIf="button.iconClass" [class]="button.iconClass"></i>
              {{button.name}}
              <span *ngIf="button.subActions" class="caret"></span>
            </button>
            <ul
              *ngIf="button.subActions"
              class="dropdown-menu"
              role="menu"
            >
              <li *ngFor="let action of button.subActions">
                <a
                  href="#"
                  (click)="$event.preventDefault(); action.onClick && action.onClick()"
                >
                  <i *ngIf="action.iconClass" [class]="action.iconClass"></i>
                  {{action.name}}
                </a>
              </li>
            </ul>
          </ng-container>
        </span>
      </div>
    </div>
  `,
})
export class DCProjectSessionComponent implements OnDestroy, OnChanges {
  readonly config = config;

  @Input() dcProject: IDCProject = null;
  session: IDCProjectSession = null;
  sessionStatus: IDCProjectSession.Status = null;

  readonly buttons: IProjectViewToolbarButton[] = [
    {
      name: 'Run',
      title: 'Run interactive session',
      iconClass: 'glyphicon glyphicon-play-circle',
      isVisible: () => {
        return this.dcProject.status === IDCProject.Status.IDLE;
      },
      subActions: [
        {
          name: 'Run with GPU',
          onClick: () => this.runSession({ useGPU: true }),
        },
        {
          name: 'Run without GPU',
          onClick: () => this.runSession({ useGPU: false }),
        },
      ],
    },
    {
      name: 'Shutdown',
      title: 'Shutdown interactive session',
      iconClass: 'glyphicon glyphicon-remove-circle',
      isVisible: () => {
        return this.dcProject.status === IDCProject.Status.INTERACTIVE
          && this.session
          && [
            IDCProjectSession.Status.QUEUED,
            IDCProjectSession.Status.RUNNING,
            IDCProjectSession.Status.SUBMITTED,
          ].includes(this.sessionStatus);
      },
      onClick: () => this.shutdownSession(),
    },
    {
      name: 'Open',
      title: 'Open interactive session',
      iconClass: 'glyphicon glyphicon-share',
      isVisible: () => {
        return this.dcProject.status === IDCProject.Status.INTERACTIVE
          && !!this.session;
      },
      isDisabled: () => this.sessionStatus !== IDCProjectSession.Status.RUNNING,
      onClick: () => this.openSessionTab(this.session),
    },
  ];

  protected readonly _sessionLoader: ReactiveLoader<IDCProjectSession, TObjectId>;
  private _subscriptions: Subscription[] = [];
  private statusSubscription: Subscription = null;
  private _isSessionTabAutoOpenEnabled = false;

  private processSubscription: Subscription;

  constructor(
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _processService: ProcessService,
    private readonly _eventService: EventService,
    private readonly _dcProjectService: DCProjectService,
  ) {
    this._sessionLoader = new ReactiveLoader(projectId => this._dcProjectService.getSession(projectId));
    this._subscriptions.push(this._sessionLoader.subscribe(session => {
      this.session = session;
      this._startStatusChangeTracking(this.dcProject);
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('dcProject' in changes) {
      const previousId = changes['dcProject'].previousValue && changes['dcProject'].previousValue.id;
      const currentId = this.dcProject && this.dcProject.id;
      if (previousId !== currentId) {
        this.session = null;
        this.sessionStatus = null;
        this._isSessionTabAutoOpenEnabled = false;
        this._stopStatusChangeTracking();
        if (this.dcProject && this.dcProject.status === IDCProject.Status.INTERACTIVE) {
          this._sessionLoader.load(this.dcProject.id);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this._stopStatusChangeTracking();
    this.processSubscription && this.processSubscription.unsubscribe();
    this._subscriptions.forEach((_) => _.unsubscribe());
  }

  runSession(options: IDCProjectSessionCreate): void {
    const subscription = this._dcProjectService.startSession(this.dcProject, options)
      .subscribe(() => {
        this._isSessionTabAutoOpenEnabled = true;
        this._sessionLoader.load(this.dcProject.id);
      });
    this._subscriptions.push(subscription);
  }

  shutdownSession(): void {
    this._stopStatusChangeTracking();
    this.session = null;
    this.sessionStatus = null;
    this._dcProjectService.stopSession(this.dcProject);
  }

  openSessionTab(session: IDCProjectSession): void {
    if (!session) {
      return;
    }

    const win = window.open();

    // security hack because passing 'noopener' to window.open leads to a new window opening instead of a new tab)
    if (win) {
      win.opener = null;
      win.location.href = this.session.url + `?token=${this.session.authToken}`;
    }
  }

  _getSessionStatus(sessionStatus: string, dcProject: IDCProject): string {
    return dcProject && dcProject.status === IDCProject.Status.INTERACTIVE
      ? config.dcProject.sessionStatus.labels[sessionStatus] || '...'
      : 'Not Running';
  }

  _getSessionStatusClass(sessionStatus: string) {
    return config.dcProject.sessionStatus.styles[sessionStatus] || 'label-default';
  }

  private _onStatusChange(status: IDCProjectSession.Status): void {
    this.sessionStatus = status;

    if (
      status === IDCProjectSession.Status.RUNNING
      && this.session
      && this._isSessionTabAutoOpenEnabled
    ) {
      this._isSessionTabAutoOpenEnabled = false;
      this.openSessionTab(this.session);
    }
  }

  private _startStatusChangeTracking(dcProject: IDCProject): void {
    this._stopStatusChangeTracking();
    this.statusSubscription = this._dcProjectService
      .getSessionStatusStream(dcProject.id)
      .subscribe(status => this._onStatusChange(status));
  }

  private _stopStatusChangeTracking(): void {
    this.statusSubscription && this.statusSubscription.unsubscribe();
    this.statusSubscription = null;
  }
}

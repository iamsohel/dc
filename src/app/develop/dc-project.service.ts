import { HttpResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';

import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/takeWhile';
import { Observable } from 'rxjs/Observable';

import config from '../config';
import { IAsset, IObjectId, TObjectId } from '../core/interfaces/common.interface';
import { AssetService } from '../core/services/asset.service';
import { IEvent } from '../core/services/event.service';
import { AppHttp, IServerSentEvent } from '../core/services/http.service';

import {
  IDCProject,
  IDCProjectCreate,
  IDCProjectFile,
  IDCProjectSession,
  IDCProjectSessionCreate,
  IDCProjectUpdate,
} from './dc-project.interfaces';
import { IPackageCreate } from './package.interfaces';

@Injectable()
export class DCProjectService
  extends AssetService<IAsset.Type.DC_PROJECT, IDCProject, IDCProjectCreate, IDCProjectUpdate> {

  protected readonly _createEventType: IEvent.Type = IEvent.Type.CREATE_DC_PROJECT;
  protected readonly _updateEventType: IEvent.Type = IEvent.Type.UPDATE_DC_PROJECT;
  protected readonly _deleteEventType: IEvent.Type = IEvent.Type.DELETE_DC_PROJECT;
  protected readonly _listUpdateEventType: IEvent.Type = IEvent.Type.UPDATE_DC_PROJECT_LIST;

  constructor(injector: Injector) {
    super(injector, IAsset.Type.DC_PROJECT);
  }

  build(item: IDCProject, data: IPackageCreate) {
    const observable = this._http.post(this._baseUrl + '/' + item.id + '/build', data);
    return AppHttp.execute(observable,
      () => {
        this._events.emit(IEvent.Type.UPDATE_DC_PROJECT_LIST);
        this._events.emit(IEvent.Type.UPDATE_DC_PROJECT, {id: item.id});
        this._events.emit(IEvent.Type.BUILD_DC_PROJECT, {id: item.id});
        this._notifications.create('DC Project build process has started' + item.name);
      });
  }

  listFiles(projectId: TObjectId, path?: string): Observable<IDCProjectFile[]> {
    return this._http.get(`${this._baseUrl}/${projectId}/ls`, {
      path,
      recursive: true,
    });
  }

  getFileContent(projectId: TObjectId, filePath: string): Observable<IDCProjectFile.Content> {
    const encodedFilePath = this._uriEncodePath(filePath);
    return this._http.get(`${this._baseUrl}/${projectId}/files/${encodedFilePath}`, {}, {
      responseType: 'text',
      getResponse: true,
    }).map((response: HttpResponse<string>) => {
      const lastModifiedFromResponse = response.headers.get('Last-Modified');

      const lastModified = lastModifiedFromResponse
        ? new Date(lastModifiedFromResponse)
        : new Date(0);

      return {
        content: response.body,
        contentType: response.headers.get('Content-Type') || 'text/plain',
        lastModified: lastModified.toISOString(),
      };
    });
  }

  getFileBlob(projectId: TObjectId, filePath: string): Observable<Blob> {
    const encodedFilePath = this._uriEncodePath(filePath);
    return this._http.get(`${this._baseUrl}/${projectId}/files/${encodedFilePath}`, {}, {
      responseType: 'blob',
      getResponse: true,
    }).map((response: HttpResponse<Blob>) => response.body);
  }

  updateFileContent(
    projectId: TObjectId,
    filePath: string,
    data: string,
    lastKnownModifiedTime: string = null,
  ): Observable<IDCProjectFile> {
    const encodedFilePath = this._uriEncodePath(filePath);
    const observable = this._http.put(`${this._baseUrl}/${projectId}/files/${encodedFilePath}`, data, {}, {
      headers: {
        'If-Unmodified-Since': lastKnownModifiedTime
          ? new Date(lastKnownModifiedTime).toUTCString()
          : new Date().toUTCString(),
      },
    });

    return AppHttp.execute(observable,
      () => {
        this._notifications.create('DC Project file has been updated: ' + filePath);
      },
    );
  }

  createFileContent(
    projectId: TObjectId,
    filePath: string,
    data: string,
  ): Observable<IDCProjectFile> {
    const encodedFilePath = this._uriEncodePath(filePath);
    const observable = this._http.put(`${this._baseUrl}/${projectId}/files/${encodedFilePath}`, data, {});
    return AppHttp.execute(observable,
      () => {
        this._notifications.create('DC Project file has been created: ' + filePath);
      },
    );
  }

  createDirectory(
    projectId: TObjectId,
    directoryPath: string,
  ): Observable<IDCProjectFile> {
    const encodedDirectoryPath = this._uriEncodePath(directoryPath);
    const observable = this._http.put(`${this._baseUrl}/${projectId}/files/${encodedDirectoryPath}`, null, {}, {
      headers: {
        'Content-Type': 'application/x-directory',
      },
    });

    return AppHttp.execute(observable,
      () => {
        this._notifications.create('DC Project folder has been created: ' + directoryPath);
      },
    );
  }

  deleteFile(
    projectId: TObjectId,
    filePath: string,
    lastKnownModifiedTime: string,
  ): Observable<IObjectId> {
    const encodedFilePath = this._uriEncodePath(filePath);
    const observable = this._http.delete(`${this._baseUrl}/${projectId}/files/${encodedFilePath}`, {}, {
      headers: {
        'If-Unmodified-Since': new Date(lastKnownModifiedTime).toUTCString(),
      },
    });

    return AppHttp.execute(observable,
      () => {
        this._notifications.create('DC Project file has been deleted: ' + filePath);
      },
    );
  }

  moveFile(
    projectId: TObjectId,
    file: IDCProjectFile,
    newFilePath: string,
  ): Observable<IDCProjectFile> {
    const encodedNewFilePath = this._uriEncodePath(newFilePath);
    const observable = this._http.put(`${this._baseUrl}/${projectId}/files/${encodedNewFilePath}`, '', {}, {
        headers: Object.assign(
          {
            'X-Move-Source': file.name,
          },
          file.type === IDCProjectFile.Type.DIR ? { 'Content-Type': 'application/x-directory' } : {},
        ),
      },
    );

    return AppHttp.execute(observable,
      () => {
        this._notifications.create('DC Project file has been moved/renamed: ' + file.name);
      },
    );
  }

  /*
  USE once UC is in place
  copyFile(
    projectId: TObjectId,
    filePath: string,
    newFilePath: string,
  ): Observable<IDCProjectFile> {
    const encodedNewFilePath = this._uriEncodePath(newFilePath);
    const observable = this._http.put(`${this._baseUrl}/${projectId}/files/${encodedNewFilePath}`, '', {}, {
      headers: {
        'X-Copy-Source': filePath,
      },
    });

    return AppHttp.execute(observable,
      () => {
        this._notifications.create('DC Project file has been copied: ' + filePath);
      },
    );
  }*/

  isBuildingAvailable(items: IDCProject[]): boolean {
    return items.length === 1 && items[0].status === IDCProject.Status.IDLE;
  }

  isPublishingAvailable(items: IDCProject[]): boolean {
    return items.length === 1 && !!items[0].packageName;
  }

  startSession(dcProject: IDCProject, data: IDCProjectSessionCreate): Observable<IDCProjectSession> {
    const observable = this._http.post(`${this._baseUrl}/${dcProject.id}/session`, data);

    return AppHttp.execute(
      observable,
      () => {
        this._events.emit(IEvent.Type.UPDATE_DC_PROJECT_LIST);
        this._events.emit(IEvent.Type.UPDATE_DC_PROJECT, { id: dcProject.id });
        this._events.emit(IEvent.Type.START_DC_PROJECT_SESSION, { projectId: dcProject.id });
        this._notifications.create('DC Project interactive session has been started');
      },
    );
  }

  stopSession(dcProject: IDCProject): Observable<TObjectId> {
    const observable = this._http.delete(`${this._baseUrl}/${dcProject.id}/session`);

    return AppHttp.execute(
      observable,
      () => {
        this._events.emit(IEvent.Type.UPDATE_DC_PROJECT_LIST);
        this._events.emit(IEvent.Type.UPDATE_DC_PROJECT, { id: dcProject.id });
        this._events.emit(IEvent.Type.STOP_DC_PROJECT_SESSION, { projectId: dcProject.id });
        this._notifications.create('DC Project interactive session has been stopped');
      },
    );
  }

  getSession(dcProjectId: TObjectId) {
    return this._http.get(`${this._baseUrl}/${dcProjectId}/session`, null);
  }

  getSessionStatusStream(dcProjectId: TObjectId): Observable<IDCProjectSession.Status> {
    const stopStatusTrackingWhen = [
      IDCProjectSession.Status.COMPLETED,
      IDCProjectSession.Status.FAILED,
    ];

    //const statusObservable = this._http.sseStream(
    //  `http://localhost:8080/events`,
    //  {
    //    parse: _ => <IDCProjectSession.Status>_,
    //    retry: true,
    //  },
    //)
    const statusObservable = this._http
      .sseStream<IDCProjectSession.Status>(
        `${this._baseUrl}/${dcProjectId}/session/status`,
        {
          parse: _ => <IDCProjectSession.Status> _,
          retry: true,
        },
      )
      .filter(_ => _.type === IServerSentEvent.Type.MESSAGE)
      .map(_ => _.data)
      .do(status => {
        if (status === IDCProjectSession.Status.FAILED) {
          this._notifications.create(
            'Failed to run interactive session. Please try again later.',
            config.notification.level.values.DANGER,
          );
        }
      });

    return statusObservable
      .concatMap(status => {
        if (stopStatusTrackingWhen.includes(status)) {
          this._events.emit(IEvent.Type.UPDATE_DC_PROJECT_LIST);
          this._events.emit(IEvent.Type.UPDATE_DC_PROJECT, { id: dcProjectId });
          this._events.emit(IEvent.Type.STOP_DC_PROJECT_SESSION, { projectId: dcProjectId });
          // add second null observable to pass the last status and then complete
          // FIXME: in rxjs:>=6.4.0 use an inclusive option for takeWhile
          return Observable.of(status, null);
        }
        return Observable.of(status);
      })
      .takeWhile(Boolean)
      .share();
  }

  protected _hasProcess(item: IDCProject): boolean {
    return config.dcProject.status.hasProcess[item.status];
  }

  private _uriEncodePath(path: string): string {
    return path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
  }
}

declare module '../core/services/event.service' {
  export namespace IEvent {
    export const enum Type {
      CREATE_DC_PROJECT = 'CREATE_DC_PROJECT',
      UPDATE_DC_PROJECT_LIST = 'UPDATE_DC_PROJECT_LIST',
      UPDATE_DC_PROJECT = 'UPDATE_DC_PROJECT',
      DELETE_DC_PROJECT = 'DELETE_DC_PROJECT',
      BUILD_DC_PROJECT = 'BUILD_DC_PROJECT',
      START_DC_PROJECT_SESSION = 'START_DC_PROJECT_SESSION',
      STOP_DC_PROJECT_SESSION = 'STOP_DC_PROJECT_SESSION',
    }
  }
}

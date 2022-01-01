import { Injectable } from '@angular/core';

import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';

import { mocksOnly } from '../core/core.mocks-only';
import {
  IAsset,
  IAssetListRequest,
  IAssetSaveParams,
  IAssetService,
  IBackendList,
  IObjectId,
  TObjectId,
} from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { DataService } from '../core/services/data.service';
import { EventService, IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { NotificationService } from '../core/services/notification.service';
import { ProcessService } from '../core/services/process.service';
import { SharedResourceService } from '../core/services/shared-resource.service';
import { MiscUtils } from '../utils/misc';

import { IModel, IModelClone, IModelCreate, IModelImport, IModelUpdate } from './model.interface';

@Injectable()
export class ModelService extends DataService
  implements IAssetService<IModel, IModelCreate>,
    IAssetService.Importable<IModel, IModelImport>,
    IAssetService.Cloneable<IModel, IModelClone> {
  readonly assetType: IAsset.Type = IAsset.Type.MODEL;

  protected _type = IAsset.Type.MODEL;

  constructor(
    protected http: AppHttp,
    protected events: EventService,
    private sharedService: SharedResourceService,
    private notifications: NotificationService,
    private processes: ProcessService,
  ) {
    super(events);
    this._data.listMeta = { count: 0, countPage: 0 };
    this._data['table'] = null;
  }

  list(params?: IAssetListRequest): Observable<IBackendList<IModel>> {
    // GET '/models'
    const observable = this.http.get('models', params);

    return AppHttp.execute(observable,
      (data: IBackendList<IModel>) => {
        this._data.list = data.data || [];

        this._data.listMeta = {
          count: data.count,
          countPage: data.data.length,
        };

        // RESERVED // don't send "raw" data / need to think what to send...
        this._observables.list.next(data);
      },
    );
  }

  get(id: TObjectId): Observable<IModel> {
    // GET '/models/:id'
    const observable = this.sharedService.withSharedAccess(
      IAsset.Type.MODEL,
      id,
    ).get('models/' + id, null);

    return AppHttp.execute(observable,
      (data: IModel) => {
        this._data.view = data;
        this._data.viewset = null;
        this._observables.view.next(data);
      },
    );
  }

  getActiveProcess(item: IModel): Observable<IProcess> {
    if (item.status === IModel.Status.IMPORTING) {
      return this.processes.getByTarget(item.id, IAsset.Type.MODEL);
    } else {
      return Observable.of(null);
    }
  }

  getMany(ids: TObjectId[]): Observable<IModel[]> {
    // @TODO: need to have list endpoint extended
    const observable = Observable
      .forkJoin(...ids.map(id => {
        return this.sharedService.withSharedAccess(
          IAsset.Type.MODEL,
          id,
        ).get('models/' + id, null);
      }))
      .map(models => {
        return models.filter(_ => _);
      })
      .share();

    return AppHttp.execute(observable);
  }

  create(item: IModelCreate): Observable<IModel> {
    item = item || this._data.item.edit;
    const data = jQuery.extend(true, {}, item);
    // POST '/models/:id'
    const observable = this.http.post('models', data, null);

    return AppHttp.execute(observable,
      (model: IModel) => {
        this._data.view = model;
        this.events.emit(IEvent.Type.CREATE_MODEL, model);
        this.events.emit(IEvent.Type.UPDATE_MODEL_LIST);
        this.notifications.create('Model created: ' + model.name);
      },
    );
  }

  update(modelId: TObjectId, data: IModelUpdate): Observable<IModel> {
    // PUT '/models/:id'
    const observable = this.http.put('models/' + modelId, data, null);

    return AppHttp.execute(observable,
      (data: IModel) => {
        this._data.view = data;
        this._observables.view.next(data);

        // clear all related data
        delete this._data.viewset;

        // RESERVED // this._data.list && this.list() // experimental // refresh the list
        this.events.emit(IEvent.Type.UPDATE_MODEL_LIST);
        this.events.emit(IEvent.Type.UPDATE_MODEL, { id: modelId });
        this.notifications.create('Model updated: ' + data.name);
      },
    );
  }

  save(id: TObjectId, saveParams: IAssetSaveParams): Observable<IModel> {
    const observable = this.http.post('models/' + id + '/save', saveParams);

    return AppHttp.execute(observable, () => {
      this.events.emit(IEvent.Type.UPDATE_MODEL_LIST);
      this.events.emit(IEvent.Type.UPDATE_MODEL, { id });
      this.notifications.create('Model saved.');
    });
  }

  'delete'(item: IModel): Observable<IObjectId> {
    // DELETE '/models/:id'
    const observable = this.http.delete('models/' + item.id);

    return AppHttp.execute(observable,
      (data: IObjectId) => {
        if (this._data.view && 'id' in this._data.view && this._data.view.id === data.id) {
          this._data.view = null;
          this._observables.view.next(this._data.view);
        }
        this.events.emit(IEvent.Type.UPDATE_MODEL_LIST);
        this.events.emit(IEvent.Type.DELETE_MODEL, { id: item.id });
        this.notifications.create('Model deleted: ' + item.name);
      },
    );
  }

  cancel(item: IModel): Observable<IObjectId> {
    // DELETE '/models/:id'
    return this.getActiveProcess(item)
      .flatMap(process => this.processes.cancel(process))
      .mapTo({id: item.id});
  }

  exportUrl(id: TObjectId): Observable<string> {
    return this.sharedService.withSharedAccess(IAsset.Type.MODEL, id)
      .get(`models/${id}/export`);
  }

  download(id: TObjectId): Observable<boolean> {
    const observable = this.exportUrl(id).flatMap(url => {
      return MiscUtils.downloadUrl(url, `${id}.bin`);
    }).publish();

    observable.connect(); // make sure this runs irrespective of subscribers
    return observable;
  }

  import(file: File, params: IModelImport): Observable<IModel> {
    const observable = this.http.monitoredUpload(`models/import`, file, {
      name: params.name || file.name,
    }).flatMap((model: IModel) => this.get(model.id));

    return AppHttp.execute(observable,
      (model: IModel) => {
        this.events.emit(IEvent.Type.CREATE_MODEL, model);
        this.events.emit(IEvent.Type.UPDATE_MODEL_LIST);
      },
    );
  }


  clone(id: TObjectId, clone: IModelClone) {
    if (clone.name === '') {
      delete clone.name;
    }
    const observable = this.sharedService.withSharedAccess(
      IAsset.Type.MODEL,
      id,
    ).post('models/' + id + '/copy', clone);

    return AppHttp.execute(observable,
      (model: IModel) => {
        this.events.emit(IEvent.Type.CREATE_MODEL, model);
        this.events.emit(IEvent.Type.UPDATE_MODEL_LIST);
        this.notifications.create('Model cloned: ' + model.name);
      },
    );
  }

  @mocksOnly(Observable.empty())
  getTrainSummary(id: TObjectId, watch = false) {
    if (!watch) {
      return this._getTrainSummaryOnce(id);
    }

    return Observable.timer(0, 1000).switchMap(() => this._getTrainSummaryOnce(id));
  }

  @mocksOnly(Observable.empty())
  stopRefining(id: TObjectId) {
    const observable = this.http.post('models/' + id + '/stop-refining', null);

    return AppHttp.execute(observable);
  }

  @mocksOnly(Observable.empty())
  private _getTrainSummaryOnce(id: TObjectId) {
    return this.sharedService.withSharedAccess(
      IAsset.Type.MODEL,
      id,
    ).get('models/' + id + '/train-summary');
  }
}

declare module '../core/services/event.service' {
  export namespace IEvent {
    export const enum Type {
      CREATE_MODEL = 'CREATE_MODEL',
      UPDATE_MODEL_LIST = 'UPDATE_MODEL_LIST',
      UPDATE_MODEL = 'UPDATE_MODEL',
      DELETE_MODEL = 'DELETE_MODEL',
    }
  }
}

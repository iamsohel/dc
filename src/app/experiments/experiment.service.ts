import { Injectable, Injector } from '@angular/core';

import { Observable } from 'rxjs/Observable';

import config from '../config';
import { IAsset, IAssetReference, TObjectId } from '../core/interfaces/common.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { AssetService } from '../core/services/asset.service';
import { IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { ProcessService } from '../core/services/process.service';
import { InteractiveExperiment } from '../pipelines/experiment-interactive-session.class';

import {
  ExecutionTarget,
  ExperimentType,
  IExperiment,
  IExperimentCreate,
  IExperimentFull,
  IExperimentPipelineUpdate,
  IExperimentUpdate,
} from './experiment.interfaces';

@Injectable()
export class ExperimentService
  extends AssetService<IAsset.Type.EXPERIMENT, IExperiment, IExperimentCreate, IExperimentUpdate, IExperimentFull> {

  private static _childAssetsExtractors: {[K in ExperimentType]?: (e: IExperimentFull) => IAssetReference[]} = {};

  protected readonly _createEventType = IEvent.Type.CREATE_EXPERIMENT;
  protected readonly _updateEventType = IEvent.Type.UPDATE_EXPERIMENT;
  protected readonly _deleteEventType = IEvent.Type.DELETE_EXPERIMENT;
  protected readonly _listUpdateEventType = IEvent.Type.UPDATE_EXPERIMENT_LIST;

  constructor(
    private processService: ProcessService,
    injector: Injector,
  ) {
    super(injector, IAsset.Type.EXPERIMENT);
  }

  public getTargets(): Observable<ExecutionTarget[]> {
    return this._http.get('config/execution-targets');
  }

  public updatePipeline(id: TObjectId, pipeline: IExperimentPipelineUpdate): Observable<IExperimentFull> {
    const observable = this._http.put(this._baseUrl + '/' + id + '/pipeline', pipeline);
    return AppHttp.execute(observable);
  }

  // TODO: this should not depend on InteractiveExperiment from pipelines module
  public connectInteractive(experimentId: TObjectId, process: IProcess): InteractiveExperiment.Session {
    return new InteractiveExperiment.Session(
      this._http,
      this._baseUrl + '/' + experimentId + '/controller',
      this.processService,
      process,
    );
  }

  protected _hasProcess(item: IExperiment): boolean {
    return config.experiments.status.hasProcess[item.status];
  }

  protected _getChildAssets(item: IExperimentFull): IAssetReference[] {
    return item.type in ExperimentService._childAssetsExtractors
      ? ExperimentService._childAssetsExtractors[item.type](item)
      : [];
  }

  static registerChildAssetsExtractor(experimentType: ExperimentType, f: (e: IExperimentFull) => IAssetReference[]) {
    ExperimentService._childAssetsExtractors[experimentType] = f;
  }
}

declare module '../core/services/event.service' {
  export namespace IEvent {
    export const enum Type {
      CREATE_EXPERIMENT = 'CREATE_EXPERIMENT',
      UPDATE_EXPERIMENT = 'UPDATE_EXPERIMENT',
      DELETE_EXPERIMENT = 'DELETE_EXPERIMENT',
      UPDATE_EXPERIMENT_LIST = 'UPDATE_EXPERIMENT_LIST',
    }
  }
}

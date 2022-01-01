import { Injectable } from '@angular/core';

import { IAlbum } from '../albums/album.interface';
import { IFlow, IFlowstep } from '../compose/flow.interface';
import config from '../config';
import { IAsset } from '../core/interfaces/common.interface';
import { IUser } from '../core/interfaces/user.interface';
import { UserService } from '../core/services/user.service';
import { BinaryDataset } from '../datasets/dataset.interfaces';
import { IScriptDeployment } from '../deploy/script-deployment.interface';
import { IDCProject } from '../develop/dc-project.interfaces';
import { IExperiment } from '../experiments/experiment.interfaces';
import { IOptimization } from '../optimize/optimization.interface';
import { Pipeline } from '../pipelines/pipeline.interfaces';
import { ICVPrediction } from '../play/cv-prediction.interface';
import { IReplay } from '../play/replay.interface';
import { ITable } from '../tables/table.interface';
import { ICVModel } from '../train/cv-model.interface';
import { IModel } from '../train/model.interface';
import { IDashboard } from '../visualize/dashboard.interface';

@Injectable()
export class AclService {
  constructor(private user: UserService) {
  }

  canUpdateModel(model: IModel) {
    return this._canUpdateAsset(model);
  }

  canUpdateCVModel(model: ICVModel) {
    return this._canUpdateAsset(model);
  }

  canUpdateCVPrediction(prediction: ICVPrediction) {
    return this._canUpdateAsset(prediction);
  }

  canUpdateTable(table: ITable): boolean {
    return this._canUpdateAsset(table);
  }

  canEditTable(table: ITable): boolean {
    return (table.size <= config.table.edit.threshold) && table.status === ITable.Status.ACTIVE;
  }

  canViewVersions(table: ITable): boolean {
    return table.version !== 1 || !table.current;
  }

  canUpdateFlow(flow: IFlow): boolean {
    return this._canUpdateAsset(flow);
  }

  canUpdateFlowstep(flowstep: IFlowstep, flow: IFlow): boolean {
    return this._canUpdateAsset(flow);
  }

  canUpdateReplay(replay: IReplay): boolean {
    return this._canUpdateAsset(replay);
  }

  canUpdateAlbum(album: IAlbum): boolean {
    return this._canUpdateAsset(album);
  }

  canRemovePicture(album: IAlbum) {
    return this.canUpdateAlbum(album) && album.type === config.album.type.values.SOURCE;
  }

  canUpdateOptimization(optimization: IOptimization) {
    return this._canUpdateAsset(optimization);
  }

  canUpdateDashboard(dashboard: IDashboard) {
    return this._canUpdateAsset(dashboard);
  }

  canUpdateDCProject(dcProject: IDCProject) {
    return this._canUpdateAsset(dcProject);
  }

  canUpdateScriptDeployment(sd: IScriptDeployment): boolean {
    return this._canUpdateAsset(sd);
  }

  canUpdatePipeline(pipeline: Pipeline) {
    return pipeline.ownerId === this.currentUser.id;
  }

  canUpdateExperiment(experiment: IExperiment) {
    return experiment.ownerId === this.currentUser.id;
  }

  canUpdateBinaryDataset(dataset: BinaryDataset): boolean {
    return dataset.ownerId === this.currentUser.id;
  }

  private get currentUser(): IUser {
    return this.user.getUser();
  }

  private _canUpdateAsset(asset: IAsset): boolean {
    return asset.ownerId === this.currentUser.id;
  }
}

import { Injectable, Injector } from '@angular/core';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { listAll } from '../core/core.helpers';
import {
  IAsset,
  IAssetReference,
  IAssetService,
  IBackendList,
  IListRequest,
  TObjectId,
} from '../core/interfaces/common.interface';
import { ParameterDefinition, ParameterValues } from '../core/interfaces/params.interface';
import { AssetService } from '../core/services/asset.service';
import { IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';

import {
  IPipelineClone,
  Pipeline,
  PipelineCreate,
  PipelineDataType,
  PipelineOperator,
  PipelineUpdate,
} from './pipeline.interfaces';

export const LIST_TYPE_DEFINITION = 'List';

@Injectable()
export class PipelineService extends AssetService<IAsset.Type.PIPELINE, Pipeline, PipelineCreate, PipelineUpdate>
  implements IAssetService.Cloneable<Pipeline, IPipelineClone> {

  protected readonly _createEventType: IEvent.Type = IEvent.Type.CREATE_PIPELINE;
  protected readonly _updateEventType: IEvent.Type = IEvent.Type.UPDATE_PIPELINE;
  protected readonly _deleteEventType: IEvent.Type = IEvent.Type.DELETE_PIPELINE;
  protected readonly _listUpdateEventType: IEvent.Type = IEvent.Type.UPDATE_PIPELINE_LIST;

  constructor(
    injector: Injector,
  ) {
    super(injector, IAsset.Type.PIPELINE);
  }

  public clone(id: TObjectId, cloneParams: IPipelineClone): Observable<Pipeline> {
    const observable = this._sharedAccessService.withSharedAccess(
      id,
    ).post(`pipelines/${id}/copy`, cloneParams);
    return AppHttp.execute(observable,
      (pipeline: Pipeline) => {
        this._events.emit(IEvent.Type.CREATE_PIPELINE, pipeline);
        this._events.emit(IEvent.Type.UPDATE_PIPELINE_LIST);
        this._notifications.create('Pipeline cloned: ' + pipeline.name);
      },
    );
  }

  listOperators(
    params: IListRequest = {
      page: 1,
      page_size: 1000,
    },
  ): Observable<IBackendList<PipelineOperator>> {
    const fixTypeMissingFields = (t: PipelineDataType): void => {
      if (this.isPipelineDataTypeComplex(t)) {
        if (t.parents) {
          t.parents.forEach(fixTypeMissingFields);
        } else {
          t.parents = [];
        }
        if (t.typeArguments) {
          t.typeArguments.forEach(fixTypeMissingFields);
        } else {
          t.typeArguments = [];
        }
      }
    };
    return this._http.get(`pipeline-operators`, params, {
      deserialize: (ops: IBackendList<PipelineOperator>) => {
        ops.data.forEach(op => {
          [...op.inputs, ...op.outputs].forEach(i => {
            fixTypeMissingFields(i.type);
          });
        });
        return ops;
      },
    });
  }

  listOperatorCategories(): Observable<PipelineOperator.Category[]> {
    return this._http.get('config/operator-categories');
  }

  isFanInAvailable(type: PipelineDataType): boolean {
    return (
      this.isPipelineDataTypeComplex(type)
      && (type as PipelineDataType.Complex).definition === LIST_TYPE_DEFINITION
      && (type as PipelineDataType.Complex).typeArguments.length === 1
    );
  }

  canConnectIOs(output: PipelineOperator.Output, input: PipelineOperator.Input, fanIn: boolean = false): boolean {
    if (fanIn && this.isFanInAvailable(input.type)) {
      return this.dataTypesAreCompatible(
        output.type,
        (input.type as PipelineDataType.Complex).typeArguments[0],
        input.covariate,
      );
    }
    return this.dataTypesAreCompatible(output.type, input.type, input.covariate);
  }

  defaultOperatorParameters(
    operator: PipelineOperator,
  ): ParameterValues {
    const allValues = operator.params.reduce((acc: ParameterValues, param: PipelineOperator.OperatorParameterDefinition) => {
      if ('defaults' in param && param.defaults.length) {
        acc[param.name] = param.multiple ? param.defaults : param.defaults[0];
      }
      return acc;
    }, {});

    const availableParams = operator.params.reduce((acc: string[], param: PipelineOperator.OperatorParameterDefinition) => {
      if (this.isParameterAvailable(param, allValues)) {
        acc.push(param.name);
      }
      return acc;
    }, []);

    return _.pick(allValues, ...availableParams);
  }

  isParameterAvailable(
    definition: ParameterDefinition,
    values: ParameterValues,
    pipelineParameters: {[key: string]: string} = null,
  ): boolean {
    const fixedDefinition = pipelineParameters
      ? {
        ...definition,
        conditions: _.omitBy(definition.conditions, (_c, paramName) => paramName in pipelineParameters),
      }
      : definition;

    return ParameterDefinition.isParameterAvailable(fixedDefinition, values);
  }

  // this is the same as baile.services.pipeline.PipelineValidator#dataTypesAreCompatible
  dataTypesAreCompatible(
    from: PipelineDataType,
    to: PipelineDataType,
    covariate: boolean,
  ): boolean {
    if (this.isPipelineDataTypeComplex(from) && this.isPipelineDataTypeComplex(to)) {
      const findCompatibleFrom = (from: PipelineDataType.Complex): PipelineDataType.Complex => {
        if (from.definition === to.definition) {
          return from;
        } else if (covariate) {
          return (from.parents || []).map(findCompatibleFrom).find(_ => !!_);
        } else {
          return null;
        }
      };

      const compatibleFrom = findCompatibleFrom(from);

      if (compatibleFrom) {
        const typeArgumentsFrom = compatibleFrom.typeArguments;
        const typeArgumentsTo = to.typeArguments;

        return typeArgumentsFrom.length === typeArgumentsTo.length &&
          _.zip(typeArgumentsFrom, typeArgumentsTo)
            .every(([typeArgumentFrom, typeArgumentTo]) => this.dataTypesAreCompatible(
              typeArgumentFrom,
              typeArgumentTo,
              covariate,
            ));
      } else {
        return false;
      }
    } else {
      return _.isEqual(from, to);
    }
  }

  isPipelineDataTypePrimitive(type: PipelineDataType): type is PipelineDataType.Primitive {
    return typeof type === 'string';
  }

  isPipelineDataTypeComplex(type: PipelineDataType): type is PipelineDataType.Complex {
    return typeof type !== 'string';
  }

  public listAllOperators(): Observable<PipelineOperator[]> {
    return listAll<PipelineOperator, IListRequest>(this.listOperators.bind(this), {});
  }

  public getTypeDescription(type: PipelineDataType): string {
    if (this.isPipelineDataTypeComplex(type)) {
      if (type.typeArguments && type.typeArguments.length) {
        return `${type.definition}[${type.typeArguments.map(_ => this.getTypeDescription(_)).join(',')}]`;
      } else {
        return type.definition;
      }
    } else {
      return type;
    }
  }

  protected _getChildAssets(item: Pipeline): IAssetReference[] {
    return item.assets;
  }
}

declare module '../core/services/event.service' {
  export namespace IEvent {
    export const enum Type {
      CREATE_PIPELINE = 'CREATE_PIPELINE',
      UPDATE_PIPELINE = 'UPDATE_PIPELINE',
      DELETE_PIPELINE = 'DELETE_PIPELINE',
      UPDATE_PIPELINE_LIST = 'UPDATE_PIPELINE_LIST',
    }
  }
}

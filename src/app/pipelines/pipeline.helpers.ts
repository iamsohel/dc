import * as _ from 'lodash';

import { IAssetReference, TObjectId } from '../core/interfaces/common.interface';
import { AssetReferenceParameterDefinition, ParameterDefinition } from '../core/interfaces/params.interface';

import { Pipeline, PipelineOperator } from './pipeline.interfaces';

export function getPipelineParameters(pipeline: Pipeline, operators: PipelineOperator[]): {[stepId: string]: ParameterDefinition[]} {
  const operatorsById = _.keyBy(operators, _ => _.id);
  return pipeline.steps.filter(step => !!step.pipelineParameters).reduce((acc, step) => {
    const stepPipelineParams: ParameterDefinition[] = operatorsById[step.operator].params
      .filter(param => param.name in step.pipelineParameters)
      .map((param) => {
        return {...param,
          caption: step.pipelineParameters[param.name] || param.caption,
          conditions: _.pickBy(param.conditions, (_c, paramName) => paramName in step.pipelineParameters),
        };
      });
    acc[step.id] = stepPipelineParams;
    return acc;
  }, {});
}

export function getStepSelectedAssets(step: Pipeline.Step, availableOperators: PipelineOperator[]): IAssetReference[] {
  const stepOperator = availableOperators.find(operator => operator.id === step.operator);
  if (!stepOperator || !stepOperator.params) {
    return [];
  }
  const assetParameters = stepOperator.params.filter(_ => _.type === 'assetReference') as AssetReferenceParameterDefinition[];
  if (!assetParameters.length) {
    return [];
  }
  return assetParameters.reduce((acc, parameter) => {
    if (parameter.name in step.params) {
      acc.push({type: parameter.assetType, id: <TObjectId> step.params[parameter.name]});
    }
    return acc;
  }, <IAssetReference[]> []);
}

import { InjectionToken, Type } from '@angular/core';

import { IAsset } from '../core/interfaces/common.interface';
import { Feature } from '../core/interfaces/feature-toggle.interface';

import { IExperimentPipelineForm } from './experiment-pipeline.component';
import { IExperimentResultView } from './experiment-result.component';


export interface IAbstractExperimentPipeline {}

export interface IAbstractExperimentResult {}

export interface IExperiment extends IAsset {
  status: IExperiment.Status;
  type: ExperimentType;
}

export interface IExperimentFull<
  P extends IAbstractExperimentPipeline = IAbstractExperimentPipeline,
  R extends IAbstractExperimentResult = IAbstractExperimentResult,
> extends IExperiment {
  pipeline: P;
  result?: R;
  isInteractive: boolean;
}

export interface ExecutionTarget {
  name: string;
  serviceId?: string;
  targetId?: string;
}

export interface IExperimentCreate {
  name: string;
  type: ExperimentType;
  serviceId?: string;
  targetId?: string;
  description?: string;
  pipeline: IAbstractExperimentPipeline;
  isInteractive?: boolean;
  useGpu?: boolean;
}

export interface IExperimentUpdate {
  name?: string;
  description?: string;
}

export interface IExperimentPipelineUpdate {
  type: ExperimentType;
  pipeline: IAbstractExperimentPipeline;
}

export namespace IExperiment {
  export enum Status {
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
    CANCELLED = 'CANCELLED',
  }
}

export interface IExperimentAdditionalAction {
  title: string;
  disabled: boolean;
  action: () => void;
}

export interface ExperimentTypeDefinition {
  type: ExperimentType;
  name: string;
  allowExecutionTarget?: boolean;
  pipelineComponent: Type<IExperimentPipelineForm<IAbstractExperimentPipeline>>;
  resultComponent: Type<IExperimentResultView>;
  resultComponentHandlesErrors?: boolean;
  interactive?: {
    mainComponent: Type<IExperimentResultView>,
    sideComponent: Type<{}>,
  };
  features: Feature[];
}

export const EXPERIMENT_TYPES: InjectionToken<ExperimentTypeDefinition[]> =
  new InjectionToken('ExperimentTypeDefinition');

export const enum ExperimentType {
  // to be extended by feature providers
}

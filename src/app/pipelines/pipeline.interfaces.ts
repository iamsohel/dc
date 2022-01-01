import {
  IAsset,
  IAssetReference,
  TObjectId,
} from '../core/interfaces/common.interface';
import { ParameterDefinition, ParameterValues } from '../core/interfaces/params.interface';
import { IAbstractExperimentPipeline, IAbstractExperimentResult } from '../experiments/experiment.interfaces';
import { IConfusionMatrix } from '../train/train.interface';

import { ICanvasCoordinates } from './pipeline-canvas.interfaces';

export interface Pipeline extends IAsset {
  steps: Pipeline.StepInfo[];
  readonly assets: IAssetReference[];
}

export namespace Pipeline {
  export interface Step {
    id: TObjectId; // arbitrary ID given to the step, unique within the pipeline
    name?: string;
    operator: TObjectId; // PipelineOperator.id
    inputs: {
      [inputName: string]: InputValue; // maps inputName referring the input of an operator with output of another step
    };
    params: ParameterValues;
    coordinates?: ICanvasCoordinates;
    customName?: string;
  }

  export type PipelineParameters = { [key: string]: string };

  export interface StepInfo extends Step {
    pipelineParameters: PipelineParameters;
  }

  export interface OutputReference {
    stepId: string;
    outputIndex: number; // index of output, according to PipelineOperator.outputs
  }

  export type InputValue = OutputReference | OutputReference[];
}

export interface PipelineCreate {
  name: string;
  description?: string;
  steps: Pipeline.StepInfo[];
}

export interface PipelineUpdate {
  name?: string;
  description?: string;
  steps?: Pipeline.StepInfo[];
}

export interface IPipelineClone {
  name?: string;
  description?: string;
  copySelectedAssets?: boolean;
}

export interface PipelineOperator {
  id: TObjectId;
  name: string;
  description?: string;
  className: string;
  moduleName: string;
  packageName: string;
  packageVersion?: string;
  category: string;
  customComponent?: PipelineOperator.ComponentReference;
  customEdaComponents?: PipelineOperator.ComponentReference[];
  inspections?: PipelineOperator.Inspection[];
  inputs: PipelineOperator.Input[];
  outputs: PipelineOperator.Output[];
  params: PipelineOperator.OperatorParameterDefinition[];
}

export namespace PipelineOperator {
  export interface ComponentReference {
    name: string;
    path?: string;
    parameters?: {[key: string]: any};
  }

  export type OperatorParameterDefinition = ParameterDefinition & {
    customComponent?: PipelineOperator.ComponentReference,
  };

  export interface Inspection {
    name: string;
    functionName: string;
    moduleName: string;
    packageName?: string;
    packageVersion?: string;
    functionArgs?: {[key: string]: any};
  }

  export interface Category {
    id: string;
    name: string;
    icon: string;
  }

  export interface Input {
    name: string;
    caption?: string;
    description?: string;
    type: PipelineDataType;
    covariate: boolean;
    optional?: boolean;
    fanIn?: boolean;
  }

  export interface Output {
    caption?: string;
    description?: string;
    type: PipelineDataType;
  }
}

export type PipelineDataType = PipelineDataType.Primitive | PipelineDataType.Complex;

export namespace PipelineDataType {
  export interface Complex {
    definition: string;
    parents?: PipelineDataType.Complex[];
    typeArguments: PipelineDataType[];
  }

  export type Primitive = 'string' | 'integer' | 'float' | 'boolean';
}

export namespace IGenericExperiment {
  export interface Pipeline extends IAbstractExperimentPipeline {
    steps: Pipeline.Step[];
    readonly assets?: IAssetReference[];
  }

  export interface Result extends IAbstractExperimentResult {
    steps: IGenericExperiment.StepResult[];
    assets: IAssetReference[];
  }

  export interface StepResultBase {
    stepId: string;
    assets: IAssetReference[];
    executionTime: number;
  }

  export type StepResult = StepErrorResult | StepResultSuccess;

  export interface StepResultSuccess extends StepResultBase {
    summaries: OperatorApplicationSummary[];
    outputValues: {
      [key: string]: number | string | boolean,
    };
  }

  export interface StepErrorResult extends StepResultBase {
    errorMessage: string;
  }

  export type OperatorApplicationSummary = SimpleSummary | ConfusionMatrixSummary | TableSummary;

  export enum SummaryType {
    CONFUSION_MATRIX = 'CONFUSION_MATRIX',
    SIMPLE = 'SIMPLE',
    TABLE = 'TABLE',
  }

  export interface SimpleSummary {
    type: SummaryType.SIMPLE;
    values: {
      [key: string]: number | string | boolean;
    };
  }

  export interface TableSummary {
    type: SummaryType.TABLE;
    name: string;
    columns: TableSummaryColumn[];
    values: TableSummaryValue[][];
  }

  export interface TableSummaryColumn {
    name: string;
  }

  export type TableSummaryValue = number | string | boolean | null;

  export interface ConfusionMatrixSummary {
    type: SummaryType.CONFUSION_MATRIX;
    labels: string[];
    rows: IConfusionMatrix;
  }
}

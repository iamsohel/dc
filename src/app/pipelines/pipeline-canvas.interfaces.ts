// Internal interfaces for canvas

import { InteractiveExperiment } from './experiment-interactive-session.class';
import { Pipeline, PipelineOperator } from './pipeline.interfaces';

export interface ICanvasCoordinates {
  x: number;
  y: number;
}

export interface ICanvasOperatorInput {
  input: PipelineOperator.Input;
  endpoints: any[]; // hack for jsplumb types
}

export interface ICanvasOperatorOutput {
  output: PipelineOperator.Output;
  endpoint: any; // hack for jsplumb types
  index: number;
}

export interface ICanvasOperator {
  el: HTMLElement;
  operator: PipelineOperator;
  inputs: ICanvasOperatorInput[];
  outputs: ICanvasOperatorOutput[];
  stepId: string;
}

export interface ICanvasStep extends Pipeline.StepInfo {
  canvasOperator: ICanvasOperator;
  interactiveStatus: InteractiveExperiment.StepStatus;
  interactiveWaitingForStatus: boolean;
  interactiveLastError: string;
  interactiveLastResult: InteractiveExperiment.Response.IPipelineStepStatusResult;
}


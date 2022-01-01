import { Observable } from 'rxjs/Observable';

import { ParameterDefinition, ParameterValueType, ParameterValues } from '../../core/interfaces/params.interface';
import { OutputIndex } from '../experiment-interactive-session.class';
import { Pipeline, PipelineOperator } from '../pipeline.interfaces';

export namespace CustomComponent {
  export type InspectionInvoker = (
    inspectionName: string,
    inspectStepId: string,
    functionArgs: { [key: string]: ParameterValueType | OutputIndex | any },
  ) => Observable<any>;

  export type DirectInspectionInvoker = (
    packageName: string,
    packageVersion: string | null,
    moduleName: string,
    functionName: string,
    inspectStepId: string,
    functionArgs: { [key: string]: ParameterValueType | OutputIndex | any },
  ) => Observable<any>;

  interface IBaseContext {
    operator: PipelineOperator;
    parameterValues: ParameterValues;
    inputs: { [inputName: string]: Pipeline.OutputReference | Pipeline.OutputReference[] };
    stepId: string;
    invoker: InspectionInvoker;
    directInvoker: DirectInspectionInvoker;
    disabled: boolean;
  }

  export interface IOperatorContext extends IBaseContext {

  }
  export interface IParameterContext extends IBaseContext {
    parameter: ParameterDefinition;
  }
  export interface IEDAContext extends IBaseContext {

  }

  export interface IOperatorComponent {
    valuesChange: Observable<ParameterValues>;
    validityChange: Observable<boolean>;
    setContext(context: IOperatorContext): void;
    configure(options?: {[key: string]: any}): void;
  }

  export interface IParameterComponent {
    valueChange: Observable<ParameterValueType>;
    setContext(context: IParameterContext): void;
    configure(options?: {[key: string]: any}): void;
  }

  export interface IEDAComponent {
    setContext(context: IEDAContext): void;
    configure(options?: {[key: string]: any}): void;
  }
}

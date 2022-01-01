import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import { _throw } from 'rxjs/observable/throw';
import { concat } from 'rxjs/operators/concat';
import { delay } from 'rxjs/operators/delay';
import { retryWhen } from 'rxjs/operators/retryWhen';
import { take } from 'rxjs/operators/take';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { IAssetReference } from '../core/interfaces/common.interface';
import { ParameterValueType, ParameterValues } from '../core/interfaces/params.interface';
import { IProcess } from '../core/interfaces/process.interface';
import { AppHttp } from '../core/services/http.service';
import { ProcessService } from '../core/services/process.service';

import { IGenericExperiment, Pipeline } from './pipeline.interfaces';

export interface OutputIndex {
  _outputIndex: number;
}

export namespace InteractiveExperiment {
  export enum StepStatus {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING',
    ERROR = 'ERROR',
    READY = 'READY',
  }
  export namespace Request {
    export interface PushPipelineStep  {
      stepId: string;
      operator: string;
      inputs: { // maps inputName referring the input of an operator with output of another step
        [inputName: string]: Pipeline.OutputReference | Pipeline.OutputReference[];
      };
      params: ParameterValues;
    }
    export interface DropPipelineStep  {
      stepId: string;
    }
    export interface InspectPipelineStep  {
      requestId: string;
      stepId: string;
      packageName: string;
      packageVersion?: string;
      moduleName: string;
      functionName: string;
      functionArgs: { [key: string]: ParameterValueType | OutputIndex | any };
    }
  }

  export namespace Response {
    export interface StepPushRejection {
      stepId: string;
      error: string;
    }
    export interface IPipelineStepStatusResult {
      assets: IAssetReference[];
      summaries: IGenericExperiment.OperatorApplicationSummary[];
      outputValues: {
        [key: string]: number | string | boolean,
      };
      executionTime: number;
    }
    export interface PipelineStepStatus {
      stepId: string;
      status: StepStatus;
      errorMessage?: string;
      result?: IPipelineStepStatusResult;
    }
    export interface PipelineStatus {
      steps: PipelineStepStatus[];
      inProcessOfCompleting: boolean;
    }
    export interface StepInspectionResult {
      requestId: string;
      result?: any;
      error?: string;
    }
  }

  enum MessageType {
    PUSH_PIPELINE_STEP = 'PUSH_PIPELINE_STEP',
    DROP_PIPELINE_STEP = 'DROP_PIPELINE_STEP',
    STEP_PUSH_REJECTION = 'STEP_PUSH_REJECTION',
    PIPELINE_STEP_STATUS = 'PIPELINE_STEP_STATUS',
    PIPELINE_STATUS = 'PIPELINE_STATUS',
    INSPECT_PIPELINE_STEP = 'INSPECT_PIPELINE_STEP',
    STEP_INSPECTION_RESULT = 'STEP_INSPECTION_RESULT',
    GET_PIPELINE_STATUS = 'GET_PIPELINE_STATUS',
    FINISH_PIPELINE = 'FINISH_PIPELINE',
  }

  export interface Message {
    type: MessageType;
  }
  export enum Status {
    CONNECTING= 'CONNECTING',
    INITIALIZING = 'INITIALIZING',
    READY = 'READY',
    COMPLETING = 'COMPLETING',
    CLOSED = 'CLOSED',
  }

  const WS_RETRY_DELAY_MS = 2000;
  const WS_RETRIES = 50;

  export class Session {
    readonly process: IProcess;
    readonly status = new BehaviorSubject<Status>(Status.CONNECTING);
    readonly onStepPushRejection = new Subject<Response.StepPushRejection>();
    readonly onPipelineStepStatus = new Subject<Response.PipelineStepStatus>();
    readonly onPipelineStatus = new Subject<Response.PipelineStatus>();
    readonly onStepInspectionResult = new Subject<Response.StepInspectionResult>();
    readonly pipelineResult = new Subject<IGenericExperiment.Result>();
    readonly onError = new Subject<any>();

    private websocket$: WebSocketSubject<any>;
    private subscription: Subscription = null;
    private requestSeq = 0;
    private processService: ProcessService;
    private _result: IGenericExperiment.Result = {
      assets: [],
      steps: [],
    };
    private _connected: boolean = false;

    constructor(appHttp: AppHttp, url: string, processService: ProcessService, process: IProcess) {
      this.websocket$ = appHttp.webSocket<any>(
        url,
        { next: () => {
          this.status.next(InteractiveExperiment.Status.INITIALIZING);
          this.getPipelineStatus();
        } },
        { next: () => { this.status.next(InteractiveExperiment.Status.CLOSED); } },
      );
      this.open();
      this.processService = processService;
      this.process = process;
    }

    public get connected(): boolean {
      return this._connected;
    }

    public open() {
      if (!this.subscription) {
        this.subscription = this.websocket$.pipe(
          retryWhen(
            errors => errors.pipe(
              delay(WS_RETRY_DELAY_MS),
              take(WS_RETRIES),
              concat(_throw('Failed to connect to interactive experiment')),
            ),
          ),
        ).subscribe(
          message => {
            if (typeof message === 'string') {
              message = JSON.parse(message);
            }
            const type = message.type || '';
            const payload = _.omit(message, ['type']);
            switch (type) {
              case MessageType.PIPELINE_STATUS:
                const pipelineStatusPayload = payload as Response.PipelineStatus;
                const newSessionStatus = pipelineStatusPayload.inProcessOfCompleting
                  ? InteractiveExperiment.Status.COMPLETING
                  : InteractiveExperiment.Status.READY;
                if (this.status.getValue() !== newSessionStatus) {
                  this.status.next(newSessionStatus);
                }
                this._result = {...this._result, steps: pipelineStatusPayload.steps
                  .filter(_ => _.status !== StepStatus.RUNNING)
                  .map(this._convertToExperimentStepStatus)};
                this.onPipelineStatus.next(pipelineStatusPayload);
                this.pipelineResult.next(this._result);
                break;
              case MessageType.PIPELINE_STEP_STATUS:
                if ((payload as Response.PipelineStepStatus).status !== StepStatus.RUNNING) {
                  this._result = {...this._result, steps: [
                      this._convertToExperimentStepStatus(payload as Response.PipelineStepStatus),
                      ...this._result.steps.filter(_ => _.stepId !== payload.stepId),
                    ]};
                  this.pipelineResult.next(this._result);
                }
                this.onPipelineStepStatus.next(payload as Response.PipelineStepStatus);
                break;
              case MessageType.STEP_PUSH_REJECTION:
                this.onStepPushRejection.next(payload as Response.StepPushRejection);
                break;
              case MessageType.STEP_INSPECTION_RESULT:
                this.onStepInspectionResult.next(payload as Response.StepInspectionResult);
                break;
              default:
                this.onError.next(payload);
                break;
            }
          },
          err => {
            this.onError.next(err);
          },
        );

        this.subscription.add(this.status.subscribe(status => {
          this._connected = status === Status.READY || status === Status.COMPLETING;
        }));
      }
    }

    public close() {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    }

    public pushPipelineStep(data: Request.PushPipelineStep): void {
      this.websocket$.next(JSON.stringify({...data, type: MessageType.PUSH_PIPELINE_STEP }));
    }

    public dropPipelineStep(data: Request.DropPipelineStep): void {
      this.websocket$.next(JSON.stringify({...data, type: MessageType.DROP_PIPELINE_STEP }));
    }

    public getPipelineStatus(): void {
      this.websocket$.next(JSON.stringify({ type: MessageType.GET_PIPELINE_STATUS }));
    }

    public inspectPipelineStep(data: Request.InspectPipelineStep): void {
      this.websocket$.next(JSON.stringify({...data, type: MessageType.INSPECT_PIPELINE_STEP }));
    }

    public finishPipeline(): void {
      this.websocket$.next(JSON.stringify({ type: MessageType.FINISH_PIPELINE }));
      this.getPipelineStatus();
    }

    public generateRequestId(): string {
      this.requestSeq++;
      return String(Date.now() + this.requestSeq);
    }

    public cancelExperiment() {
      this.processService.cancel(this.process);
    }

    private _convertToExperimentStepStatus(result: Response.PipelineStepStatus): IGenericExperiment.StepResult {
      return result.status === StepStatus.READY
        ? <IGenericExperiment.StepResultSuccess> {stepId: result.stepId, ...result.result}
        : <IGenericExperiment.StepErrorResult> {...result, assets: [], executionTime: 0};
    }
  }
}

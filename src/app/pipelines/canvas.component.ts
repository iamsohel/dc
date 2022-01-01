import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {
  DragEventCallbackOptions,
  jsPlumb,
  jsPlumbInstance,
} from 'jsplumb';
import * as _ from 'lodash';
import { DragDropData } from 'ng2-dnd';
import createPanZoom, { PanZoom } from 'panzoom';
import { of } from 'rxjs/observable/of';
import { _throw } from 'rxjs/observable/throw';
import { first } from 'rxjs/operators/first';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { timeout } from 'rxjs/operators/timeout';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import {
  IModalButton,
  ModalComponent,
} from '../core-ui/components/modal.component';
import { IAssetReference } from '../core/interfaces/common.interface';
import { ParameterValues } from '../core/interfaces/params.interface';
import { NotificationService } from '../core/services/notification.service';
import { ReactiveLoader } from '../utils/reactive-loader';

import { UpgradeData } from './canvas-upgrade-button.component';
import { pipelineCanvasConfig } from './canvas.config';
import { CustomComponent } from './custom-components/custom-component.interfaces';
import { InteractiveExperiment } from './experiment-interactive-session.class';
import { OperatorInfoModalComponent } from './operator-info-modal.component';
import { PipelineOperatorPositioningService } from './operator-positioning.service';
import {
  ICanvasCoordinates,
  ICanvasOperator,
  ICanvasOperatorInput,
  ICanvasOperatorOutput,
  ICanvasStep,
} from './pipeline-canvas.interfaces';
import { getStepSelectedAssets } from './pipeline.helpers';
import {
  IGenericExperiment,
  Pipeline,
  PipelineDataType,
  PipelineOperator,
} from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

@Component({
  selector: 'app-pipeline-canvas',
  template: `
    <ng-container *ngIf="steps | apply: isPublishedData: availableOperators; else notPublished">
    <app-spinner [visibility]="initialDataLoader.active | async"></app-spinner>
    <div
      class="pipeline-canvas-wrapper app-spinner-box"
      #canvasWrapper
      [adaptiveHeight]="{
        minHeight: 500,
        pageMargin: 20,
        property: 'min-height',
        keepOnScreen: true
      }"
    >
      <app-spinner [visibility]="interactiveSession | apply: _showCanvasSpinner: interactiveSession && interactiveSession.status.getValue()">
        <div class="interactive-initialization-message">Initializing interactive session</div>
      </app-spinner>
      <div class="buttons-panel">
        <canvas-upgrade-button
          *ngIf="isEditMode"
          [operators]="availableOperators"
          [steps]="steps"
          (onUpgrade)="onUpgrade($event)"
          (outdatedSteps)="onOutdatedSteps($event)"
        ></canvas-upgrade-button>
        <ng-container *ngIf="interactiveSession">
          <ng-container *ngIf="isEditMode">
            <button
              class="btn btn-success"
              title="Run pipeline"
              (click)="_interactivePushAllSteps()"
              [disabled]="interactiveSession.status.getValue() !== '${InteractiveExperiment.Status.READY}'"
            >
              <i class="glyphicon glyphicon-play"></i>
              Run
            </button>
            <button
              class="btn btn-primary"
              title="Finalize experiment"
              (click)="interactiveSession.finishPipeline()"
              [disabled]="interactiveSession.status.getValue() !== '${InteractiveExperiment.Status.READY}'"
            >
              <i class="glyphicon glyphicon-stop"></i>
              Finalize
            </button>
          </ng-container>
          <button
            class="btn btn-primary"
            title="Cancel experiment"
            (click)="interactiveSession.cancelExperiment()"
            [disabled]="!interactiveSession.connected"
          >
            <i class="glyphicon glyphicon-stop"></i>
            Cancel
          </button>
          <div
            class="interactive-status"
            [ngClass]="interactiveSession.status | async | apply: _interactiveStatusClass"
            (click)="interactiveSession.getPipelineStatus()"
          ></div>
        </ng-container>
      </div>
      <div
        class="pipeline-canvas canvas-grid jtk-surface"
        [ngClass]="{interactive: interactiveSession && interactiveSession.status.getValue() === '${InteractiveExperiment.Status.READY}'}"
        #canvas
        dnd-droppable
        (onDropSuccess)="onDrop($event)"
      ></div>
      <div class="zoom-buttons">
        <button
          class="btn btn-primary"
          (click)="_zoomIn($event)"
          [disabled]="isDisabledZoomIn"
          title="Zoom In"><i class="fa fa-plus" aria-hidden="true"></i></button>
        <button
          class="btn btn-primary"
          (click)="_zoomOut($event)"
          [disabled]="isDisabledZoomOut"
          title="Zoom Out"><i class="fa fa-minus" aria-hidden="true"></i></button>
      </div>
    </div>
    <app-modal #editModeWarningModal
      [captionPrefix]="'Warning'"
      [caption]="'Not in edit mode'"
      [buttons]="[{
        'class': 'btn-primary',
        'title': 'OK'
      }]"
      (buttonClick)="_editModeWarningModal.hide()"
    >
      You are not in edit mode. Please click Edit button to start editing.
    </app-modal>

    <app-modal
      #stepParamsModal
      [caption]="selectedStep?.canvasOperator.operator.name + ' Parameters'"
      [buttons]="getParamsModalButtons | call: isEditMode: selectedStepParamsIsValid: !!interactiveSession: (selectedStep && selectedStep.interactiveStatus)"
      (buttonClick)="onStepParamsModalClick($event)"
      [limitedHeight]="true"
      [sizeClass]="config.modal.size.XLARGE"
    >
      <div class="row">
        <div class="col-md-4" *ngIf="selectedStep && _stepParamsModal.shown">
          <app-input
            label="Operator Name"
            [(value)]="selectedCustomName"
            [disabled]="!isEditMode || (interactiveSession && interactiveSession.status.getValue() !== '${InteractiveExperiment.Status.READY}')"
            helpText="Rename this operator"
            ></app-input>
        </div>
      </div>
      <ng-container *ngIf="selectedStep && _stepParamsModal.shown && selectedStep?.canvasOperator.operator.params.length">
        <div class="tabpanel" *ngIf="selectedStep.interactiveStatus !== '${InteractiveExperiment.StepStatus.IDLE}' || (selectedStep.canvasOperator.operator | apply: _canEnableFanInOperator)" style="margin-bottom: 5px;">
          <ul class="nav nav-tabs" role="tablist">
            <li role="presentation" [ngClass]="{'active': selectedStepActiveTab === 0}">
              <a (click)="selectedStepActiveTab = 0">Parameters</a>
            </li>
            <li role="presentation" [ngClass]="{'active': selectedStepActiveTab === 2, 'hidden': !(selectedStep.canvasOperator.operator | apply: _canEnableFanInOperator) }">
              <a (click)="selectedStepActiveTab = 2">Input types</a>
            </li>
            <li role="presentation" [ngClass]="{'active': selectedStepActiveTab === 1, 'hidden': selectedStep.interactiveStatus === '${InteractiveExperiment.StepStatus.IDLE}' }">
              <a (click)="selectedStepActiveTab = 1">Results</a>
            </li>
          </ul>
        </div>
        <pipeline-operator-params
          [hidden]="selectedStepActiveTab !== 0"
          [operator]="selectedStep.canvasOperator.operator"
          [step]="selectedStep"
          [parameters]="selectedStep.canvasOperator.operator.params"
          [pipelineParameters]="(pipelineEditor && !interactiveSession) ? selectedStep.pipelineParameters : null"
          (pipelineParametersChange)="selectedStepPipelineParams = $event"
          [value]="selectedStep.params"
          (valueChange)="selectedStepParams = $event"
          (validityChange)="selectedStepParamsIsValid = $event"
          [interactiveInspectionInvoker]="selectedStep | apply: _getInvoker: interactiveSession"
          [interactiveDirectInspectionInvoker]="selectedStep | apply: _getDirectInvoker: interactiveSession"
          [disabled]="!isEditMode || (interactiveSession && interactiveSession.status.getValue() !== '${InteractiveExperiment.Status.READY}')"
        ></pipeline-operator-params>
        <div [hidden]="selectedStepActiveTab !== 1">
          <div class="row" *ngIf="selectedStep.interactiveLastError">
            <div class="col col-md-12 col-xs-12">
              <pre class="pre-scrollable auto-hide-scrollbar" style="border: none">{{selectedStep.interactiveLastError}}</pre>
            </div>
          </div>
          <pipeline-experiment-step-result
            *ngIf="selectedStep.interactiveLastResult"
            [result]="selectedStep.interactiveLastResult | apply: _getStepResultSuccess: selectedStep.id"
            [selectedAssets]="selectedStep | apply: getStepSelectedAssets: availableOperators"
          ></pipeline-experiment-step-result>
        </div>
        <div [hidden]="selectedStepActiveTab !== 2">
          The following inputs can accept different types.
          <table>
            <tr *ngFor="let input of selectedStep.canvasOperator.operator.inputs | filter: _canEnableFanInInput">
              <td><strong>{{input.name}}</strong></td>
              <td>
                <app-check
                  [label]="'Single ' + input.type.definition + '[' + (input.type.typeArguments[0] | apply: getTypeDescription) + ']'"
                  type="radio"
                  [name]="input.name"
                  [value]="false"
                  [checked]="selectedStepInputsFanIn[input.name] === false"
                  (checkedChange)="selectedStepInputsFanIn[input.name] = false"
                  [disabled]="!isEditMode || (interactiveSession && interactiveSession.status.getValue() !== '${InteractiveExperiment.Status.READY}')"
                ></app-check>
              </td>
              <td>
                <app-check
                  [label]="'Multiple ' + (input.type.typeArguments[0] | apply: getTypeDescription)"
                  type="radio"
                  [name]="input.name"
                  [value]="true"
                  [checked]="selectedStepInputsFanIn[input.name] === true"
                  (checkedChange)="selectedStepInputsFanIn[input.name] = true"
                  [disabled]="!isEditMode || (interactiveSession && interactiveSession.status.getValue() !== '${InteractiveExperiment.Status.READY}')"
                ></app-check>
              </td>
            </tr>
          </table>
        </div>
      </ng-container>
    </app-modal>

    <operator-info-modal #operatorInfoModal></operator-info-modal>

    <app-modal
      #stepRemovalConfirmationModal
      [caption]="'Remove step'"
      [buttons]="[
        { 'id': 'yes', 'class': 'btn-danger', 'title': 'Yes' },
        { 'id': 'no', 'class': 'btn-default', 'title': 'No' }
      ]"
      (buttonClick)="onStepRemovalConfirmed($event)"
    >
      <p
        *ngIf="selectedStep"
      >
        Are you sure you want to delete this operator:
        {{selectedStep.name || selectedStep.canvasOperator.operator.name}}?
      </p>
    </app-modal>
    </ng-container>

    <ng-template #notPublished>
      <div>
        <error-indicator message="Pipeline has operators that are not published or owned by you."></error-indicator>
      </div>
    </ng-template>
  `,
})
export class CanvasComponent implements OnInit, OnChanges, OnDestroy {
  readonly config = config;
  readonly getStepSelectedAssets = getStepSelectedAssets;
  @Input() steps: Pipeline.StepInfo[];
  @Input() isEditMode: boolean = false;
  @Input() availableOperators: PipelineOperator[] = [];
  @Input() pipelineEditor: boolean = true;
  @Input() interactiveSession: InteractiveExperiment.Session = null;
  @Input() result: IGenericExperiment.Result = null;
  @Input() selectedAssets: IAssetReference[] = [];
  @Output() canvasUpdated: EventEmitter<Pipeline.StepInfo[]> = new EventEmitter();

  @ViewChild('editModeWarningModal') _editModeWarningModal: ModalComponent;
  @ViewChild('stepParamsModal') _stepParamsModal: ModalComponent;
  @ViewChild('operatorInfoModal') _operatorInfoModal: OperatorInfoModalComponent;
  @ViewChild('stepRemovalConfirmationModal') _stepRemovalConfirmationModal: ModalComponent;

  categories: {[id: string]: PipelineOperator.Category} = {};
  protected renderer: jsPlumbInstance;
  protected selectedStep: ICanvasStep;
  protected selectedStepActiveTab: number = 0;
  protected selectedStepInputsFanIn: {[inputName: string]: boolean} = {};
  protected selectedStepParams: ParameterValues = {};
  protected selectedStepPipelineParams: Pipeline.PipelineParameters = {};
  protected selectedStepParamsIsValid: boolean = false;
  protected selectedCustomName: string = '';
  protected isDisabledZoomIn: boolean = false;
  protected isDisabledZoomOut: boolean = false;

  private subscriptions: Subscription[] = [];
  // this is not populated if isEditMode==false due to generating component is removed
  private outdatedStepIds: string[] = [];
  private _steps: ICanvasStep[] = [];
  private _panZoom: PanZoom;

  private readonly initialDataLoader: ReactiveLoader<PipelineOperator.Category[], null>;

  @ViewChild('canvas') private _canvasEl: ElementRef;
  @ViewChild('canvasWrapper') private _canvasWrapperEl: ElementRef;

  constructor(
    private readonly _pipelineService: PipelineService,
    private readonly _notificationService: NotificationService,
    private readonly _positioningService: PipelineOperatorPositioningService,
    private zone: NgZone,
  ) {
    this.initialDataLoader = new ReactiveLoader(() => this._pipelineService.listOperatorCategories());
  }

  ngOnInit(): void {
    this.subscriptions.push(this.initialDataLoader.subscribe((categories) => {
      this.categories = _.keyBy(categories, c => c.id);
      if (this.isPublishedData(this.steps, this.availableOperators)) {
        this._initRenderer();
      }
    }));
    this.initialDataLoader.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('isEditMode' in changes && !this.isEditMode) {
      this.outdatedStepIds = [];
    }
    if ('steps' in changes && !changes['steps'].firstChange && this.renderer) {
      this._reloadCanvasWithSteps();
    }
  }

  ngOnDestroy(): void {
    this.renderer && this.renderer.reset();
    this._panZoom && this._panZoom.dispose();

    this.zone.runOutsideAngular(() => {
      window.removeEventListener('scroll', this._updateCanvasSizeAccordingToPanningBound);
      window.removeEventListener('resize', this._updateCanvasSizeAccordingToPanningBound);
    });
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  protected onDrop(event: DragDropData): void {
    const data = event.dragData;
    if (!data || !('pipelineOperator' in data)) {
      return;
    }

    if (!this.isEditMode) {
      this._editModeWarningModal.show();
    } else if (this.renderer) {
      this._addStep(
        this.renderer,
        event.dragData['pipelineOperator'],
        {
          x: this._calculatePlacementCoordinate(event.mouseEvent.offsetX, pipelineCanvasConfig.gridSize[0]),
          y: this._calculatePlacementCoordinate(event.mouseEvent.offsetY, pipelineCanvasConfig.gridSize[1]),
        },
      );
    }
  }

  protected onStepParamsModalClick(btn: IModalButton): void {
    if (btn.id === 'stop') {
      if (this.interactiveSession) {
        this._interactiveDropStepWithChildSteps(this.selectedStep.id);
      }
      this.selectedStepActiveTab = 0;
      return;
    }
    if (btn.id === 'ok' && this.isEditMode) {
      const paramsChanged = !_.isEqual(this.selectedStep.params, this.selectedStepParams);
      this.selectedStep.params = this.selectedStepParams;
      this.selectedStep.pipelineParameters = this.selectedStepPipelineParams;
      this.perhapsUpdateCanvasOperatorName();
      const inputsChanged = this._updateFanIn();
      this._emitCanvasUpdate();
      if (this.interactiveSession && (paramsChanged || inputsChanged)) {
        this._interactiveDropStepWithChildSteps(this.selectedStep.id);
      }
    } else if (btn.id === 'execute') {
      this.selectedStep.params = this.selectedStepParams;
      this.selectedStep.pipelineParameters = this.selectedStepPipelineParams;
      this.perhapsUpdateCanvasOperatorName();
      this._updateFanIn();
      this._emitCanvasUpdate();
      if (this.interactiveSession) {
        this._interactiveDropStepWithChildSteps(this.selectedStep.id);
        this._interactivePushStepWithParentSteps(this.selectedStep.id);
      }
    }
    this._stepParamsModal.hide();
    this.selectedCustomName = '';
    this.selectedStepParams = null;
    this.selectedStepPipelineParams = null;
    this.selectedStepInputsFanIn = {};
  }

  protected _updateFanIn(): boolean {
    let inputsChanged = false;
    const selectedStepInputs = this.selectedStep.inputs;
    const canvasOperator = this.selectedStep.canvasOperator;
    Object.keys(this.selectedStepInputsFanIn).forEach(inputName => {
      const oldFanIn = Array.isArray(selectedStepInputs[inputName]);
      const newFanIn = this.selectedStepInputsFanIn[inputName];
      if (oldFanIn !== newFanIn) {
        inputsChanged = true;
        const canvasInputIndex = canvasOperator.inputs.findIndex(i => i.input.name === inputName);
        const canvasInput = canvasOperator.inputs[canvasInputIndex];
        canvasInput.endpoints.forEach(endpoint => {
          if (endpoint.connections.length) {
            this.renderer.deleteConnection(endpoint.connections[0]);
          }
          this.renderer.deleteEndpoint(endpoint);
        });
        if (newFanIn) {
          selectedStepInputs[inputName] = [];
        } else {
          delete selectedStepInputs[inputName];
        }
        canvasOperator.inputs[canvasInputIndex] = this._initOperatorInput(
          this.renderer, canvasInput.input, this.selectedStep,
        );
      }
    });
    if (inputsChanged) {
      this._updateOperatorSize(canvasOperator);
          // Redraw IOs otherwise they are misplaced:
      this.renderer && setTimeout(() => this.renderer.revalidate(canvasOperator.el));
    }
    return inputsChanged;
  }

  protected onStepRemovalConfirmed(btn: IModalButton): void {
    if (btn.id === 'yes') {
      this.renderer && this.renderer.remove(this.selectedStep.canvasOperator.el);
      if (this.interactiveSession) {
        this._interactiveDropStepWithChildSteps(this.selectedStep.id);
      }
      const index = this._steps.findIndex((_) => this.selectedStep.id === _.id);
      if (index === -1) {
        throw new Error('Can\'t find step id: ' + this.selectedStep.id);
      }

      this._steps.splice(index, 1);

      for (const step of this._steps) {
        for (const inputName of Object.keys(step.inputs)) {
          if (Array.isArray(step.inputs[inputName])) {
            step.inputs[inputName] = (step.inputs[inputName] as Pipeline.OutputReference[]).filter(
              o => o && o.stepId !== this.selectedStep.id,
            );
          } else {
            if ((step.inputs[inputName] as Pipeline.OutputReference).stepId === this.selectedStep.id) {
              delete step.inputs[inputName];
            }
          }
        }
      }

      this._emitCanvasUpdate();
      this.selectedStep = null;
    }
    this._stepRemovalConfirmationModal.hide();
  }

  protected getParamsModalButtons(
    isEditMode: boolean,
    isValid: boolean,
    isInteractive: boolean,
    stepStatus: InteractiveExperiment.StepStatus,
    waitingForStatus: boolean,
  ): IModalButton[] {
    const buttons: IModalButton[] = [];

    if (isInteractive && stepStatus && isEditMode) {
      if (stepStatus === InteractiveExperiment.StepStatus.IDLE) {
        buttons.push({ id: 'execute', class: 'btn-apply', title: 'Execute step', disabled: !isValid || waitingForStatus });
      } else if (stepStatus === InteractiveExperiment.StepStatus.RUNNING) {
        buttons.push({ id: 'stop', class: 'btn-apply', title: 'Stop step', disabled: waitingForStatus});
      } else {
        buttons.push({ id: 'stop', class: 'btn-apply', title: 'Reset step', disabled: waitingForStatus});
      }
    }

    buttons.push({ id: 'ok', class: 'btn-apply', title: 'Ok', disabled: (isEditMode && !isValid) || waitingForStatus });

    if (isEditMode) {
      buttons.push({ id: 'cancel', class: 'btn-clear', title: 'Cancel' });
    }

    return buttons;
  }

  protected isPublishedData(steps: Pipeline.Step[], operators: PipelineOperator[]): boolean {
    let operatorIds = steps.map((data: Pipeline.Step) => data.operator);
    let pipeLineOperatorIds: string[];
    pipeLineOperatorIds = operators.map(_ => _.id);
    return operatorIds.every(_ => pipeLineOperatorIds.includes(_));
  }

  protected onUpgrade(data: UpgradeData) {
    this.canvasUpdated.emit(data.newSteps);
    this.steps = data.newSteps;
    if (this.interactiveSession) {
      data.modifiedStepIds.forEach(stepId => {
        const canvasStep = this._steps.find(_ => _.id === stepId);
        // drop step if interactive
        if (canvasStep.interactiveStatus !== InteractiveExperiment.StepStatus.IDLE) {
          this._interactiveDropStepWithChildSteps(canvasStep.id);
        }
      });
    }
    this._reloadCanvasWithSteps();
    if (this.interactiveSession) {
      this.interactiveSession.getPipelineStatus();
    }
  }

  protected onOutdatedSteps(outdatedSteps: Pipeline.StepInfo[]) {
    this.outdatedStepIds = outdatedSteps.map(_ => _.id);
    this._steps.forEach(canvasStep => {
      canvasStep.canvasOperator.el.classList.toggle('outdated', this.outdatedStepIds.includes(canvasStep.id));
    });
  }

  private _reloadCanvasWithSteps() {
    this.renderer.reset(true);
    this._steps.forEach(canvasStep => canvasStep.canvasOperator.el.remove());
    this._steps = [];
    this._addLoadedSteps(this.renderer);
  }

  private _updateCanvasSizeAccordingToPanningOrZooming = (): void => {
    const $canvas = $(this._canvasEl.nativeElement);
    const $canvasWrapper = $(this._canvasWrapperEl.nativeElement);
    const scale = this._panZoom.getTransform().scale;

    const canvasBottom = $canvas.offset().top + ($canvas.outerHeight(true) * scale);
    const canvasWrapperBottom = $canvasWrapper.offset().top + $canvasWrapper.outerHeight(true);
    const deltaY = (canvasWrapperBottom - canvasBottom) / scale;

    if (deltaY > 0) {
      $canvas.height($canvas.height() + deltaY);
    }

    const canvasRight = $canvas.offset().left + ($canvas.outerWidth(true) * scale);
    const canvasWrapperRight = $canvasWrapper.offset().left + $canvasWrapper.outerWidth(true);
    const deltaX = (canvasWrapperRight - canvasRight) / scale;

    if (deltaX > 0) {
      $canvas.width($canvas.width() + deltaX);
    }
  }

  private _updateCanvasSizeAccordingToPanningBound = () => this._updateCanvasSizeAccordingToPanningOrZooming();

  private _initPanZoom(): void {
    this._panZoom = createPanZoom(
      this._canvasEl.nativeElement,
      {
        minZoom: pipelineCanvasConfig.zoom.minZoomValue,
        maxZoom: pipelineCanvasConfig.zoom.maxZoomLevel,
        smoothScroll: false,
        bounds: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        },
        beforeWheel: () => true,
        zoomDoubleClickSpeed: 1,
      },
    );

    this._panZoom.on('pan', () => this._updateCanvasSizeAccordingToPanningOrZooming());

    // fix for fast panning
    this._panZoom.on('panend', () => setTimeout(this._updateCanvasSizeAccordingToPanningOrZooming.bind(this), 10));

    this._panZoom.on('zoom', () => {
      this._updateCanvasSizeAccordingToPanningOrZooming();
      this.renderer['setZoom'](this._panZoom.getTransform().scale, true);
    });

    // fix canvas size on init
    setTimeout(this._updateCanvasSizeAccordingToPanningOrZooming.bind(this), 10);

    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this._updateCanvasSizeAccordingToPanningBound);
      window.addEventListener('resize', this._updateCanvasSizeAccordingToPanningBound);
    });
  }

  private _initRenderer(): void {
    const renderer = jsPlumb.getInstance(pipelineCanvasConfig.jsPlumbDefaults);
    this.renderer = renderer;

    renderer.ready(() => {
      renderer.registerConnectionType('basic', pipelineCanvasConfig.jsPlumbViewSettings.basicConnectionType);

      this._initPanZoom();

      this._addLoadedSteps(renderer);
      this.interactiveInitialize();

      // Drag started
      renderer.bind('connectionDrag', (e) => this._filterInputs(e));

      // Drag stopped
      renderer.bind('connectionDragStop', () => this._resetInputsFilter());

      // Connection established
      renderer.bind('connection', (e) => this._onNewConnection(e));

      // Connection detached
      renderer.bind('connectionDetached', (e) => this._onConnectionDetached(e));

      // Connection moved
      renderer.bind('connectionMoved', (e) => this._onConnectionMoved(e));
    });
  }

  private _addLoadedSteps(renderer: jsPlumbInstance): void {
    if (this.steps.length) {
      // 1. add operators to canvas
      for (const loadedStep of this.steps) {
        const operator = this.availableOperators.find((_) => _.id === loadedStep.operator);
        if (operator) {
          this._addStep(renderer, operator, null, loadedStep);
        } else {
          throw new Error('Can\'t find operator');
        }
      }

      // 2. connect canvas operators
      for (const loadedStep of this.steps) {
        const step = this._steps.find((_) => _.id === loadedStep.id);
        if (!step) {
          // most likely an operator wasn't found on previous step
          continue;
        }
        for (const inputName of Object.keys(loadedStep.inputs)) {
          const input = step.canvasOperator.inputs.find((_) => _.input.name === inputName);
          if (!input) {
            throw new Error('Can\'t find step input');
          }
          CanvasComponent._inputAsList(loadedStep.inputs[inputName]).forEach((outputRef, index) => {
            const sourceStep = this._steps.find((_) => _.id === outputRef.stepId);
            if (!sourceStep) {
              throw new Error('Can\'t find corresponding step');
            }
            const sourceOutput = sourceStep.canvasOperator.outputs[outputRef.outputIndex];
            if (!sourceOutput) {
              throw new Error('Can\'t find corresponding step output');
            }

            renderer.connect({
              source: sourceOutput.endpoint,
              target: input.endpoints[index],
              connector: [
                'Flowchart',
                {
                  stub: [10, 20],
                  gap: 10,
                  cornerRadius: 5,
                  alwaysRespectStubs: false,
                  midpoint: Math.random() * 0.5 + 0.25,
                },
              ],
            });
          });
        }
      }

      // 3. update statuses
      for (const canvasStep of this._stepsSorted()) {
        const stepResult: IGenericExperiment.StepResult | null = this.result !== null
          ? this.result.steps.find(_ => _.stepId === canvasStep.id) || null
          : null;

        if (stepResult) {
          if ('errorMessage' in stepResult) {
            this._interactiveUpdateStepStatus(canvasStep, InteractiveExperiment.StepStatus.ERROR, false);
            canvasStep.interactiveLastError = stepResult.errorMessage;
          } else {
            this._interactiveUpdateStepStatus(canvasStep, InteractiveExperiment.StepStatus.READY, false);
            canvasStep.interactiveLastResult = stepResult;
          }
        }
      }

      // 4. position operators on canvas automatically
      setTimeout(() => {
        // done in async fashion to let browser calculate operator element sizes
        this._updateStepsCoordinates();
      }, 0);
    }
  }

  private _moveStepTo(step: ICanvasStep, coordinates: ICanvasCoordinates): void {
    const el = step.canvasOperator.el;

    el.style.left = coordinates.x + 'px';
    el.style.top = coordinates.y + 'px';

    step.coordinates = coordinates;

    // Redraw IOs otherwise they are misplaced:
    this.renderer && setTimeout(() => this.renderer.revalidate(el));
  }

  private _updateStepsCoordinates(): void {
    const positions = this._positioningService.calculateStepPositions(
      this._steps,
      this._canvasEl.nativeElement,
      pipelineCanvasConfig.gridSize,
    );

    for (const stepId of Object.keys(positions)) {
      const position = positions[stepId];
      const step = this._steps.find(_ => _.id === stepId);
      if (!step) {
        throw new Error('Could not find step');
      }
      if (position) {
        this._moveStepTo(step, position);
      }
    }
  }

  private _onNewConnection(e: any): void {
    const params = e.connection.getParameters();
    const inputCanvasStep: ICanvasStep = params['inputStep'];
    const outputCanvasStep: ICanvasStep = params['outputStep'];
    const canvasInput: ICanvasOperatorInput = params['input'];
    const canvasOutput: ICanvasOperatorOutput = params['output'];

    if (!inputCanvasStep || !outputCanvasStep || !canvasInput || !canvasOutput) {
      throw new Error('Steps connection data was not provided');
    }

    const input = inputCanvasStep.inputs[canvasInput.input.name];
    if (input && !Array.isArray(input)) {
      throw new Error('This step input is already connected');
    }

    const outputRef: Pipeline.OutputReference = {
      stepId: outputCanvasStep.id,
      outputIndex: canvasOutput.index,
    };
    if (Array.isArray(input)) {
      const inputIndex = canvasInput.endpoints.indexOf(e.targetEndpoint);
      if (inputIndex === input.length) {
        input.push(outputRef);
      } else {
        input[inputIndex] = outputRef;
      }
    } else {
      inputCanvasStep.inputs[canvasInput.input.name] = outputRef;
    }
    if (this.interactiveSession && inputCanvasStep.interactiveStatus !== InteractiveExperiment.StepStatus.IDLE) {
      this._interactiveDropStepWithChildSteps(inputCanvasStep.id);
    }

    this._emitCanvasUpdate();
  }

  private _adjustFanInEndpoints(inputCanvasStep: ICanvasStep, canvasInput: ICanvasOperatorInput) {
    const endpointParameters = {
      inputStep: inputCanvasStep,
      input: canvasInput,
    };
    const inputEndpoints = canvasInput.endpoints;
    if (inputEndpoints[inputEndpoints.length - 1].connections.length) {
      const endpoint = this._createInputEndpoint(
        this.renderer,
        inputCanvasStep.canvasOperator.el,
        endpointParameters,
        this._getInputLabel(canvasInput.input, true),
        canvasInput.input,
        true,
      );
      canvasInput.endpoints.push(endpoint);
    }
    while (inputEndpoints.length > 1 && !inputEndpoints[inputEndpoints.length - 2].connections.length) {
      const endpointToDelete = inputEndpoints.pop();
      this.renderer.deleteEndpoint(endpointToDelete);
    }
    inputEndpoints.forEach((endpoint, index) => {
      if (!canvasInput.input.optional && (index !== inputEndpoints.length - 1 || index === 0)) {
        endpoint.canvas.classList.add('required');
      } else {
        endpoint.canvas.classList.remove('required');
      }
    });
    this._updateOperatorSize(inputCanvasStep.canvasOperator);
  }

  private _onConnectionDetached(e: any): void {
    const params = e.connection.getParameters();
    const inputCanvasStep: ICanvasStep = params['inputStep'];
    const canvasInput: ICanvasOperatorInput = params['input'];

    if (!inputCanvasStep || !canvasInput) {
      throw new Error('Connection data was not provided');
    }

    const input = inputCanvasStep.inputs[canvasInput.input.name];
    if (!input) {
      throw new Error('Step input has no such connection');
    }
    const inputIndex = canvasInput.endpoints.indexOf(e.targetEndpoint);
    CanvasComponent._deleteInputFromCanvasStep(inputCanvasStep, canvasInput.input.name, inputIndex);
    if (this.interactiveSession && inputCanvasStep.interactiveStatus !== InteractiveExperiment.StepStatus.IDLE) {
      this._interactiveDropStepWithChildSteps(inputCanvasStep.id);
    }

    this._emitCanvasUpdate();
  }

  private _onConnectionMoved(e: any): void {
    const params = e.originalTargetEndpoint.getParameters();
    const inputCanvasStep: ICanvasStep = params['inputStep'];
    const canvasInput: ICanvasOperatorInput = params['input'];

    if (!inputCanvasStep || !canvasInput) {
      throw new Error('Connection data was not provided');
    }
    const inputIndex = canvasInput.endpoints.indexOf(e.originalTargetEndpoint);
    CanvasComponent._deleteInputFromCanvasStep(inputCanvasStep, canvasInput.input.name, inputIndex);
    if (this.interactiveSession && inputCanvasStep.interactiveStatus !== InteractiveExperiment.StepStatus.IDLE) {
      this._interactiveDropStepWithChildSteps(inputCanvasStep.id);
    }

    this._emitCanvasUpdate();
  }

  private rescalePositionWithRespectToZoomLevel(position: any): void {
    let currentScale = this._panZoom.getTransform().scale;
    position.left = Math.round((position.left / currentScale) + Number.EPSILON);
    position.top = Math.round((position.top / currentScale) + Number.EPSILON);
  }

  private onStepMoved(event: DragEventCallbackOptions): void {
    const step = this._getStepByElement(event.el);
    const position = $(event.el).position();
    this.rescalePositionWithRespectToZoomLevel(position);
    step.coordinates = {
      x: position.left,
      y: position.top,
    };

    this._panZoom.resume();
    this._emitCanvasUpdate();
  }

  private _emitCanvasUpdate(): void {
    const steps: Pipeline.StepInfo[] = this._steps.map((canvasStep) => {
      return {
        id: canvasStep.id,
        operator: canvasStep.canvasOperator.operator.id,
        inputs: canvasStep.inputs,
        params: canvasStep.params,
        coordinates: canvasStep.coordinates,
        pipelineParameters: canvasStep.pipelineParameters,
        customName: canvasStep.customName,
      };
    });
    this.steps = steps;
    this.canvasUpdated.emit(steps);
  }

  private _filterInputs(e: any): void {
    // Output and operator that were dragged
    const activeOutput: ICanvasOperatorOutput = e.endpoints[0].getParameter('output');
    const activeStep: ICanvasStep = e.endpoints[0].getParameter('outputStep');
    if (!activeStep) {
      throw new Error('Output step wasn\'t provided');
    }

    for (const step of this._steps) {
      const isOwnOutput = step === activeStep;

      for (const canvasInput of step.canvasOperator.inputs) {
        const fanInEnabled = Array.isArray(step.inputs[canvasInput.input.name]);
        const isEndpointEnabled = !isOwnOutput
          && this._pipelineService.canConnectIOs(activeOutput.output, canvasInput.input, fanInEnabled);

        canvasInput.endpoints.forEach(e => {
          e.setEnabled(!e.connections.length && isEndpointEnabled);
          const endpointEl = e.canvas;
          if (!isEndpointEnabled) {
            endpointEl.classList.add('disabled');
          } else {
            endpointEl.classList.remove('disabled');
          }
        });
      }

      for (const output of step.canvasOperator.outputs) {
        const endpointEl = output.endpoint.canvas;
        endpointEl.classList.add('disabled');
      }
    }
  }

  private _resetInputsFilter(): void {
    for (const canvasStep of this._steps) {
      const operator = canvasStep.canvasOperator;
      for (const input of operator.inputs) {
        if (Array.isArray(canvasStep.inputs[input.input.name])) {
          this._adjustFanInEndpoints(canvasStep, input);
        }
        input.endpoints.forEach(e => {
          e.setEnabled(true);
          const endpointEl = e.canvas;
          endpointEl.classList.remove('disabled');
        });
      }

      for (const output of operator.outputs) {
        const endpointEl = output.endpoint.canvas;
        endpointEl.classList.remove('disabled');
      }
    }
  }

  private _makeElementDraggable(renderer: jsPlumbInstance, el: HTMLElement): void {
    if (!this.isEditMode) {
      return;
    }

    renderer.draggable(
      el,
      {
        containment: 'parent',
        start: () => this._panZoom.pause(),
        stop: (e) => this.onStepMoved(e),
      },
    );
  }

  private _initOperatorInput(
    renderer: jsPlumbInstance,
    input: PipelineOperator.Input,
    step: ICanvasStep,
  ): ICanvasOperatorInput {
    const canvasEl = step.canvasOperator.el;
    const canvasOperatorInput: ICanvasOperatorInput = {
      input,
      endpoints: [],
    };

    const endpointParameters = {
      inputStep: step,
      input: canvasOperatorInput,
    };
    const endpointTitle = this._getInputLabel(input, Array.isArray(step.inputs[input.name]));

    const fanInEnabled = Array.isArray(step.inputs[input.name]);
    let numberOfEndpoints = fanInEnabled ? (step.inputs[input.name] as Pipeline.OutputReference[]).length + 1 : 1;
    for (let i = 0; i < numberOfEndpoints; i++) {
      const endpoint = this._createInputEndpoint(
        renderer, canvasEl, endpointParameters, endpointTitle, input, fanInEnabled && i > 0 && i === numberOfEndpoints - 1,
      );
      canvasOperatorInput.endpoints.push(endpoint);
    }

    return canvasOperatorInput;
  }

  private _createInputEndpoint(renderer: jsPlumbInstance, el: HTMLElement, parameters: any, title: string, input: PipelineOperator.Input, isLastFanIn: boolean) {
    const endpoint = renderer.addEndpoint(
      el,
      {
        anchor: [[0, 0, -1, 0]],
        parameters: parameters,
        connectionType: 'basic',
        maxConnections: 1,
        enabled: this.isEditMode,
      } as any, // workaround for incorrect jsplumb types
      pipelineCanvasConfig.jsPlumbViewSettings.targetEndpoint as any, // workaround for incorrect jsplumb types,
    ) as any; // workaround for incorrect jsplumb types

    endpoint.canvas.setAttribute('title', title);
    if (!input.optional && !isLastFanIn) {
      endpoint.canvas.classList.add('required');
    }
    return endpoint;
  }

  private _initOperatorOutput(
    renderer: jsPlumbInstance,
    output: PipelineOperator.Output,
    step: ICanvasStep,
    index: number,
    outputsCount: number,
    canvasEl: HTMLElement,
  ): ICanvasOperatorOutput {
    const canvasOperatorOutput: ICanvasOperatorOutput = {
      output,
      endpoint: null,
      index,
    };

    const endpointParameters = {
      outputStep: step,
      output: canvasOperatorOutput,
    };

    const sidePosition = (1 + index) / (1 + outputsCount);
    const endpoint = renderer.addEndpoint(
      canvasEl,
      {
        anchor: [[1, sidePosition, 1, 0]],
        connectionType: 'basic',
        parameters: endpointParameters,
        maxConnections: Infinity,
        enabled: this.isEditMode,
      } as any, // workaround for incorrect jsplumb types
      {
        ...pipelineCanvasConfig.jsPlumbViewSettings.sourceEndpoint,
        connector: [
          'Flowchart',
          {
            stub: [10, 20],
            gap: 10,
            cornerRadius: 5,
            alwaysRespectStubs: true,
            midpoint: sidePosition * 0.8 + 0.1,
          },
        ],
      } as any, // workaround for incorrect jsplumb types,
    ) as any; // workaround for incorrect jsplumb types

    endpoint.canvas.setAttribute('title', this._getOutputLabel(output));

    canvasOperatorOutput.endpoint = endpoint;

    return canvasOperatorOutput;
  }

  private _generateNewStepId(): string {
    const maxIdx = _.max(this._steps.map((step) => {
      return parseInt(step.id.replace(/^[^\d]+/, '')) || 0;
    })) || 0;
    return 'step' + (maxIdx + 1).toString();
  }

  private _getStepByElement(el: HTMLElement): ICanvasStep {
    const stepId = el.dataset['stepId'];
    const step = this._steps.find((_) => _.id === stepId);
    if (!step) {
      throw new Error('Can\'t find step');
    }

    return step;
  }

  private _createStepElement(operator: PipelineOperator, originalStep?: Pipeline.Step): HTMLElement {
    const el = document.createElement('div');
    el.className = 'pipeline-operator jtk-node btn has-operator-parameters';
    if (this.isEditMode) {
      el.classList.add('btn-default');
    }
    if (this._canEnableFanInOperator(operator)) {
      el.classList.add('can-enable-fan-in');
    }
    if (operator.customComponent || (operator.customEdaComponents && operator.customEdaComponents.length)) {
      el.classList.add('has-custom-operator-components');
    }

    const icon = operator.category
      ? ((operator.category in this.categories) ? this.categories[operator.category].icon : 'unknown')
      : 'not-published';
    el.innerHTML = `<div class="operator-icon"><i class="ml-icon ml-icon-${icon}"></i></div>` +
      `<div class="operator-name">${(originalStep && (originalStep.customName || originalStep.name)) || operator.name}</div>`;

    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'controls-panel';

    const infoEl = document.createElement('i');
    infoEl.className = 'control glyphicon glyphicon-info-sign';
    infoEl.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const step = this._getStepByElement(el);
      this._operatorInfoModal.show(step.canvasOperator.operator);
    });
    controlsPanel.appendChild(infoEl);

    const paramsEl = document.createElement('i');
    paramsEl.className = 'control glyphicon glyphicon-cog operator-parameters';
    paramsEl.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.selectedStepActiveTab = 0;
      const step = this._getStepByElement(el);
      this.zone.run(() => {
        this.selectedStep = step;
      });
      this.selectedStepParamsIsValid = !Boolean((step.canvasOperator.operator.params || []).length);
      this.selectedCustomName = step.customName;
      this.selectedStepParams = { ...step.params };
      this.selectedStepInputsFanIn = step.canvasOperator.operator.inputs.reduce((acc, input) => {
        acc[input.name] = Array.isArray(step.inputs[input.name]);
        return acc;
      }, {});
      this.selectedStepPipelineParams = { ...step.pipelineParameters };
      this._stepParamsModal.show();
    });
    controlsPanel.appendChild(paramsEl);

    if (this.isEditMode) {
      const removeEl = document.createElement('i');
      removeEl.className = 'control glyphicon glyphicon-remove';
      removeEl.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        const step = this._getStepByElement(el);
        this.zone.run(() => {
          this.selectedStep = step;
        });
        this._stepRemovalConfirmationModal.show();
      });
      controlsPanel.appendChild(removeEl);
    }

    el.appendChild(controlsPanel);
    return el;
  }

  private _addStep(
    renderer: jsPlumbInstance,
    operator: PipelineOperator,
    coordinates: ICanvasCoordinates,
    originalStep: Pipeline.StepInfo = null,
  ) {
    const el = this._createStepElement(operator, originalStep);
    this._canvasEl.nativeElement.appendChild(el);

    const stepId = !originalStep ? this._generateNewStepId() : originalStep.id;

    const canvasOperator: ICanvasOperator = {
      el: el,
      operator: operator,
      inputs: [],
      outputs: [],
      stepId: stepId,
    };

    const step: ICanvasStep = Object.assign(
      {
        id: stepId,
        operator: operator.id,
        canvasOperator: canvasOperator,
        interactiveStatus: InteractiveExperiment.StepStatus.IDLE,
        interactiveWaitingForStatus: false,
        interactiveLastError: null,
        interactiveLastResult: null,
      },
      originalStep || {
        // we want to add default values to the step for the sake of consistency.
        // Reason: when user opens params dialog defaults are pre-populated, when user does not open we populate here
        // See COR-3500
        params: this._pipelineService.defaultOperatorParameters(operator),
        inputs: operator.inputs
          .filter(input => input.fanIn && this._canEnableFanInInput(input))
          .reduce((acc, input) => ({...acc, [input.name]: []}), {}),
        pipelineParameters: {},
      },
    );
    operator.inputs.forEach(input => {
      if (this.isEditMode || !input.optional || input.name in step.inputs) {
        canvasOperator.inputs.push(this._initOperatorInput(renderer, input, step));
      }
    });
    operator.outputs.forEach((output, i) => {
      canvasOperator.outputs.push(this._initOperatorOutput(renderer, output, step, i, operator.outputs.length, el));
    });

    this._updateOperatorSize(canvasOperator);

    coordinates = coordinates || (originalStep && originalStep.coordinates);
    if (coordinates) {
      this._moveStepTo(step, coordinates);
    }

    this._makeElementDraggable(renderer, el);

    this._steps.push(step);
    el.dataset['stepId'] = step.id;

    if (originalStep && this.outdatedStepIds.includes(step.id)) {
      el.classList.add('outdated');
    }

    if (!originalStep) {
      this._emitCanvasUpdate(); // avoid marking as changed for initial rendering on load
    }
  }

  private _updateOperatorSize(canvasOperator: ICanvasOperator) {
    const IO_SPACE = 2;
    const ENDPOINTS_SPACE = 1;

    const inputsSize = canvasOperator.inputs.reduce(
      (sum, input) => sum + IO_SPACE + ENDPOINTS_SPACE * (input.endpoints.length - 1),
      IO_SPACE,
    );

    const outputsSize = IO_SPACE + canvasOperator.outputs.length * IO_SPACE;

    const size = Math.min(50, Math.max(2 * IO_SPACE, inputsSize, outputsSize));

    canvasOperator.el.style.minHeight = Math.max(4, 0.75 * size) + 'em'; // 1em equals to grid spacing
    let offset = 0;
    canvasOperator.inputs.forEach(input => {
      offset += IO_SPACE;
      input.endpoints.forEach((endpoint, i) => {
        endpoint.anchor.getAnchors()[0].setPosition(0, offset / inputsSize, -1, 0);
        if (i < input.endpoints.length - 1) {
          offset += ENDPOINTS_SPACE;
        }
      });
    });
  }

  private _getOutputLabel(output: PipelineOperator.Output): string {
    const caption = output.caption || output.description || 'Output';

    return `${caption} (${this.getTypeDescription(output.type)})`;
  }

  private _getInputLabel(input: PipelineOperator.Input, fanInEnabled: boolean = false): string {
    const inputType = input.type;

    let result = input.caption || input.name;

    if (input.optional)  {
      result += ' (optional)';
    }

    if (this._pipelineService.isFanInAvailable(inputType) && fanInEnabled) {
      result += ` (${this.getTypeDescription((inputType as PipelineDataType.Complex).typeArguments[0])})`;
    } else {
      result += ` (${this.getTypeDescription(inputType)})`;
    }

    return result;
  }

  //noinspection JSMethodCanBeStatic
  private _calculatePlacementCoordinate(value: number, gridSize: number): number {
    return Math.floor((value + gridSize - 1) / gridSize) * gridSize;
  }

  private interactiveInitialize() {
    if (this.interactiveSession) {
      this.subscriptions.push(this.interactiveSession.onError.subscribe(err => {
        const errorType = config.notification.level.values.DANGER;
        if (err && err instanceof CloseEvent) {
          this._notificationService.create('Interactive experiment session closed unexpectedly', errorType);
        } else {
          this._notificationService.create('Unknown error while communicating with interactive experiment', errorType);
        }
      }));
      this.subscriptions.push(this.interactiveSession.onPipelineStatus.subscribe(status => {
        this._steps.forEach(step => {
          const stepStatus = status.steps.find(_ => _.stepId === step.id);
          if (stepStatus) {
            this._interactiveUpdateStepStatus(step, stepStatus.status, false);
            step.interactiveLastError = stepStatus.errorMessage ? stepStatus.errorMessage : null;
            step.interactiveLastResult = stepStatus.result ? stepStatus.result : null;
          } else {
            this._interactiveUpdateStepStatus(step, InteractiveExperiment.StepStatus.IDLE, false);
          }
        });
      }));
      this.subscriptions.push(this.interactiveSession.onPipelineStepStatus.subscribe(stepStatus => {
        const step = this._steps.find(_ => _.id === stepStatus.stepId);
        if (step) {
          this._interactiveUpdateStepStatus(step, stepStatus.status, false);
          step.interactiveLastError = stepStatus.errorMessage ? stepStatus.errorMessage : null;
          step.interactiveLastResult = stepStatus.result ? stepStatus.result : null;
          if (stepStatus.status === InteractiveExperiment.StepStatus.ERROR) {
            const operator = this.availableOperators.find(_ => _.id === step.operator);
            const stepName = operator ? 'step ' + operator.name : 'unknown step';
            this._notificationService.create(
              'Error in ' + stepName + (stepStatus.errorMessage ? ': ' + stepStatus.errorMessage : ''),
              config.notification.level.values.WARNING,
            );
          }
        }
      }));
      this.subscriptions.push(this.interactiveSession.onStepPushRejection.subscribe(error => {
        const step = this._steps.find(_ => _.id === error.stepId);
        if (step && step.interactiveWaitingForStatus) {
          this._interactiveUpdateStepStatus(step, InteractiveExperiment.StepStatus.IDLE, false);
          const operator = this.availableOperators.find(_ => _.id === step.operator);
          const stepName = 'step ' + (operator ? operator.name : '#' + step.id);
          const errorMessage = `Unable to execute ${stepName}: ${error.error}`;
          this._notificationService.create(errorMessage, config.notification.level.values.DANGER);
          step.interactiveLastError = error.error;
        }
      }));
      this.interactiveSession.getPipelineStatus();
    }
  }

  private _interactiveDropStepWithChildSteps(stepId: string) {
    const step = this._steps.find(s => s.id === stepId);
    if (step && step.interactiveStatus !== InteractiveExperiment.StepStatus.IDLE) {
      const stepsToDrop = this._getStepChildrenDeep(step)
        .filter(childStep => childStep.interactiveStatus !== InteractiveExperiment.StepStatus.IDLE)
        .concat([step]);

      stepsToDrop.forEach(item => {
          this._interactiveUpdateStepStatus(item, InteractiveExperiment.StepStatus.IDLE, false);
          this.interactiveSession.dropPipelineStep({stepId: item.id});
        });
      this.interactiveSession.getPipelineStatus();
    }
  }

  private _getStepChildren(step: ICanvasStep): ICanvasStep[] {
    return this._steps.filter(
      s => s.id !== step.id && _.some(Object.values(s.inputs), is => (
        CanvasComponent._inputAsList(is).find(i => i.stepId === step.id)
      )),
    );
  }

  /**
   * returns all child steps starting from farthest ones
   * @param step
   * @private
   */
  private _getStepChildrenDeep(step: ICanvasStep): ICanvasStep[] {
    let result: ICanvasStep[] = [];
    let parents: ICanvasStep[] = [step];
    let children: ICanvasStep[] = [];
    do {
      children = parents.reduce(
        (acc: ICanvasStep[], parentStep) => acc.concat(this._getStepChildren(parentStep)),
        [],
      );
      result = children.concat(result);
      parents = children;
    } while (parents.length);

    return result.reduce((soFar, item) => {
      if (soFar.includes(item)) {
        return soFar;
      }
      return [...soFar, item];
    }, []);
  }

  private _stepsSorted(): ICanvasStep[] {
    const starts = this._steps.filter(
      s => Object.values(s.inputs).filter(
        i => i && (Array.isArray(i) && i.length > 0 || !!(i as Pipeline.OutputReference).stepId),
      ).length === 0,
    );

    return starts.reduce((acc, step) => {
      const childSteps = this._getStepChildrenDeep(step).reverse();
      return acc.filter(child => !childSteps.includes(child)).concat(childSteps);
    }, starts);
  }

  private _interactivePushStepWithParentSteps(stepId: string) {
    const step = this._steps.find(s => s.id === stepId);
    if (step) {
      const stepsToPush = this._getStepParentsDeep(step)
        .filter(parentStep => parentStep.interactiveStatus === InteractiveExperiment.StepStatus.IDLE)
        .concat([step]);

      stepsToPush
        .forEach(item => {
          this._interactiveUpdateStepStatus(item, InteractiveExperiment.StepStatus.RUNNING, true);
          this.interactiveSession.pushPipelineStep({
            stepId: item.id,
            operator: item.operator,
            inputs: item.inputs,
            params: item.params,
          });
        });
    }
  }

  private _getStepParents(step: ICanvasStep): ICanvasStep[] {
    return Object.values(step.inputs)
      .reduce((acc, is) => {
        return acc.concat(
          CanvasComponent._inputAsList(is).map(i => this._steps.find(s => s.id === i.stepId)),
        );
      }, [] as ICanvasStep[])
      .filter(s => s.id !== step.id);
  }

  /**
   * returns all parent steps starting from farthest ones
   * @param step
   * @private
   */
  private _getStepParentsDeep(step: ICanvasStep): ICanvasStep[] {
    let result: ICanvasStep[] = [];
    let children: ICanvasStep[] = [step];
    let parents: ICanvasStep[] = [];
    do {
      parents = children.reduce(
        (acc: ICanvasStep[], childStep) => acc.concat(this._getStepParents(childStep)),
        [],
      );
      result = parents.concat(result);
      children = parents;
    } while (parents.length);

    return result.reduce((soFar, item) => {
      if (soFar.includes(item)) {
        return soFar;
      }
      return [...soFar, item];
    }, []);
  }

  private _interactivePushAllSteps() {
    const stepsToPush = this._stepsSorted()
      .filter(_ => _.interactiveStatus === InteractiveExperiment.StepStatus.IDLE);

    stepsToPush.forEach(step => {
      this._interactiveUpdateStepStatus(step, InteractiveExperiment.StepStatus.RUNNING, true);
      this.interactiveSession.pushPipelineStep({
        stepId: step.id,
        operator: step.operator,
        inputs: step.inputs,
        params: step.params,
      });
    });
  }

  private _interactiveUpdateStepStatus(
    step: ICanvasStep,
    status: InteractiveExperiment.StepStatus,
    waitingForStatus: boolean,
  ) {
    this.zone.run(() => {
      const oldStatusClass = 'pipeline-step-status-' + step.interactiveStatus;
      const newStatusClass = 'pipeline-step-status-' + status;
      step.interactiveStatus = status;
      step.interactiveWaitingForStatus = waitingForStatus;
      if (status === InteractiveExperiment.StepStatus.IDLE) {
        step.interactiveLastResult = null;
        step.interactiveLastError = null;
      }
      step.canvasOperator.el.classList.remove(oldStatusClass);
      step.canvasOperator.el.classList.add(newStatusClass);
      if (status === InteractiveExperiment.StepStatus.ERROR) {
        const upstreamFailed = !!this._getStepParents(step)
          .find(_ => _.interactiveStatus === InteractiveExperiment.StepStatus.ERROR);
        step.canvasOperator.el.classList.toggle('pipeline-step-status-ERROR-UPSTREAM', upstreamFailed);
      } else {
        step.canvasOperator.el.classList.remove('pipeline-step-status-ERROR-UPSTREAM');
      }
    });
  }

  private _interactiveStatusClass = (status: InteractiveExperiment.Status): string => `interactive-status-${status}`;

  private _getInvoker = (step: ICanvasStep, session: InteractiveExperiment.Session): CustomComponent.InspectionInvoker => {
    if (!session) {
      return null;
    }
    const inspections = step.canvasOperator.operator.inspections || [];
    return (inspectionName, stepId, functionArgs) => {
      const inspection = inspections.find(_ => _.name === inspectionName);
      if (!inspection) {
        return _throw('Invalid inspection specified');
      }
      const requestId = session.generateRequestId();
      const observable = session.onStepInspectionResult
        .pipe(
          first(response => response.requestId === requestId),
          timeout(1000 * 60 * 5),
          mergeMap(response => {
            if (response.error) {
              return _throw(response.error);
            }
            return of(response.result);
          }),
        );
      session.inspectPipelineStep({
        requestId,
        packageName: inspection.packageName,
        packageVersion: inspection.packageVersion,
        moduleName: inspection.moduleName,
        functionName: inspection.functionName,
        functionArgs,
        stepId,
      });
      return observable;
    };
  };

  private _getDirectInvoker = (step: ICanvasStep, session: InteractiveExperiment.Session): CustomComponent.DirectInspectionInvoker => {
    if (!session) {
      return null;
    }
    return (
      packageName: string,
      packageVersion: string | null,
      moduleName: string,
      functionName: string,
      stepId: string,
      functionArgs,
    ) => {
      const requestId = session.generateRequestId();
      const observable = session.onStepInspectionResult
        .pipe(
          first(response => response.requestId === requestId),
          timeout(1000 * 60 * 5),
          mergeMap(response => {
            if (response.error) {
              return _throw(response.error);
            }
            return of(response.result);
          }),
        );
      session.inspectPipelineStep({
        requestId,
        packageName,
        packageVersion,
        moduleName,
        functionName,
        functionArgs,
        stepId,
      });
      return observable;
    };
  };

  private _showCanvasSpinner(session: InteractiveExperiment.Session, status: InteractiveExperiment.Status): boolean {
    if (!session) {
      return false;
    }
    return status === InteractiveExperiment.Status.INITIALIZING || status === InteractiveExperiment.Status.CONNECTING;
  }

  private _getStepResultSuccess(
    stepResult: InteractiveExperiment.Response.IPipelineStepStatusResult,
    stepId: string,
  ): IGenericExperiment.StepResultSuccess {
    return {...stepResult, stepId};
  }

  private _zoomIn(event: PointerEvent) {
    event.preventDefault();
    if (this._panZoom) {
      this._panZoom.zoomTo(
        pipelineCanvasConfig.zoom.transformOrigin.x,
        pipelineCanvasConfig.zoom.transformOrigin.y,
        pipelineCanvasConfig.zoom.zoomInScaleMultiplier,
      );
      this.checkZoomingEligibilityStatus();
    }
  }

  private _zoomOut(event: PointerEvent) {
    event.preventDefault();
    if (this._panZoom) {
      this._panZoom.zoomTo(
        pipelineCanvasConfig.zoom.transformOrigin.x,
        pipelineCanvasConfig.zoom.transformOrigin.y,
        pipelineCanvasConfig.zoom.zoomOutScaleMultiplier,
      );
      this.checkZoomingEligibilityStatus();
    }
  }

  private checkZoomingEligibilityStatus() {
    if (this._panZoom) {
      let currentScale = this._panZoom.getTransform().scale;

      if (currentScale >= pipelineCanvasConfig.zoom.maxZoomLevel) {
        this.isDisabledZoomIn = true;
      } else {
        this.isDisabledZoomIn = false;
      }

      if (currentScale <= pipelineCanvasConfig.zoom.minZoomValue) {
        this.isDisabledZoomOut = true;
      } else {
        this.isDisabledZoomOut = false;
      }
    }
  }

  private _canEnableFanInOperator = (operator: PipelineOperator) => _.some(operator.inputs, this._canEnableFanInInput);

  private _canEnableFanInInput = (input: PipelineOperator.Input) => {
    return this._pipelineService.isFanInAvailable(input.type);
  };

  private getTypeDescription = (type: PipelineDataType) => this._pipelineService.getTypeDescription(type);

  private perhapsUpdateCanvasOperatorName(): void {
    let custonName = _.trim(this.selectedCustomName);
    if (this.selectedStep.customName !== custonName) {
      this.selectedStep.customName = custonName;
      let visibleName = custonName || this.selectedStep.name || this.selectedStep.canvasOperator.operator.name;
      this.selectedStep.canvasOperator.el.querySelector('div.operator-name').innerHTML = visibleName;
    }
  }

  private static _deleteInputFromCanvasStep(inputCanvasStep: ICanvasStep, inputName: string, index: number = 0) {
    const inputValue = inputCanvasStep.inputs[inputName];
    if (Array.isArray(inputValue)) {
      if (index === inputValue.length - 1) {
        inputValue.splice(index, 1);
      } else {
        inputValue[index] = null;
      }
    } else {
      delete inputCanvasStep.inputs[inputName];
    }
  }

  private static _inputAsList(inputValue: Pipeline.InputValue): Pipeline.OutputReference[] {
    return Array.isArray(inputValue) ? inputValue : [inputValue];
  }
}

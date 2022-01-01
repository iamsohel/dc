import {
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import { ComponentRef } from '@angular/core/src/linker/component_factory';

import { Dictionary, keyBy } from 'lodash';
import { Subscription } from 'rxjs/Subscription';

import { IProcess } from '../core/interfaces/process.interface';

import {
  EXPERIMENT_TYPES,
  ExperimentType,
  ExperimentTypeDefinition,
  IAbstractExperimentPipeline,
  IAbstractExperimentResult,
  IExperiment,
  IExperimentAdditionalAction,
  IExperimentFull,
} from './experiment.interfaces';


export interface IExperimentResultView<
  P extends IAbstractExperimentPipeline = IAbstractExperimentPipeline,
  R extends IAbstractExperimentResult = IAbstractExperimentResult,
> {
  experiment: IExperimentFull<P, R>;
  process?: IProcess;
}

@Component({
  selector: 'experiment-result',
  template: ' ',
})
export class ExperimentResultComponent implements OnChanges, OnDestroy, IExperimentResultView {
  @Input() type: ExperimentType;
  @Input() experiment: IExperimentFull;
  @Input('process') process: IProcess | null;
  @Input() withInteractivity: boolean = false;

  @Output() availableActions: EventEmitter<IExperimentAdditionalAction[]> = new EventEmitter();

  private _componentRef: ComponentRef<IExperimentResultView>;
  private readonly _types: Dictionary<ExperimentTypeDefinition>;
  private readonly subscription = new Subscription();

  constructor(
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    @Inject(EXPERIMENT_TYPES) typeDefinitions: ExperimentTypeDefinition[],
  ) {
    this._types = keyBy(typeDefinitions, _ => _.type);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._compileResultComponent();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private _compileResultComponent(): void {
    const typeDefinition = this._types[this.type];

    if (this._componentRef) {
      this._componentRef.destroy();
      this._componentRef = null;
    }

    if (typeDefinition) {
      const componentClass =
        this.withInteractivity && this.experiment.status === IExperiment.Status.RUNNING && this.experiment.isInteractive
          ? typeDefinition.interactive.mainComponent
          : typeDefinition.resultComponent;
      if (componentClass) {
        const factory = this.componentFactoryResolver.resolveComponentFactory(componentClass);
        this._componentRef = this.viewContainer.createComponent(factory);
        const componentInstance = this._componentRef.instance;
        if ('experimentActions' in componentInstance) {
          this.subscription.add(componentInstance['experimentActions'].subscribe(actions => {
            this.availableActions.emit(actions);
          }));
        }
        componentInstance.experiment = this.experiment;
        componentInstance.process = this.process;
      }
    }
  }
}

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
import { Observable } from 'rxjs/Observable';
import { _throw } from 'rxjs/observable/throw';
import { startWith } from 'rxjs/operators/startWith';
import { switchMap } from 'rxjs/operators/switchMap';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { ExperimentCreateForm } from './experiment-create.component';
import { EXPERIMENT_TYPES, ExperimentTypeDefinition, IAbstractExperimentPipeline } from './experiment.interfaces';

export interface IExperimentPipelineForm<T extends IAbstractExperimentPipeline> {
  validityChange: Observable<boolean>;
  experimentCreateForm: ExperimentCreateForm;
  getPipeline(): Observable<T>;
}

@Component({
  selector: 'experiment-pipeline',
  template: ' ',
})
export class ExperimentPipelineComponent implements OnChanges, OnDestroy, IExperimentPipelineForm<IAbstractExperimentPipeline> {
  @Input() type: string;
  @Input() experimentCreateForm: ExperimentCreateForm;
  @Output() validityChange = new EventEmitter<boolean>();

  private _componentRef: ComponentRef<IExperimentPipelineForm<IAbstractExperimentPipeline>>;
  private readonly _types: Dictionary<ExperimentTypeDefinition>;
  private readonly _validityQueue = new Subject<Observable<boolean>>();
  private readonly _subscription: Subscription;

  constructor(
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    @Inject(EXPERIMENT_TYPES) pipelines: ExperimentTypeDefinition[],
  ) {
    this._types = keyBy(pipelines, _ => _.type);
    this._subscription =
      this._validityQueue.pipe(switchMap(_ => _)).subscribe(validity => this.validityChange.next(validity));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._compilePipelineComponent();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  public getPipeline(): Observable<IAbstractExperimentPipeline> {
    return this._componentRef ? this._componentRef.instance.getPipeline() : _throw('No pipeline component');
  }

  private _compilePipelineComponent(): void {
    const typeDefinition = this._types[this.type];

    if (this._componentRef) {
      this._componentRef.destroy();
      this._componentRef = null;
    }

    if (typeDefinition && typeDefinition.pipelineComponent) {
      const factory = this.componentFactoryResolver.resolveComponentFactory(typeDefinition.pipelineComponent);
      this._componentRef = this.viewContainer.createComponent(factory);
      const componentInstance = this._componentRef.instance;
      componentInstance.experimentCreateForm = this.experimentCreateForm;
      this._validityQueue.next(componentInstance.validityChange.pipe(startWith(false)));
    }
  }
}

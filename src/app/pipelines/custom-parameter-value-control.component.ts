import {
  Component,
  ComponentFactory,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { switchMap } from 'rxjs/operators/switchMap';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { ParameterDefinition, ParameterValueType, ParameterValues } from '../core/interfaces/params.interface';

import { CustomComponent } from './custom-components/custom-component.interfaces';
import { CustomComponentService } from './custom-components/custom-component.service';
import { Pipeline, PipelineOperator } from './pipeline.interfaces';

@Component({
  selector: 'custom-parameter-value-control',
  template: ``,
})
export class CustomParameterValueControlComponent implements OnChanges, OnDestroy {
  @Input() componentData: PipelineOperator.ComponentReference;
  @Input() parameter: ParameterDefinition;
  @Input() operator: PipelineOperator;
  @Input() value: ParameterValueType;
  @Input() values: ParameterValues;
  @Input() invoker: CustomComponent.InspectionInvoker;
  @Input() directInvoker: CustomComponent.DirectInspectionInvoker;
  @Input() disabled: boolean = false;
  @Input() step: Pipeline.Step;
  @Output() valueChange = new EventEmitter<ParameterValueType>();

  private readonly valueQueue = new Subject<Observable<any>>();
  private componentRef: ComponentRef<CustomComponent.IParameterComponent>;
  private subscription: Subscription;
  constructor(
    private viewContainer: ViewContainerRef,
    private customComponentsService: CustomComponentService,
  ) {
    this.subscription = this.valueQueue
      .pipe(switchMap(_ => _))
      .subscribe(value => this.valueChange.next(value));

  }

  public ngOnChanges(changes: SimpleChanges) {
    if ('componentData' in changes) {
      this.customComponentsService.get<CustomComponent.IParameterComponent>(
        this.componentData.path, this.componentData.name,
      ).subscribe((componentFactory) => this.compileComponent(componentFactory));
    } else {
      if (this.componentRef) {
        this.componentRef.instance.setContext(this.getContext());
      }
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private compileComponent(componentFactory: ComponentFactory<CustomComponent.IParameterComponent>) {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.componentRef = this.viewContainer.createComponent(componentFactory);
    this.valueQueue.next(this.componentRef.instance.valueChange);
    this.componentRef.instance.configure(this.componentData.parameters);
    this.componentRef.instance.setContext(this.getContext());
  }

  private getContext(): CustomComponent.IParameterContext {
    const values = {...this.values};
    values[this.parameter.name] = this.value;
    return {
      invoker: this.invoker,
      directInvoker: this.directInvoker,
      operator: this.operator,
      stepId: this.step.id,
      inputs: this.step.inputs,
      parameter: this.parameter,
      disabled: this.disabled,
      parameterValues: values,
    };
  }
}

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

import { ParameterValues } from '../core/interfaces/params.interface';

import { CustomComponent } from './custom-components/custom-component.interfaces';
import { CustomComponentService } from './custom-components/custom-component.service';
import { Pipeline, PipelineOperator } from './pipeline.interfaces';

@Component({
  selector: 'pipeline-custom-operator-params',
  template: ' ',
})
export class CustomOperatorParamsComponent implements OnChanges, OnDestroy {
  @Input() componentData: PipelineOperator.ComponentReference;
  @Input() values: ParameterValues;
  @Input() operator: PipelineOperator;
  @Input() invoker: CustomComponent.InspectionInvoker;
  @Input() directInvoker: CustomComponent.DirectInspectionInvoker;
  @Input() step: Pipeline.Step;
  @Input() disabled: boolean = false;
  @Output() valuesChange = new EventEmitter<ParameterValues>();
  @Output() validityChange = new EventEmitter<boolean>();

  private componentRef: ComponentRef<CustomComponent.IOperatorComponent>;
  private readonly valuesQueue = new Subject<Observable<any>>();
  private readonly validityQueue = new Subject<Observable<boolean>>();
  private subscription: Subscription;
  constructor(
    private viewContainer: ViewContainerRef,
    private customComponentsService: CustomComponentService,
  ) {
    this.subscription = this.valuesQueue
      .pipe(switchMap(_ => _))
      .subscribe(values => this.valuesChange.next(values))
      .add(
        this.validityQueue
          .pipe(switchMap(_ => _))
          .subscribe(validity => this.validityChange.next(validity)),
      );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ('componentData' in changes) {
      this.customComponentsService.get<CustomComponent.IOperatorComponent>(
        this.componentData.path, this.componentData.name,
      ).subscribe((componentFactory) => this.compileComponent(componentFactory));
    } else if (this.componentRef) {
      this.componentRef.instance.setContext(this.getContext());
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private compileComponent(componentFactory: ComponentFactory<CustomComponent.IOperatorComponent>) {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.componentRef = this.viewContainer.createComponent(componentFactory);
    this.componentRef.instance.configure(this.componentData.parameters);
    this.componentRef.instance.setContext(this.getContext());
    this.valuesQueue.next(this.componentRef.instance.valuesChange);
    this.validityQueue.next(this.componentRef.instance.validityChange);
  }

  private getContext(): CustomComponent.IOperatorContext {
    return {
      invoker: this.invoker,
      directInvoker: this.directInvoker,
      operator: this.operator,
      inputs: this.step.inputs,
      stepId: this.step.id,
      disabled: this.disabled,
      parameterValues: this.values,
    };
  }
}

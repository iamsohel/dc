import {
  Component,
  ComponentFactory,
  ComponentRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';

import { ParameterValues } from '../core/interfaces/params.interface';

import { CustomComponent } from './custom-components/custom-component.interfaces';
import { CustomComponentService } from './custom-components/custom-component.service';
import { Pipeline, PipelineOperator } from './pipeline.interfaces';

@Component({
  selector: 'custom-eda',
  template: ' ',
})
export class CustomEdaComponent implements OnChanges, OnDestroy {
  @Input() componentData: PipelineOperator.ComponentReference;
  @Input() operator: PipelineOperator;
  @Input() step: Pipeline.Step;
  @Input() values: ParameterValues;
  @Input() invoker: CustomComponent.InspectionInvoker;
  @Input() directInvoker: CustomComponent.DirectInspectionInvoker;
  @Input() disabled: boolean = false;
  private componentRef: ComponentRef<CustomComponent.IEDAComponent> = null;
  constructor(
    private viewContainer: ViewContainerRef,
    private customComponentsService: CustomComponentService,
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ('componentData' in changes) {
      this.customComponentsService.get<CustomComponent.IEDAComponent>(
        this.componentData.path, this.componentData.name,
      ).subscribe((componentFactory) => this.compileComponent(componentFactory));
    } else if (this.componentRef) {
      this.componentRef.instance.setContext(this.getContext());
    }
  }
  public ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
  private compileComponent(componentFactory: ComponentFactory<CustomComponent.IEDAComponent>) {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.componentRef = this.viewContainer.createComponent(componentFactory);
    this.componentRef.instance.configure(this.componentData.parameters);
    this.componentRef.instance.setContext(this.getContext());
  }

  private getContext(): CustomComponent.IEDAContext {
    return {
      invoker: this.invoker,
      directInvoker: this.directInvoker,
      operator: this.operator,
      stepId: this.step.id,
      inputs: this.step.inputs,
      parameterValues: this.values,
      disabled: this.disabled,
    };
  }
}

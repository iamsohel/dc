import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Inject,
  OnDestroy,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Dictionary, keyBy } from 'lodash';
import { Subscription } from 'rxjs/Subscription';

import { TObjectId } from '../core/interfaces/common.interface';
import { ReactiveLoader } from '../utils/reactive-loader';

import { EXPERIMENT_TYPES, ExperimentTypeDefinition, IExperimentFull } from './experiment.interfaces';
import { ExperimentService } from './experiment.service';


@Component({
  selector: 'interactive-experiment-context',
  template: ' ',
})
export class ExperimentInteractiveContextComponent implements OnDestroy {
  private readonly experimentLoader: ReactiveLoader<IExperimentFull, TObjectId>;
  private readonly types: Dictionary<ExperimentTypeDefinition>;
  private experiment: IExperimentFull;
  private componentRef: ComponentRef<any>;
  private subscription = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private experimentService: ExperimentService,
    private viewContainer: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    @Inject(EXPERIMENT_TYPES) typeDefinitions: ExperimentTypeDefinition[],
  ) {
    this.experimentLoader = new ReactiveLoader(experimentId => this.experimentService.get(experimentId));
    this.subscription.add(this.experimentLoader.subscribe(experiment => {
      this.experiment = experiment;
      this._compileComponent();
    }));
    this.types = keyBy(typeDefinitions, _ => _.type);
    this.subscription.add(this.route.params.subscribe((params) => {
      const experimentId = params['experimentId'];
      if (experimentId) {
        this.experimentLoader.load(experimentId);
      } else {
        this.router.navigate(['/desk', 'experiments', 'create']);
      }
    }));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private _compileComponent(): void {
    const typeDefinition = this.types[this.experiment.type];

    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    if (typeDefinition && typeDefinition.interactive) {
      const componentClass = typeDefinition.interactive.sideComponent;
      if (componentClass) {
        const factory = this.componentFactoryResolver.resolveComponentFactory(componentClass);
        this.componentRef = this.viewContainer.createComponent(factory);
      }
    }
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'pipeline-experiment-interactive-context',
  template: `
    <div class="group">
      <button type="button"
        class="btn btn-primary btn-block"
        routerLinkActive
        #experimentCreateRoute="routerLinkActive"
        [routerLink]="['/desk/experiments/create']"
        [ngClass]="{'btn-alt': !experimentCreateRoute.isActive}"
      >Create Experiment
      </button>
    </div>
    <side-operators-list></side-operators-list>
  `,
})
export class PipelineExperimentInteractiveContextComponent {
}

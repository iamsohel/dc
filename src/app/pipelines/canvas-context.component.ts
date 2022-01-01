import { Component } from '@angular/core';

@Component({
  selector: 'canvas-edit-context',
  template: `
    <div class="group">
      <button type="button"
        class="btn btn-primary btn-block"
        routerLinkActive
        #pipelineCreateActive="routerLinkActive"
        [routerLink]="['/desk/pipelines/create']"
        [ngClass]="{'btn-alt': !pipelineCreateActive.isActive}"
      >Create Pipeline
      </button>
    </div>
    <side-operators-list></side-operators-list>
  `,
})
export class CanvasContextComponent {}

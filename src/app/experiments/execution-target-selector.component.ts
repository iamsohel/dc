import { Component, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

import config from '../config';
import { AppSelectOptionsProvider } from '../core-ui/components/app-select.component';
import { ModalComponent } from '../core-ui/components/modal.component';

import { ExperimentService } from './experiment.service';

@Component({
  selector: 'execution-target-selector',
  template: `
    <div class="row">
      <div class="col-md-7">
        <app-select
          [label]="label"
          [disabled]="serviceIdControl.disabled || targetIdControl.disabled"
          [value]="_getSelectValue | call: serviceIdControl.value: targetIdControl.value"
          [optionsProvider]="_optionsProvider"
          (valueChange)="_updateControlsValue($event)"
          [fixOverflowClipping]="true"
        ></app-select>
      </div>
      <div class="col-md-5" style="line-height: 32px;">
        <a href="#" prevent-default-click (click)="instructionsModal.show();">
          <i class="glyphicon glyphicon-info-sign"></i> How to add new machine.
        </a>
      </div>
    </div>
    <app-modal
      #instructionsModal
      [caption]="'How to add new machine'"
      [buttons]="[{'class': 'btn-primary', 'title': 'Close'}]"
      (buttonClick)="instructionsModal.hide()"
      [sizeClass]="config.modal.size.LARGE"
    >
      <iframe
        class="modal-content-iframe"
        allowtransparency="true"
        src="assets/html/experiment.add-new-machine.html"
        style="height: 260px"
      ></iframe>
    </app-modal>
  `,
})
export class ExecutionTargetSelectorComponent {
  readonly config = config;
  @Input() label: string;
  @Input() serviceIdControl: FormControl;
  @Input() targetIdControl: FormControl;
  @ViewChild('instructionsModal') instructionsModal: ModalComponent;

  private _optionsProvider: AppSelectOptionsProvider;

  constructor(private experimentService: ExperimentService) {
    this._optionsProvider = () => this.experimentService.getTargets().map(
      targets => targets.map(target => {
        return {
          id: this._getSelectValue(target.serviceId, target.targetId),
          text: target.name,
        };
      }),
    );
  }

  _getSelectValue(serviceId: string, targetId: string): string {
    return JSON.stringify([serviceId || null, targetId || null]);
  }
  _updateControlsValue($event) {
    const [serviceId, targetId] = JSON.parse($event);
    this.serviceIdControl.setValue(serviceId);
    this.targetIdControl.setValue(targetId);
  }
}

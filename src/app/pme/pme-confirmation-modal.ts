import { Component, ViewChild } from '@angular/core';

import { PmeService } from './pme-management.service';

@Component({
  selector: 'pme-confirmation-modal',
  template: `
    <app-modal
      #confirmationModal
      [caption]="'Reject batch price records.'"
      [buttons]="[{ class: 'btn-primary', title: 'Reject' }]"
      (buttonClick)="onConfirmRejection($event)"
    >
      <h4>Are you sure ?</h4>
    </app-modal>
  `,
})
export class PmeConfirmationModalComponent {
  @ViewChild('confirmationModal') confirmationModal: PmeConfirmationModalComponent;

  constructor(private pmeService: PmeService) {}

  show() {
    this.confirmationModal.show();
  }

  hide() {
    this.confirmationModal.hide();
  }

  onConfirmRejection(e) {
    this.pmeService.rejecteBatch().subscribe((data) => {
      this.hide();
    });
    console.log(e);
  }
}

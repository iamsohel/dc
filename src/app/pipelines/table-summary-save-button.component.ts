import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';
import { TableService } from '../tables/table.service';
import { ActivityObserver } from '../utils/activity-observer';
import { Csv } from '../utils/backend';
import { AppFormGroup } from '../utils/forms';

import { IGenericExperiment } from './pipeline.interfaces';

@Component({
  selector: 'table-summary-save-button',
  template: `
    <button
      class="btn btn-secondary btn-xs dropdown-toggle"
      data-toggle="dropdown"
      title="Save or Download"
    >
      <i class="glyphicon glyphicon-download-alt"></i>
    </button>
    <ul class="dropdown-menu">
      <li><a [href]="_downloadUrl" #downloadLink (click)="_downloadAsCSV()">Download as CSV</a></li>
      <li><a class="link" (click)="_showSaveToLibraryModal()">Save as Table to Library</a></li>
    </ul>
    <app-modal
      #saveToLibraryModal
      [caption]="'Save as Table to Library'"
      [buttons]="[{id: 'submit', title: 'Save', disabled: _saveToLibraryForm.invalid || _activityObserver.isActive}, {id: 'cancel', title: 'Cancel'}]"
      (buttonClick)="_saveToLibrary($event)"
    >
      <app-input
        label="Name"
        [control]="_saveToLibraryForm.controls.name"
      ></app-input>
      <app-description
        [control]="_saveToLibraryForm.controls.description"
        [editMode]="true"
      ></app-description>
    </app-modal>
  `,
})
export class TableSummarySaveButtonComponent {
  @Input() summary: IGenericExperiment.TableSummary;

  @ViewChild('downloadLink') private _downloadLink: ElementRef;
  @ViewChild('saveToLibraryModal') private _saveToLibraryModal: ModalComponent;

  private _downloadUrl;
  private _saveToLibraryForm = new AppFormGroup({
    'name': new FormControl('', Validators.required),
    'description': new FormControl(''),
  });
  private _activityObserver = new ActivityObserver();

  constructor(
    private sanitizer: DomSanitizer,
    private tableService: TableService,
  ) {
  }

  private _downloadAsCSV() {
    const csvFileName = this.summary.name
      ? this.summary.name.replace(/[^a-zA-Z0-9.-_]+/g, '_') + '.csv'
      : 'table_summary.csv';
    const blob = new Blob([this.getCsvData(this.summary)], { type: 'application/octet-stream' });

    this._downloadUrl = this.sanitizer.bypassSecurityTrustResourceUrl(window.URL.createObjectURL(blob));
    this._downloadLink.nativeElement.download = csvFileName;
  }

  private _showSaveToLibraryModal(): void {
    this._saveToLibraryForm.reset({name: this.summary.name, description: ''});
    this._saveToLibraryModal.show();
  }

  private _saveToLibrary(button: IModalButton) {
    if (button.id === 'submit') {
      const file = new File([this.getCsvData(this.summary)], this.summary.name);
      const observer = this.tableService.import(file, {
        format: 'csv',
        delimiter: ',',
        name: this._saveToLibraryForm.value.name,
        description: this._saveToLibraryForm.value.description,
        nullValue: 'NULL',
      });
      this._activityObserver.observe(observer);
      observer.subscribe(_ => this._saveToLibraryModal.hide());
    } else {
      this._saveToLibraryModal.hide();
    }
  }

  private getCsvData(summary: IGenericExperiment.TableSummary): string {
    return Csv.fromArray([summary.columns.map(column => column.name), ...summary.values]);
  }
}

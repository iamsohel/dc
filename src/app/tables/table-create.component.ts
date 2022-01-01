import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IAssetSaveParams } from '../core/interfaces/common.interface';

@Component({
  selector: 'table-create',
  template: `
    <div *ngIf="!showEditView" class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 col-xl-6 col-xl-offset-3">
      <h3 class="text-center">Create A Table</h3>
      <form [formGroup]="form" (ngSubmit)="form.valid && onSubmit()">
        <app-input label="Name" [control]="form.controls['name']"></app-input>
        <app-description [control]="form.controls['description']" [editMode]="true"></app-description>
        <button
          type="submit"
          class="btn btn-success pull-right"
          [disabled]="!form.valid"
        >
          Create
        </button>
      </form>
    </div>
    <div *ngIf="showEditView" >
      <table-edit [tableConfig]="tableConfig"></table-edit>
    </div>
  `,
})
export class TableCreateComponent implements OnInit {
  form: FormGroup;
  showEditView: boolean = false;
  tableConfig: IAssetSaveParams;

  constructor() {
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl(''),
    });
  }

  ngOnInit() {
    this.showEditView = false;
  }

  onSubmit() {
    this.tableConfig = this.form.value;
    this.showEditView = true;
  }
}

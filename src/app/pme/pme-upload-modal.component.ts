import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { PmeModalComponent } from '../core/components/pme-modal.component';
import { UserService } from '../core/services/user.service';
import { UserRole } from '../users/user.interfaces';

import { PmeService as PmeService } from './pme-management.service';
import { IPriceRecordImport } from './pme.interfaces';

@Component({
  selector: 'pme-upload-modal',
  template: `
    <app-modal #modal
      [caption]="'Upload cv-model file'"
      [buttons]="[{'class': 'btn-primary', disabled: (uploadForm.invalid || !file), title: 'Upload' }]"
      (buttonClick)="uploadForm.valid && file && doUpload()">
      <form [formGroup]="uploadForm"  enctype="multipart/form-data">
        <app-input
          [label]="'Name'"
          [readonly]="true"
          [control]="uploadForm.controls['name']"></app-input>
        <app-input
          [label]="'File'"
          [readonly]="true"
          [iconAfter]="'glyphicon-file'"
          file-upload
          [accept]="acceptList"
          [file-upload-click]="true"
          [value]="file?.name"
          (onSelectFile)="onSelectFile($event)">Choose File
        </app-input>
      </form>
    </app-modal>
  `,
})
export class PmeUploadModalComponent extends PmeModalComponent<IPriceRecordImport> {
  fileExtensions: String[] = ['.csv'];
  readonly userRole = UserRole;

  readonly acceptList = this.fileExtensions;

  constructor(private user: UserService, private pmeService: PmeService) {
    super(
      new FormGroup({
        name: new FormControl(''),
        file: new FormControl(''),
      }),
    );
  }

  getImportParams(): IPriceRecordImport {
    return this.uploadForm.value;
  }

  doUpload() {

    let updateColumn = [];
    if (this.user.getUser().role === UserRole.SALES_REP) {
      updateColumn = [
        'pdm_business_type',
        'pdm_nba_company_name',
        'pdm_nba_product',
        'pdm_rltv_strength_huntsman',
        'pdm_rltv_strength_nba',
        'pdm_nba_price_currency',
        'pdm_nba_price_per_kg',
        'pdm_source_of_nba_price',
        'customer_name',
        'pdm_third_party',
        'pdm_adjusted_nba_price_per_kg',
        'pdm_product_differentiation',
        'pdm_top_value_drivers_differentiation',
        'pdm_other_value_drivers_differentiation',
        'pdm_spot_deal',
        'ai_freight_surcharge',
        'requested_selling_price',
        'annualized_volume_commitment',
        'price_valid_from',
        'price_valid_to',
        'srep_justification_for_lower_rsp',
        'srep_justification_for_lower_volume',
      ];
    } else if (this.user.getUser().role === UserRole.GPO_ANALYST) {
      updateColumn = ['price_valid_from', 'price_valid_to'];
    } else if (this.user.getUser().role === UserRole.KEY_USER) {
      updateColumn = [
        'ai_freight',
        'ai_last_mile',
        'ai_commission',
        'ai_duty_applied',
        'ai_rebate',
        'ai_freight_surcharge',
        'ai_profit_sharing',
        'price_valid_from',
        'price_valid_to',
      ];
    }

    const formdata = {
      file: this.file,
      columns_to_update: updateColumn,
    };

    this.pmeService.pmecsvupload(formdata).subscribe(data => {
      this.modal.hide();
    });

  }
}

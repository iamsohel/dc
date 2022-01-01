import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AgGridModule } from '@ag-grid-community/angular';

import { CoreModule } from '../core/core.module';

import { AgGridActionComponent } from './ag-grid-action.component';
import { AgGridDatepickerFromComponent } from './ag-grid-datepicker-from.component';
import { AgGridDatepickerToComponent } from './ag-grid-datepicker-to.component';
import { AgGridNavigaterComponent} from './ag-grid-navigater.component';
import { PmeApprovalRejectionComponent } from './pme-approval.-rejection.component';
import { PmeApprovalComponent } from './pme-approval.component';
import { PmeApproverListComponent } from './pme-approver-list.component';
import { PmeCommitModalComponent } from './pme-commit-modal';
import { PmeConfirmationModalComponent } from './pme-confirmation-modal';
import { PmeContextComponent } from './pme-context.component';
import { PmeEditAdditionalInfoComponent } from './pme-edit-additional-info.component';
import { PmeEditGeneralInfoComponent } from './pme-edit-general-info.component';
import { PmeEditPriceDecisionMakingComponent } from './pme-edit-price-decision-making.component';
import { PmeEditPriceReviewComponent } from './pme-edit-price-review.component';
import { PmeEditThresholdInfoComponent } from './pme-edit-threshold-info.component';
import { PmeEditComponent } from './pme-edit.component';
import { PmeListComponent } from './pme-list.component';
import { PmeService } from './pme-management.service';
import { PmeOperationsComponent } from './pme-operations.component';
import { PmeStagingUploadModalComponent } from './pme-staging-upload-modal.component';
import { PmeUploadModalComponent } from './pme-upload-modal.component';
import { PmeAgComponent } from './pme.ag.component';
import { QuotationCreateComponent } from './quotation-create.component';
import { QuotationDistributorCreateComponent } from './quotation-distributor-create.component';
import { QuotationFileDownloadComponent } from './quotation-file-download.component';
import { QuotationFileComponent } from './quotation-file.component';
import { QuotationListComponent } from './quotation-list.component';

@NgModule({
  imports: [
    RouterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    // deep cortex modules
    CoreModule,
    AgGridModule.withComponents([]),
  ],
  declarations: [
    PmeAgComponent,
    AgGridDatepickerFromComponent,
    AgGridDatepickerToComponent,
    PmeApprovalComponent,
    PmeApprovalRejectionComponent,
    PmeContextComponent,
    PmeListComponent,
    PmeEditComponent,
    PmeEditAdditionalInfoComponent,
    PmeEditGeneralInfoComponent,
    PmeEditPriceDecisionMakingComponent,
    PmeEditPriceReviewComponent,
    PmeEditThresholdInfoComponent,
    PmeOperationsComponent,
    PmeApproverListComponent,
    AgGridNavigaterComponent,
    AgGridActionComponent,
    PmeCommitModalComponent,
    PmeConfirmationModalComponent,
    PmeUploadModalComponent,
    PmeStagingUploadModalComponent,
    QuotationCreateComponent,
    QuotationFileComponent,
    QuotationDistributorCreateComponent,
    QuotationListComponent,
    QuotationFileDownloadComponent,
  ],
  exports: [
  ],
  entryComponents: [
    AgGridNavigaterComponent,
    AgGridActionComponent,
    AgGridDatepickerFromComponent,
    AgGridDatepickerToComponent,
    PmeUploadModalComponent,
    QuotationFileDownloadComponent,
    PmeStagingUploadModalComponent,
  ],
})
export class PmeModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PmeModule,
      providers: [
        PmeService,
      ],
    };
  }
}

import { Component, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

import { AlbumService } from '../../albums/album.service';
import { FlowService } from '../../compose/flow.service';
import config from '../../config';
import { ModalComponent } from '../../core-ui/components/modal.component';
import { PipelineService } from '../../pipelines/pipeline.service';
import { TableService } from '../../tables/table.service';
import { CVModelService } from '../../train/cv-model.service';
import { ModelService } from '../../train/model.service';
import { ActivityObserver } from '../../utils/activity-observer';
import { AppFormGroup } from '../../utils/forms';
import { IAsset, TObjectId } from '../interfaces/common.interface';
import { UserService } from '../services/user.service';

/**
 * This is dependent upon set of services, should work accepting LibrarySectionDefinition,
 * including some parameters definition changing the layout
 */
@Component({
  selector: 'clone-modal',
  template: `
    <app-modal #modal [captionPrefix]="'Clone ' + config.asset.labels[assetType]" [caption]="asset?.name"
      [buttons]="[{'class': 'btn-primary', disabled: cloneForm.invalid || (_savingObserver.active | async), title: 'Clone' }]"
      (buttonClick)="cloneForm.valid && _doClone()"
    >
      <form [formGroup]="cloneForm">
        <div class="form-group">
          <app-input [label]="'New ' + config.asset.labels[assetType] + ' Name'"
            [control]="cloneForm.controls.name"
          ></app-input>
          <app-input
            [label]="'New ' + config.asset.labels[assetType] + ' Description'"
            [control]="cloneForm.controls.description"
          ></app-input>
          <app-check *ngIf="cloneForm.controls.copyOnlyLabelledPictures.enabled"
            label="Include only labelled pictures"
            [control]="cloneForm.controls.copyOnlyLabelledPictures"
          ></app-check>
          <app-check *ngIf="cloneForm.controls.copySelectedAssets.enabled"
            label="Clone used assets"
            [control]="cloneForm.controls.copySelectedAssets"
          ></app-check>
        </div>
      </form>
    </app-modal>
  `,
})
export class CloneModalComponent {
  config = config;
  userId: TObjectId;
  asset: IAsset;
  assetType: IAsset.Type;
  readonly cloneForm = new AppFormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    copyOnlyLabelledPictures: new FormControl(false, Validators.required),
    copySelectedAssets: new FormControl(false, Validators.required),
  });
  readonly _savingObserver = new ActivityObserver();
  @ViewChild('modal') private modal: ModalComponent;

  constructor(
    private users: UserService,
    private tables: TableService,
    private albums: AlbumService,
    private flows: FlowService,
    private models: ModelService,
    private cvModels: CVModelService,
    private pipelines: PipelineService,
  ) {}

  public open(assetType: IAsset.Type, asset: IAsset): Observable<void> {
    this.assetType = assetType;
    this.asset = asset;
    this.userId = this.users.getUser().id;
    if (this.assetType === IAsset.Type.PIPELINE && this.userId !== this.asset.ownerId) {
      this.cloneForm.controls.copySelectedAssets.enable();
    } else {
      this.cloneForm.controls.copySelectedAssets.disable();
    }
    if (this.assetType === IAsset.Type.ALBUM) {
      this.cloneForm.controls.copyOnlyLabelledPictures.enable();
    } else {
      this.cloneForm.controls.copyOnlyLabelledPictures.disable();
    }
    this.cloneForm.reset({
      name: '',
      description: '',
      copyOnlyLabelledPictures: false,
      copySelectedAssets: false,
    });
    return this.modal.show();
  }

  protected _doClone(): void {
    let observable: Observable<any>;
    switch (this.assetType) {
      case IAsset.Type.TABLE:
        observable = this.tables.clone(this.asset.id, { name: this.cloneForm.controls['name'].value });
        break;
      case IAsset.Type.ALBUM:
        observable = this.albums.clone(this.asset.id, {
          name: this.cloneForm.controls['name'].value || undefined,
          copyOnlyLabelledPictures: this.cloneForm.controls.copyOnlyLabelledPictures.value,
        });
        break;
      case IAsset.Type.FLOW:
        observable = this.flows.clone(this.asset.id, { name: this.cloneForm.controls['name'].value });
        break;
      case IAsset.Type.MODEL:
        observable = this.models.clone(this.asset.id, {
          name: this.cloneForm.controls.name.value,
          description: this.cloneForm.controls.description.value,
        });
        break;
      case IAsset.Type.CV_MODEL:
        observable = this.cvModels.clone(
          this.asset.id,
          {
            name: this.cloneForm.controls.name.value,
            description:  this.cloneForm.controls.description.value,
          },
        );
        break;
      case IAsset.Type.PIPELINE:
        observable = this.pipelines.clone(this.asset.id, {
          name: this.cloneForm.controls['name'].value,
          description: this.cloneForm.controls['description'].value,
          copySelectedAssets: this.asset.ownerId !== this.userId ? this.cloneForm.controls['copySelectedAssets'].value : undefined,
        });
        break;
      case IAsset.Type.OPTIMIZATION:
        break;
      default:
        console.error('Unknown Asset Type');
        throw new Error('Unknown Asset Type');
    }

    this._savingObserver.observe(observable).subscribe(() => {
      this.modal.hide();
    });
  }

  static canClone(assetType: IAsset.Type): boolean {
    return [
      IAsset.Type.TABLE,
      IAsset.Type.ALBUM,
      IAsset.Type.MODEL,
      IAsset.Type.CV_MODEL,
      IAsset.Type.FLOW,
      IAsset.Type.PIPELINE,
    ].includes(assetType);
  }
}

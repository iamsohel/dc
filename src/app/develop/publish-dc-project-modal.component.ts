import { Component, ViewChild } from '@angular/core';

import * as _ from 'lodash';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/reduce';
import { Observable } from 'rxjs/Observable';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { ModalComponent } from '../core-ui/components/modal.component';
import { createComparerOfObjectsWithVersions } from '../core/core.helpers';
import { IAsset, TObjectId } from '../core/interfaces/common.interface';
import { LibrarySectionDefinition } from '../library/library.interface';
import { PipelineOperator } from '../pipelines/pipeline.interfaces';
import { PipelineService } from '../pipelines/pipeline.service';
import { ActivityObserver } from '../utils/activity-observer';
import { ReactiveLoader } from '../utils/reactive-loader';

import { IDCProject } from './dc-project.interfaces';
import { IPackage, IPackagePublish } from './package.interfaces';
import { PackageService } from './package.service';


const VERSION_COMPARER = createComparerOfObjectsWithVersions<IPackage>('version');

@Component({
  selector: 'publish-dc-project-modal',
  template: `
    <app-modal #modal
      [captionPrefix]="'Publish ${config.asset.labels[IAsset.Type.DC_PROJECT]}'"
      [buttons]="[{
        'class': 'btn-primary',
        id: '',
        disabled: !_isValid || _activityObserver.isActive,
        title: 'Publish'
      }]"
      (buttonClick)="publish()"
      [caption]="dcProject?.name"
    >
      <app-spinner [visibility]="_activityObserver.isActive || (_operatorsLoader.active | async)"></app-spinner>
      <ng-container *ngIf="packages?.length" [ngSwitch]="packages | apply: anyPackageAvailable">
        <app-select *ngSwitchCase="true"
          [label]="'Select Package'"
          [options]="packages | apply: preparePackageOptions"
          [value]="selectedPackage?.id"
          (valueChange)="selectPackage($event)"
          [disabled]="isPackageSelectorDisabled"
        ></app-select>
        <div *ngSwitchCase="false" class="alert alert-info" role="alert">
          <strong><i class="glyphicon glyphicon-exclamation-sign"></i></strong>
          All the packages of this project are already published.
        </div>
      </ng-container>

      <ng-container *ngIf="selectedPackage && categories && _operatorsLoader.loaded">
        <app-form-group *ngIf="pipelineOperators?.length > 0; else noPipelineOperator"
          [caption]="'Operators categories:'"
          [helpText]="'For each of the operators from this package one needs to provide a category.'"
        >
          <div *ngFor="let pipelineOperator of pipelineOperators; let i = index" class="row">
            <div class="col-md-6">
              <label class="pipeline-operator-name">
                {{ pipelineOperator.name }}
              </label>
            </div>
            <div class="col-md-6">
              <app-select
                [label]="'Category'"
                [options]="categories | apply: prepareCategoryOptions"
                [(value)]="publishOperators[i].categoryId"
                (valueChange)="updateValidity()"
              ></app-select>
            </div>
          </div>
        </app-form-group>
        <ng-template #noPipelineOperator>
          <span class="no-pipeline-operator">No pipeline operators defined in this package.</span>
        </ng-template>
      </ng-container>
    </app-modal>
  `,
  styles: [`
    .pipeline-operator-name {
      word-break: break-word;
      margin-top: 10px;
    }

    .no-pipeline-operator {
      font-weight: bold;
      padding: 20%
    }
  `],
})
export class PublishDcProjectModalComponent implements LibrarySectionDefinition.BulkModalComponent<IDCProject> {

  IAsset = IAsset;

  readonly _activityObserver = new ActivityObserver();

  protected dcProject: IDCProject;

  protected packages: IPackage[];
  protected categories: PipelineOperator.Category[];
  protected pipelineOperators: PipelineOperator[];
  protected publishOperators: IPackagePublish['pipelineOperators'] = [];
  protected selectedPackage: IPackage;
  protected isPackageSelectorDisabled: boolean = false;

  protected _isValid: boolean = false;
  protected _operatorsLoader: ReactiveLoader<PipelineOperator[], TObjectId>;

  @ViewChild('modal') private modal: ModalComponent;

  constructor(
    private readonly pipelineService: PipelineService,
    private readonly packageService: PackageService,
  ) {
    this.loadCategories();

    this._operatorsLoader = new ReactiveLoader(packageId => {
      this.pipelineOperators = null;
      return this.packageService.get(packageId).map(_ => _.pipelineOperators);
    });

    this._operatorsLoader.subscribe(operators => {
      this.pipelineOperators = operators;
      this.publishOperators = (operators || []).map(_ => ({
        id: _.id,
        categoryId: _.category,
      }));
      this.updateValidity();
    });
  }

  open(input: IDCProject[] | IPackage): Observable<any> {
    if (Array.isArray(input)) {
      this.dcProject = input[0];
      this.selectedPackage = null;
      this.loadPackages(this.dcProject.id);
    } else {
      this.dcProject = null;
      this.selectedPackage = input;
      this.packages = [input];
      this.loadPipelineOperators();
    }
    // only valid at this particular point
    this.isPackageSelectorDisabled = !!this.selectedPackage;

    return this.modal.show();
  }

  protected selectPackage(packageId: TObjectId) {
    this.selectedPackage = this.packages.find(_ => _.id === packageId);
    this.loadPipelineOperators();
  }

  protected publish() {
    const data: IPackagePublish = {
      pipelineOperators: this.publishOperators,
    };
    this._activityObserver.observe(this.packageService.publish(this.selectedPackage, data))
      .subscribe(() => {
        this.modal.hide();
      });
  }

  protected updateValidity() {
    this._isValid = !!this.selectedPackage
      && this.pipelineOperators && this.pipelineOperators.length === this.publishOperators.length
      && _.every(this.publishOperators, _ => !!_.categoryId);
  }

  protected readonly prepareCategoryOptions = function (
    categories: PipelineOperator.Category[],
  ): AppSelectOptionData<TObjectId>[] {
    return categories ? categories.map(category => ({
      id: category.id,
      text: category.name,
    })) : [];
  };

  protected readonly preparePackageOptions = function (packages: IPackage[]): AppSelectOptionData<TObjectId>[] {
    return packages ? packages.map(singlePackage => ({
      id: singlePackage.id,
      text: singlePackage.name + ' - ' + singlePackage.version + (singlePackage.isPublished ? ' (published)' : ''),
      disabled: singlePackage.isPublished,
    })) : [];
  };

  protected readonly anyPackageAvailable = function (packages: IPackage[]): boolean {
    return packages && _.some(packages, _ => !_.isPublished);
  };

  private loadPackages(dcProjectId: TObjectId) {
    this._activityObserver.observe(this.packageService.listAll({ dcProjectId }))
      .subscribe(packagesList => {
        this.packages = packagesList.sort(VERSION_COMPARER);
        this.selectedPackage
          ? this.loadPipelineOperators()
          : this.selectLatestUnpublishedPackage();
      });
  }

  private selectLatestUnpublishedPackage() {
    const latestPackage = this.packages.find(_ => _.version === this.dcProject.packageVersion);
    if (latestPackage && !latestPackage.isPublished) {
      this.selectedPackage = latestPackage;
      this.loadPipelineOperators();
    }
  }

  private loadPipelineOperators() {
    this._operatorsLoader.load(this.selectedPackage.id);
  }

  private loadCategories() {
    this._activityObserver.observe(this.pipelineService.listOperatorCategories())
      .subscribe(categories => {
        this.categories = categories;
      });
  }

}

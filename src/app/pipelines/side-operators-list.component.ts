import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

import * as _ from 'lodash';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { createComparerOfObjectsWithVersions } from '../core/core.helpers';
import { ReactiveLoader } from '../utils/reactive-loader';

import { OperatorInfoModalComponent } from './operator-info-modal.component';
import { PipelineOperator } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

const UNPUBLISHED_CATEGORY_ID = ''; // non-existing category

interface OperatorTreeItem {
  readonly operator: PipelineOperator;
  suffix?: string;
}
type OperatorsTree = {[category: string]: OperatorTreeItem[]};

const VERSION_COMPARER = createComparerOfObjectsWithVersions<PipelineOperator>('packageVersion');

const UNIQUE_IDENTIFIER = (o: PipelineOperator) => `${o.packageName}:${o.moduleName}.${o.className}`;
const IDENTIFIERS: ((operator: PipelineOperator) => string)[] = [
  o => o.packageName,
  o => o.className,
  o => `${o.moduleName}.${o.className}`,
  o => `${o.packageName}:${o.moduleName}.${o.className}`,
  UNIQUE_IDENTIFIER,
];

@Component({
  selector: 'side-operators-list',
  template: `
    <operator-info-modal #operatorInfoModal></operator-info-modal>
    <div class="menu like-side-asset-list app-spinner-box">
      <app-spinner [visibility]="initialDataLoader.active | async"></app-spinner>
      <ul class="nav nav-stacked" *ngIf="initialDataLoader.loaded">
        <li class="top-level-menu">
          <a>
            <i class="glyphicon glyphicon-random"></i>
            Pipeline Operators
          </a>
        </li>
        <li>
          <app-input
            [control]="searchControl"
            iconBefore="glyphicon-search"
            iconAfter="glyphicon-remove"
            (iconAfterClick)="searchControl.setValue('')"
          ></app-input>
        </li>
        <ng-container *ngVar="(operators | apply: _prepareOperators: _searchQuery) as operatorsTree">
          <li *ngIf="!(operatorsTree | keys).length">
            <ul class="nav nav-pills submenu">
              <li>
                <a>{{_searchQuery ? 'No operators found for "' +  _searchQuery + '"' : 'No operators'}}</a>
              </li>
            </ul>
          </li>
          <li class="has-submenu" *ngFor="let categoryId of operatorsTree | apply: _extractCategoryIds; let i = index"
            [ngClass]="{'open': _expandedCategories | apply: _includes: categoryId}"
          >
            <a (click)="_toggleExpanded(categoryId)">
              <i class="ml-icon ml-icon-tight ml-icon-{{categoryId | apply: _getCategoryIcon: categories}}"></i>
              <span>{{categoryId | apply: _getCategoryName: categories}} <span class="badge">{{operatorsTree[categoryId].length}}</span></span>
            </a>
            <ul class="nav nav-pills submenu with-dropdown with-icons"
              *ngIf="_expandedCategories | apply: _includes: categoryId">
              <li *ngFor="let item of operatorsTree[categoryId]"
              >
                <a [title]="item | apply: _getItemTitle">
                  <span
                    dnd-draggable
                    [dragEnabled]="true"
                    [dragData]="{ pipelineOperator: item.operator }"
                  >{{item.operator.name}}</span>
                  <span *ngIf="item.suffix" class="operator-suffix">({{item.suffix}})</span>
                </a>
                <i class="info-sign glyphicon glyphicon-info-sign" (click)="_operatorInfoModal.show(item.operator)"></i>
              </li>
              <li *ngIf="!operators.length"><a>No Operators</a></li>
            </ul>
          </li>
        </ng-container>
      </ul>
    </div>
  `,
})
export class SideOperatorsListComponent implements OnDestroy {
  readonly config = config;
  readonly initialDataLoader: ReactiveLoader<[PipelineOperator[], PipelineOperator.Category[]], any>;
  operators: PipelineOperator[] = [];
  categories: {[id: string]: PipelineOperator.Category} = {};

  @ViewChild('operatorInfoModal') protected _operatorInfoModal: OperatorInfoModalComponent;
  protected _expandedCategories: string[] = [];

  private _subscriptions: Subscription[] = [];
  private searchControl = new FormControl('');
  private _searchQuery = '';

  constructor(
    private pipelineService: PipelineService,
  ) {
    this.initialDataLoader = new ReactiveLoader(() => forkJoin(
      this.pipelineService.listAllOperators(),
      this.pipelineService.listOperatorCategories(),
    ));

    this._subscriptions.push(this.initialDataLoader.subscribe(([operators, categories]) => {
      const packagesLastVersions = _.chain(operators)
        .groupBy((o: PipelineOperator) => o.packageName)
        .mapValues(ops => ops.reduce(
          (soFar: PipelineOperator, item: PipelineOperator) => VERSION_COMPARER(soFar, item) > 0 ? item : soFar,
          ops[0],
        ).packageVersion)
        .value();
      this.operators = operators.filter(
        (o: PipelineOperator) => o.packageVersion === packagesLastVersions[o.packageName],
      );
      this.categories = _.keyBy(categories, c => c.id);
    }));

    this.searchControl.valueChanges.debounceTime(500).subscribe((value) => {
      this._searchQuery = value;
    });

    this.initialDataLoader.load();
  }

  _prepareOperators = (operators: PipelineOperator[], searchQuery: string): OperatorsTree => {
    let _operators = _.chain(operators);
    if (searchQuery) {
      const query = searchQuery.toLocaleLowerCase();
      _operators = _operators.filter((operator: PipelineOperator) => operator.name.toLocaleLowerCase().includes(query));
    }
    const result = _operators
      .orderBy(o => o.name.toLowerCase())
      .map((o: PipelineOperator): OperatorTreeItem => ({operator: o}))
      .groupBy((i: OperatorTreeItem) => i.operator.category || UNPUBLISHED_CATEGORY_ID)
      .value();
    // update suffix for same-named operators
    _.forOwn(result, items => {
      _.forOwn(_.groupBy(items, i => i.operator.name), group => {
        if (group.length > 1) {
          const sameNamedOperators = group.map(i => i.operator);
          const minIdentifier = IDENTIFIERS.find(
            d => Object.keys(_.groupBy(sameNamedOperators, d)).length === group.length,
          );
          if (!minIdentifier) {
            console.log(sameNamedOperators);
            throw new Error('Unable to find difference between same-named operators');
          }
          group.forEach((i) => {
            i.suffix = minIdentifier(i.operator);
          });
        }
      });
    });

    return result;
  };

  ngOnDestroy(): void {
    this._subscriptions.forEach(_ => _.unsubscribe());
  }

  _toggleExpanded(category: string): void {
    const index = this._expandedCategories.indexOf(category);
    if (index < 0) {
      this._expandedCategories = [...this._expandedCategories, category];
    } else {
      this._expandedCategories.splice(index, 1);
      this._expandedCategories = [...this._expandedCategories];
    }
  }

  readonly _includes = function(arr: any[], val: any): boolean {
    return arr.includes(val);
  };

  readonly _extractCategoryIds = function(operatorsTree: {}): string[] {
    return Object.keys(operatorsTree).sort();
  };

  _getCategoryName(categoryId: string, categories: {[key: string]: PipelineOperator.Category}): string {
    if (categoryId === UNPUBLISHED_CATEGORY_ID) {
      return 'Not Published';
    }
    if (categoryId in categories) {
      return categories[categoryId].name;
    }
    return categoryId;
  }

  _getCategoryIcon(categoryId: string, categories: {[key: string]: PipelineOperator.Category}): string {
    if (categoryId === UNPUBLISHED_CATEGORY_ID) {
      return 'not-published';
    }
    if (categoryId in categories) {
      return categories[categoryId].icon;
    }
    return 'unknown';
  }

  _getItemTitle(item: OperatorTreeItem): string {
    return (item.operator.description || item.operator.name) + (item.suffix ? ` (${item.suffix})` : '');
  }

}

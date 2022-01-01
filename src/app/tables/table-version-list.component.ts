import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { delay } from 'rxjs/operators/delay';
import { switchMap } from 'rxjs/operators/switchMap';
import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { IColumnSortConfig } from '../core-ui/directives/grid-sort.directive';
import { AssetOperationsComponent } from '../core/components/asset-operations.component';
import { IAsset, IAssetListRequest, IBackendList, IListRequest, TObjectId } from '../core/interfaces/common.interface';
import { IProject } from '../core/interfaces/project.interface';
import { IUser, IUsersMap } from '../core/interfaces/user.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { SharedResourceService } from '../core/services/shared-resource.service';
import { UserService } from '../core/services/user.service';
import { ProjectContext } from '../library/project.context';
import { ProjectService } from '../library/project.service';
import { bulkAction } from '../utils/observable';
import { ReactiveLoader } from '../utils/reactive-loader';

import { ITable } from './table.interface';
import { TableService } from './table.service';

@Component({
  selector: 'table-version-list',
  templateUrl: './table-version-list.component.html',
})
export class TableVersionListComponent implements OnDestroy, OnInit {
  form: FormGroup;
  searchControl: FormControl;
  project: IProject;

  itemsList: IBackendList<ITable>;
  selectedItems: ITable[] = [];
  scope: null | 'all' | 'personal' | 'shared';
  readonly config = config;
  readonly _itemsLoader: ReactiveLoader<IBackendList<ITable>, void>;
  readonly _itemsDataLoading: Observable<boolean>;

  readonly baseColumns: IColumnSortConfig[] = [
    { name: 'Version', alias: 'version', style: 'width: 8%; text-align: center' },
    { name: 'Description' },
    { name: 'Status', style: 'width: 5%; text-align: center' },
    { name: 'Created', alias: 'created', style: 'width: 12%', reverse: true },
    { name: 'Owner', style: 'width: 12%' },
    { name: 'Type', style: 'width: 12%' },
  ];

  readonly SCOPES: string[] = [
    'personal',
    'shared',
    'all',
  ];

  protected currentUser: IUser;
  protected _sharedOwners: IUsersMap = {};

  @ViewChild('operations') private operations: AssetOperationsComponent;

  private formSubscription: Subscription;
  private eventSubscription: Subscription;
  private userSubscription: Subscription;
  private projectContextSubscription: Subscription;
  private routeSubscription: Subscription;
  private parentId: TObjectId;
  private _tableName: string;

  private _sharedOwnersLoader: ReactiveLoader<IUsersMap, ITable[]>;

  constructor(
    private projects: ProjectService,
    private events: EventService,
    private shares: SharedResourceService,
    private users: UserService,
    private tableService: TableService,
    private route: ActivatedRoute,
    private _location: Location,
    private router: Router,
    @Optional() private projectContext: ProjectContext,
  ) {
    this.currentUser = this.users.getUser();
    this.userSubscription = this.users.user.subscribe(user => this.currentUser = user);

    this._sharedOwnersLoader = new ReactiveLoader((items) => this._loadSharedOwners(items));
    this._sharedOwnersLoader.subscribe(_ => {
      Object.assign(this._sharedOwners, _);
    });

    this.form = new FormGroup({
      type: new FormControl(),
      scope: new FormControl(''),
      search: new FormControl(''),
      order: new FormControl('-created'),
      page: new FormControl(1),
      page_size: new FormControl(config.defaultPageSize),
    });

    this.searchControl = new FormControl();
    this.searchControl.valueChanges.debounceTime(500).subscribe((value) => {
      this.form.patchValue({
        search: value,
        page: 1,
      });
    });

    this._itemsLoader = new ReactiveLoader(() => {
      const formValue: IListRequest = this.form.value;
      let listRequest: IAssetListRequest = {
        search: formValue.search,
        order: formValue.order,
        page: formValue.page,
        page_size: formValue.page_size,
        scope: formValue.scope,
      };

      if (this.projectContext) {
        const [projectId, folderId] = this.projectContext.get();
        listRequest = {...listRequest, projectId, folderId};
      }

      return this._loadItems(listRequest).do((items) => {
        this.setTableName(items.data);
        this._sharedOwnersLoader.load(items.data);
      });
    });
    this._itemsLoader.subscribe((itemsList) => {
      this.itemsList = itemsList;
      const oldSelectedIds = this.selectedItems.map(_ => _.id);
      this.selectedItems = itemsList.data.filter(_ => oldSelectedIds.includes(_.id));
    });

    this.routeSubscription = this.route.params.subscribe(params => {
      this.scope = params['scope'];
      this.parentId = params['itemId'];
      if (!this.SCOPES.includes(this.scope)) {
        this.router.navigate(['/desk', 'library', 'tables', 'personal', this.parentId, 'versions']);
      } else {
        this.form.controls.scope.setValue(this.scope);
        this._itemsLoader.load();
      }
    });

    this._itemsDataLoading = this._itemsLoader.active.pipe(switchMap(active => {
      return Observable.of(active).pipe(delay(active ? 500 : 0));
    }));
  }

  ngOnInit() {
    this.eventSubscription = this.events.subscribe((event) => {
      if (
        event.type === IEvent.Type.UPDATE_TABLE_LIST ||
        (this.project && event.type === IEvent.Type.UPDATE_PROJECT_ASSETS && event.data === this.project.id)
      ) {
        this._itemsLoader.load();
      }
    });

    this.formSubscription = this.form.valueChanges.debounceTime(100)
      .subscribe(() => this._itemsLoader.load());

    if (this.projectContext) {
      this.projectContextSubscription = this.projectContext.value
        .do(() => this._itemsLoader.load())
        .map(([projectId, _folderId]: TObjectId[]) => projectId)
        .distinctUntilChanged()
        .flatMap(projectId => {
          return projectId
            ? this.projects.get(projectId)
            : Observable.of(null);
        })
        .subscribe(project => {
          this.project = project;
        });
    }
  }

  ngOnDestroy() {
    this.projectContextSubscription && this.projectContextSubscription.unsubscribe();
    this.formSubscription && this.formSubscription.unsubscribe();
    this.eventSubscription && this.eventSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }

  share(item: ITable) {
    this.operations.shareModal.open(IAsset.Type.TABLE, [item]);
  }

  clone(item: ITable) {
    this.operations.cloneModal.open(IAsset.Type.TABLE, item);
  }

  deleteItem(item: ITable) {
    this.operations.trash([item]);
  }

  removeItemFromProject(item: ITable) {
    this.projects.unlinkAssets<ITable>(IAsset.Type.TABLE, this.project, [item]);
  }

  changeSelection(item: ITable, checked: boolean) {
    let i = this.isSelected(item);
    if (checked) {
      i >= 0 || (<any[]> this.selectedItems).push(item);
    } else {
      i >= 0 && (<any[]> this.selectedItems).splice(i, 1);
    }
    this.selectedItems = [...this.selectedItems];
  }

  selectAllItems(checked: boolean) {
    if (checked) {
      this.selectedItems = [...this.itemsList.data];
    } else {
      this.selectedItems = [];
    }
  }

  isSelected(currentItem: ITable): number {
    return (<any[]> this.selectedItems).findIndex(item => item.id === currentItem.id);
  }

  isAllSelected(): boolean {
    return this.selectedItems.length === this.itemsList.data.length;
  }

  _prepareLink = (item: ITable) => {
    const link = ['/desk', 'library', 'tables'];
    let scope = this.route.snapshot.params['scope'];
    if (scope) {
      link.push(scope);
    }

    link.push(item.id);

    return link;
  };

  _backToPrevious() {
    this._location.back();
  }

  setTableName(tables: ITable[]): void {
    if (!this._tableName) {
      let recentTable = tables.filter(table => table.current);
      let tableWithNames = tables.filter(table => table.name);
      this._tableName = _.get(recentTable, [0, 'name']) || _.get(tableWithNames, [0, 'name']);
    }
  }

  private _loadItems(params?: IAssetListRequest): Observable<IBackendList<ITable>> {
    const items$ = this.tableService.versions(this.parentId, params);
    return items$.map((list): IBackendList<ITable> => list);
  }

  private _loadSharedOwners(items: ITable[]): Observable<IUsersMap> {
    const sharedItems = items.filter(_ => {
      return _.ownerId !== this.currentUser.id;
    });

    if (sharedItems.length) {
      return this.shares.ensureSharedAccessLoaded(IAsset.Type.TABLE, sharedItems.map(_ => _.id)).flatMap(() => {
        const observables = items
          .filter(item => {
            return !this._sharedOwners.hasOwnProperty(item.ownerId);
          })
          .map(item => {
            return this.shares.getSharedAssetOwner(IAsset.Type.TABLE, item.id);
          });

        if (!observables.length) {
          return Observable.of({});
        }

        return bulkAction(observables).map(users => users.reduce((acc, user: IUser) => {
          acc[user.id] = user;
          return acc;
        }, {}));
      });
    }

    return Observable.of({});
  }
}

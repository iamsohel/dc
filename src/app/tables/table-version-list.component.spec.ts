import { APP_BASE_HREF, Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { ApplyPipe, PluralizePipe, SafePipe } from '../core-ui/core-ui.pipes';
import { AssetOperationsComponent } from '../core/components/asset-operations.component';
import { AppUserNamePipe } from '../core/core.pipes';
import { IAsset } from '../core/interfaces/common.interface';
import { IUser } from '../core/interfaces/user.interface';
import { EventService } from '../core/services/event.service';
import { SharedResourceService } from '../core/services/shared-resource.service';
import { UserService } from '../core/services/user.service';
import { ProjectContext } from '../library/project.context';
import { ProjectService } from '../library/project.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { SharedResourceServiceMock } from '../mocks/shared-resource.service.mock';

import { TableVersionListComponent } from './table-version-list.component';
import { ITable } from './table.interface';
import { TableService } from './table.service';

class MockActivatedRoute {
  params: Observable<any>;
  snapshot: any;

  constructor() {
    this.params = new ReplaySubject<any>(1);
    this.snapshot = {
      params: {
        scope: 'personal',
      },
    };
  }
}

class MockUserService {
  user: Observable<IUser>;

  constructor() {
    this.user = new ReplaySubject<IUser>(1);
  }

  getUser() {
    return { id: '' };
  }
}

class MockTableService {
  versions() { return of([]); }
}

class MockAssetOperationsComponent {
  shareModal: any;
  cloneModal: any;
  constructor() {
    this.shareModal = {
      open() {},
    };
    this.cloneModal = {
      open() {},
    };
  }
  trash(arr: any[]): void { }
}

class MockLocation {
  back() { }
}

describe('Functionalities of table-version-list component', () => {
  let route = new MockActivatedRoute(),
    userService = new MockUserService(),
    tableService = new MockTableService(),
    fixture: ComponentFixture<TableVersionListComponent>,
    component: TableVersionListComponent,
    operations = new MockAssetOperationsComponent(),
    location = new MockLocation();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EventService, useClass: EventServiceMock },
        { provide: SharedResourceService, useClass: SharedResourceServiceMock },
        { provide: UserService, useValue: userService },
        { provide: TableService, useValue: tableService },
        { provide: ActivatedRoute, useValue: route },
        { provide: Location, useValue: location },
        { provide: ProjectService, useValue: {} },
        ProjectContext,
        { provide: APP_BASE_HREF, useValue: '/' },
      ],
      imports: [
        RouterTestingModule,
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      declarations: [
        TableVersionListComponent,
        ApplyPipe,
        AppUserNamePipe,
        PluralizePipe,
        SafePipe,
      ],
    })
    .compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(TableVersionListComponent);
      fixture.detectChanges();
      component = fixture.componentInstance;
      component['operations'] = <AssetOperationsComponent> operations;
    });
  }));

  it('should create the component', () => {
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should use assetOperationComponent to share an item', () => {
    operations.shareModal.open = jasmine.createSpy('share');
    let table = <ITable> {};

    component.share(table);

    expect(operations.shareModal.open).toHaveBeenCalledWith(IAsset.Type.TABLE, [table]);
  });

  it('should use assetOperationComponent to clone an item', () => {
    operations.cloneModal.open = jasmine.createSpy('clone');
    let table = <ITable> {};

    component.clone(table);

    expect(operations.cloneModal.open).toHaveBeenCalledWith(IAsset.Type.TABLE, table);
  });

  it('should use assetOperationComponent to delete an item', () => {
    operations.trash = jasmine.createSpy('trash');
    let table = <ITable> {};

    component.deleteItem(table);

    expect(operations.trash).toHaveBeenCalledWith([table]);
  });

  it('should use versions method of tableservice to load data', () => {
    let parentId = '123',
        params = {};
    spyOn(tableService, 'versions').and.returnValue(Observable.of({data: [], count: 0}));
    component['parentId'] = parentId;

    component['_loadItems'](params);

    expect(tableService.versions).toHaveBeenCalledWith(parentId, params);
  });

  it('should navigate to the previous page if backToPrevious is called', () => {
    spyOn(location, 'back');

    component._backToPrevious();

    expect(location.back).toHaveBeenCalled();
  });

  describe('SetTableName funtionalities', () => {
    it('should not set the table name if it is already set', () => {
      let initialTableName = 'Sample Table Name';
      component['_tableName'] = initialTableName;
      let tables = <ITable[]> [
        { name: 'new table 1' },
        {},
      ];

      component.setTableName(tables);

      expect(component['_tableName']).toEqual(initialTableName);
    });

    it('should set the table name if it is not already set', () => {
      let tableName = 'sample Table Name';
      component['_tableName'] = undefined;
      let tables = <ITable[]> [
        { name: tableName },
        {},
      ];

      component.setTableName(tables);

      expect(component['_tableName']).toEqual(tableName);
    });
  });

  describe('Select items functionalities', () => {
    const checkedEvent: boolean = true,
      uncheckedEvent: boolean = false;

    beforeEach(() => {
      let assetData = <any[]> [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ];

      component.itemsList = {
        count: 5,
        data: <ITable[]> assetData,
      };

      fixture.detectChanges();
    });

    it('should add the item to selected list if it is selected', () => {
      let selectedItem = component.itemsList.data[0];
      component.selectedItems = [];
      let selectedItemCheckBox = fixture.debugElement.query(
        By.css(`[data-testid='select-${selectedItem.id}']`),
      );

      selectedItemCheckBox.triggerEventHandler('checkedChange', checkedEvent);

      expect(component.selectedItems).toEqual([selectedItem]);
    });

    it('should remove the item from selected list if it is deselected', () => {
      let selectedItem = component.itemsList.data[0];
      component.selectedItems = [selectedItem];
      let selectedItemCheckBox = fixture.debugElement.query(
        By.css(`[data-testid='select-${selectedItem.id}']`),
      );

      selectedItemCheckBox.triggerEventHandler('checkedChange', uncheckedEvent);

      expect(component.selectedItems).toEqual([]);
    });

    it('should add all the items to the selected list if all selected checkbox is checked', () => {
      component.selectedItems = [];
      let selectedItemCheckBox = fixture.debugElement.query(
        By.css(`[data-testid='select-all-checkbox']`),
      );

      selectedItemCheckBox.triggerEventHandler('checkedChange', checkedEvent);

      expect(component.selectedItems).toEqual(component.itemsList.data);
    });

    it('should remove all the items from the selected list if all selected checkbox is unchecked', () => {
      component.selectedItems = component.itemsList.data;
      let selectedItemCheckBox = fixture.debugElement.query(
        By.css(`[data-testid='select-all-checkbox']`),
      );

      selectedItemCheckBox.triggerEventHandler('checkedChange', uncheckedEvent);

      expect(component.selectedItems).toEqual([]);
    });
  });
});

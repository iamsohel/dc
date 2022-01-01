import { APP_BASE_HREF } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { CoreUIModule } from '../../core-ui/core-ui.module';
import { LIBRARY_SECTIONS } from '../../library/library.interface';
import { ProjectContext } from '../../library/project.context';
import { ProjectService } from '../../library/project.service';
import { EventServiceMock } from '../../mocks/event.service.mock';
import { AclService } from '../../services/acl.service';
import { ITable } from '../../tables/table.interface';
import { CoreModule } from '../core.module';
import { IAsset } from '../interfaces/common.interface';
import { EventService } from '../services/event.service';
import { FeatureToggleService } from '../services/feature-toggle.service';

import { LibrarySelectorComponent } from './library-selector.component';

class ProjectServiceMock {
  constructor() { }
  list() {
    return [];
  }
}

class FeatureToggleServiceMock {
  constructor() { }
  areFeaturesEnabled(args) { return true; }
}

class AclServiceMock {
  constructor() { }
  canViewVersions(item) { return true; }
}

const Sections = [
  {
    assetType: 'TABLE',
  },
];

describe('Functionalities of Library Selector Component', () => {
  let fixture: ComponentFixture<LibrarySelectorComponent>,
    component: LibrarySelectorComponent,
    projectService = new ProjectServiceMock(),
    featureToggleService = new FeatureToggleServiceMock(),
    acl = new AclServiceMock();


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatureToggleService, useValue: featureToggleService },
        { provide: ProjectService, useValue: projectService },
        { provide: EventService, useValue: EventServiceMock },
        { provide: LIBRARY_SECTIONS, useValue: Sections },
        { provide: APP_BASE_HREF, useValue: '/' },
        ProjectContext,
        { provide: AclService, useValue: acl },
      ],
      imports: [
        RouterModule.forRoot([]),
        BrowserModule,
        FormsModule,
        CoreUIModule.forRoot(),
        ReactiveFormsModule,
        CoreModule.forRoot(),
      ],
    });
    fixture = TestBed.createComponent(LibrarySelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  describe('table version functionalities', () => {
    beforeEach(() => {
      component.entity = IAsset.Type.TABLE;
    });

    describe('canViewVersions function ', () => {
      let entity = <IAsset> {},
        entityType = IAsset.Type.TABLE;

      it('should return false if the entity is not table', () => {
        let result = component.canViewVersions(entity, IAsset.Type.ALBUM);

        expect(result).toBeFalsy();
      });

      it('should execute aclService function if the entity is table', () => {
        spyOn(acl, 'canViewVersions');

        component.canViewVersions(entity, entityType);

        expect(acl.canViewVersions).toHaveBeenCalled();
        expect(acl.canViewVersions).toHaveBeenCalledWith(entity);
      });

      it('should return the value that aclService returned if the entity is table', () => {
        spyOn(acl, 'canViewVersions').and.returnValue(true);

        let result = component.canViewVersions(entity, entityType);

        expect(result).toBeTruthy();
      });
    });

    describe('toggleVersionTable function', () => {
      let item = <ITable> {};
      beforeEach(() => {
        item = <ITable> {};

        let section = {
          service: {
            versions: (a, b) => {
              return [];
            },
          },
        };
        component['_getSection'] = jasmine.createSpy('getSection').and.returnValue(section);
        spyOn(component, 'setCustomLoader');
      });

      describe('toggling functionality', () => {
        it('should set the state of showVersionTable false if it was true before', () => {
          component.showVersionTable = true;

          component.toggleVersionTable(item);

          expect(component.showVersionTable).toBeFalsy();
        });

        it('should set the state of showVersionTable true if it was false before', () => {
          component.showVersionTable = false;

          component.toggleVersionTable(item);

          expect(component.showVersionTable).toBeTruthy();
        });
      });

      it('should set customloader to null if try to load the table list view', () => {
        component.showVersionTable = true;

        component.toggleVersionTable(item);

        expect(component.setCustomLoader).toHaveBeenCalled();
        expect(component.setCustomLoader).toHaveBeenCalledWith(null);
      });

      it('should set the customloader to load the version of a table if the versions are not showing currently', () => {
        component.showVersionTable = false;

        component.toggleVersionTable(item);

        expect(component.setCustomLoader).toHaveBeenCalled();
      });
    });

    describe('tableName property', () => {
      let item = <ITable> {
        name: 'Sample Table name',
      };

      it('should be set when the version table is shown', () => {
        component.showVersionTable = false;
        component.tableName = undefined;
        spyOn(component, 'setCustomLoader');

        component.toggleVersionTable(item);

        expect(component.tableName).toEqual(item.name);
      });

      it('should be modified by the perhapsFormatName funciton if the entity type is table and item has name', () => {
        component.tableName = undefined;
        component['perhapsFormatName'](item);

        expect(component.tableName).toEqual(item.name);
      });

      it('should not be modified by the perhapsFormatName function if the entity type is table and item does not have name', () => {
        let initialName = 'some table name';
        item.name = undefined;
        component.tableName = initialName;

        component['perhapsFormatName'](item);

        expect(component.tableName).toEqual(initialName);
        expect(component.tableName).not.toEqual(item.name);
      });

      it('should not be modified by the perhapsFormatName function if the entity type is not table', () => {
        let initialName = 'some table name';
        component.tableName = initialName;
        component.entity = IAsset.Type.ALBUM;
        item.name = 'some name';

        component['perhapsFormatName'](item);

        expect(component.tableName).toEqual(initialName);
        expect(component.tableName).not.toEqual(item.name);
      });
    });
  });
});

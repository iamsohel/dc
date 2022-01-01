import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';

import { IListRequest } from '../core/interfaces/common.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { NotificationService } from '../core/services/notification.service';
import { ProcessService } from '../core/services/process.service';
import { SharedResourceService } from '../core/services/shared-resource.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { AppHttpMock } from '../mocks/http.mock';
import { NotificationServiceMock } from '../mocks/notification.service.mock';
import { ProcessServiceMock } from '../mocks/process.service.mock';
import { SharedResourceServiceMock } from '../mocks/shared-resource.service.mock';

import { IDCProject, IDCProjectCreate, IDCProjectUpdate } from './dc-project.interfaces';
import { DCProjectService } from './dc-project.service';

interface IDCProjectFileCreate {
  filePath: string;
  data: string;
}

interface IDCProjectFileUpdate extends IDCProjectFileCreate {
  lastKnownModifiedTime: string;
}

describe('DCProjectService', () => {
  const params: IListRequest = {
    page: 1,
    page_size: 5,
  };

  let service: DCProjectService,
  executeSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: NotificationService,
          useClass: NotificationServiceMock,
        },
        {
          provide: EventService,
          useClass: EventServiceMock,
        },
        {
          provide: AppHttp,
          useClass: AppHttpMock,
        },
        {
          provide: ProcessService,
          useClass: ProcessServiceMock,
        },
        {
          provide: SharedResourceService,
          useClass: SharedResourceServiceMock,
        },
        DCProjectService,
      ],
    });

    executeSpy = spyOn(AppHttp, 'execute').and.callFake((data) => Observable.of(data)).and.callThrough();
    service = TestBed.get(DCProjectService);
  });

  afterEach(() => {
    executeSpy.calls.reset();
  });

  it('should return a list of dc projects', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callThrough();
    service.list(params).subscribe();
    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args).toEqual(['dc-projects', params]);
  }));

  it('should get a dc project', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callThrough();
    service.get('dcProjectId123').subscribe();
    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args).toEqual(['dc-projects/dcProjectId123']);
  }));

  it('should create a dc project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify) => {
    const httpPostSpy = spyOn(http, 'post').and.callThrough();
    const emitEventSpy = spyOn(eventService, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const data: IDCProjectCreate = {
      name: 'new DC Project',
      description: 'Description of a new DC Project',
    };

    service.create({...data}).subscribe();

    expect(httpPostSpy.calls.count()).toBe(1);
    expect(httpPostSpy.calls.mostRecent().args).toEqual(['dc-projects', data]);

    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_DC_PROJECT_LIST]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.CREATE_DC_PROJECT, data]);

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['DC Project has been created: ' + data.name]);
  }));


  it('should update a dc project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify) => {
    const httpPutSpy = spyOn(http, 'put').and.callThrough();
    const emitEventSpy = spyOn(eventService, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const data: IDCProjectUpdate = {
      name: 'updated DC Project',
      description: 'Description of the updated DC Project',
    };

    const dcProjectId = 'dcProjectId123';
    service.update(dcProjectId, {...data}).subscribe();

    expect(httpPutSpy.calls.count()).toBe(1);
    expect(httpPutSpy.calls.mostRecent().args).toEqual(['dc-projects/dcProjectId123', data]);

    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_DC_PROJECT_LIST]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_DC_PROJECT, { id: dcProjectId }]);

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['DC Project has been updated: ' + data.name]);
  }));

  it('should update file content' , inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify) => {
    const httpPutSpy = spyOn(http, 'put').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const fileData: IDCProjectFileUpdate = {
      filePath: 'url',
      data: 'File Updated',
      lastKnownModifiedTime: JSON.stringify({
        headers: {
          'If-Unmodified-Since': new Date('2019-05-13T09:21:22Z').toUTCString(),
        },
      }),
    };

    const dcProjectFileId = 'dcProjectFileId123';
    const updatedData: string = 'File Updated';
    const lastKnownModifiedTime = '2019-05-13T09:21:22Z';
    service.updateFileContent(dcProjectFileId, 'url', updatedData, lastKnownModifiedTime).subscribe();

    expect(httpPutSpy.calls.count()).toBe(1);
    expect(httpPutSpy.calls.mostRecent().args).toEqual(['dc-projects/dcProjectFileId123/files/url', fileData.data, {}, JSON.parse(fileData.lastKnownModifiedTime)]);

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['DC Project file has been updated: ' + fileData.filePath]);
  }));

  it('should create file content' , inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify) => {
    const httpPutSpy = spyOn(http, 'put').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const fileData: IDCProjectFileCreate = {
      filePath: 'url',
      data: 'File Created',
    };

    const dcProjectFileId = 'dcProjectFileId123';
    const updatedData: string = 'File Created';
    service.createFileContent(dcProjectFileId, 'url', updatedData).subscribe();

    expect(httpPutSpy.calls.count()).toBe(1);
    expect(httpPutSpy.calls.mostRecent().args).toEqual(['dc-projects/dcProjectFileId123/files/url', fileData.data, {}]);

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['DC Project file has been created: ' + fileData.filePath]);
  }));

  it('should delete a dc project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify) => {
    const httpDeleteSpy = spyOn(http, 'delete').and.callThrough();
    const emitEventSpy = spyOn(eventService, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const data: IDCProject = {
      id: 'dcProjectId123',
      ownerId: 'ownerId1',
      updated: '2019-02-18T08:01:03.471Z',
      created: '2019-02-18T08:01:03.471Z',
      name: 'DC Project to delete',
      description: 'Description of DC Project',
      status: IDCProject.Status.IDLE,
    };

    service.delete({...data}).subscribe();

    expect(httpDeleteSpy.calls.count()).toBe(1);
    expect(httpDeleteSpy.calls.mostRecent().args).toEqual(['dc-projects/dcProjectId123']);

    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_DC_PROJECT_LIST]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.DELETE_DC_PROJECT, {id: data.id}]);

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['DC Project has been deleted: ' + data.name]);
 }));

 it('getActiveProcess should not call ProcessesService.getByTarget when status is IDLE', inject([ProcessService], (processService: ProcessService) => {
    const processSpy = spyOn(processService, 'getByTarget').and.callThrough();

    const data: IDCProject = {
      id: 'dcProjectId123',
      ownerId: 'ownerId1',
      updated: '2019-02-18T08:01:03.471Z',
      created: '2019-02-18T08:01:03.471Z',
      name: 'DC Project to delete',
      description: 'Description of DC Project',
      status: IDCProject.Status.IDLE,
    };

    service.getActiveProcess(data).subscribe();
    expect(processSpy.calls.count()).toBe(0);
 }));

 it('should encode filePath when creating and updating file content' , inject([AppHttp], (http: AppHttp) => {
   const httpPutSpy = spyOn(http, 'put').and.callThrough();
   const filePath: string = 'directory()1 newDirectory@1/subdirectory#1/file 1';
   const expectedFilePath = 'dc-projects/dcProjectId123/files/directory()1%20newDirectory%401/subdirectory%231/file%201';

   service.createFileContent('dcProjectId123', filePath, '123').subscribe();

   expect(httpPutSpy.calls.count()).toBe(1);
   expect(httpPutSpy.calls.mostRecent().args[0]).toEqual(expectedFilePath);

   service.updateFileContent('dcProjectId123', filePath, '123').subscribe();

   expect(httpPutSpy.calls.count()).toBe(2);
   expect(httpPutSpy.calls.mostRecent().args[0]).toEqual(expectedFilePath);
 }));
});

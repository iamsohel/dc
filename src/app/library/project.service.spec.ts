import { TestBed, inject } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';

import { IBackendList } from '../core/interfaces/common.interface';
import { IProject, IProjectFolder } from '../core/interfaces/project.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { NotificationService } from '../core/services/notification.service';
import { ProcessService } from '../core/services/process.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { AppHttpMock } from '../mocks/http.mock';
import { NotificationServiceMock } from '../mocks/notification.service.mock';

import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService,
    executeSpy: jasmine.Spy;
  let project: IProject;
  let folder: IProjectFolder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppHttp,
          useClass: AppHttpMock,
        },
        {
          provide: NotificationService,
          useClass: NotificationServiceMock,
        },
        {
          provide: EventService,
          useClass: EventServiceMock,
        },
        ProcessService,
        ProjectService,
      ],
    });
    service = TestBed.get(ProjectService);
    executeSpy = spyOn(AppHttp, 'execute').and.callFake((data) => Observable.of(data)).and.callThrough();
    folder = {id : 'f1', 'path': 'path-fo-folder'};
    project = <IProject> {
        id: 'p1',
        name: 'First project',
        ownerId: 'ownerId1',
        created: '2017-03-24T13:57:29.522Z',
        updated: '2017-03-24T13:57:29.522Z',
        folders: [],
      };
  });
  afterEach(() => {
    executeSpy.calls.reset();
  });

  it('should return list of projects', inject([AppHttp], (http: AppHttp) => {
    const response: IBackendList<IProject> = {
      count: 1,
      data: [project],
    };
    const httpGetSpy = spyOn(http, 'get').and.callFake(() => {
      return Observable.of(response);
    });

    service.list().subscribe();

    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args[0]).toEqual('projects');
  }));

  it('should create project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, event: EventService, notify: NotificationService) => {
    const httpPostSpy = spyOn(http, 'post').and.callFake(() => {
      return Observable.of(project);
    });
    const emitEventSpy = spyOn(event, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');

    service.create(project);

    expect(httpPostSpy.calls.count()).toBe(1);
    expect(httpPostSpy.calls.mostRecent().args[0]).toEqual('projects');
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.CREATE_PROJECT, project]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_PROJECT_LIST]);
    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual([`Project created: "${project.name}"`]);
  }));

  it('should return a single project by id', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callFake(() => {
      return Observable.of(project);
    });

    service.get(project.id).subscribe();

    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args[0]).toEqual('projects/' + project.id);
  }));

  it('should update project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, event: EventService, notify: NotificationService) => {
    const httpPutSpy = spyOn(http, 'put').and.callFake(() => {
      return Observable.of('');
    });
    const emitEventSpy = spyOn(event, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');

    service.update(project.id, {name: 'new name'});

    expect(httpPutSpy.calls.count()).toBe(1);
    expect(httpPutSpy.calls.mostRecent().args[0]).toEqual('projects/' + project.id);
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_PROJECT, { id: project.id }]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_PROJECT_LIST]);
    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual([`Project updated: "new name"`]);
  }));


  it('should delete project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, event: EventService, notify: NotificationService) => {
    const httpDeleteSpy = spyOn(http, 'delete').and.callFake(() => {
      return Observable.of('');
    });
    const emitEventSpy = spyOn(event, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');

    service.delete(project).subscribe();

    expect(httpDeleteSpy.calls.count()).toBe(1);
    expect(httpDeleteSpy.calls.mostRecent().args[0]).toEqual('projects/' + project.id);
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.DELETE_PROJECT, {id: project.id}]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_PROJECT_LIST]);
    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual([`Project deleted: "${project.name}"`]);
  }));

  it('should create folder in project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, event: EventService, notify: NotificationService) => {
    const httpPostSpy = spyOn(http, 'post').and.callFake(() => {
      return Observable.of(folder);
    });
    const emitEventSpy = spyOn(event, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');

    service.createFolder(project.id, folder);

    expect(httpPostSpy.calls.count()).toBe(1);
    expect(httpPostSpy.calls.mostRecent().args[0]).toEqual(`projects/${project.id}/folders`);
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_PROJECT, {id: project.id}]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_PROJECT_LIST]);
    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual([`Folder created: "${folder.path}"`]);
  }));

  it('should delete folder in project', inject([AppHttp, EventService, NotificationService], (http: AppHttp, event: EventService, notify: NotificationService) => {
    const httpDeleteSpy = spyOn(http, 'delete').and.callFake(() => {
      return Observable.of('');
    });
    const emitEventSpy = spyOn(event, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');

    service.deleteFolder(project.id, folder.id);

    expect(httpDeleteSpy.calls.count()).toBe(1);
    expect(httpDeleteSpy.calls.mostRecent().args[0]).toEqual(`projects/${project.id}/folders/${folder.id}`);
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_PROJECT, {id: project.id}]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_PROJECT_LIST]);
    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual([`Folder deleted`]);
  }));
});

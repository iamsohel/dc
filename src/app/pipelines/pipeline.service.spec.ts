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

import { IPipelineClone, Pipeline } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

describe('PipelineService', () => {
  const params: IListRequest = {
    page: 1,
    page_size: 5,
  };

  let service: PipelineService,
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
        PipelineService,
      ],
    });

    executeSpy = spyOn(AppHttp, 'execute').and.callFake((data) => Observable.of(data)).and.callThrough();
    service = TestBed.get(PipelineService);
  });

  afterEach(() => {
    executeSpy.calls.reset();
  });

  it('should clone pipeline', inject([AppHttp, EventService, NotificationService], (http: AppHttp, event: EventService, notify: NotificationService) => {
    const pipeline: Pipeline = {
      id: 'p1',
      name: 'old name',
      description: 'description',
      ownerId: 'ownerId1',
      created: '2017-03-24T13:57:29.522Z',
      updated: '2017-03-24T13:57:29.522Z',
      steps: [],
      assets: [],
    };
    const cloneParams: IPipelineClone = {
      name: 'new name',
    };
    const httpPostSpy = spyOn(http, 'post').and.callFake(() => {
      return Observable.of(Object.assign(pipeline, cloneParams));
    });
    const emitEventSpy = spyOn(event, 'emit').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');

    service.clone('p1', cloneParams);

    expect(httpPostSpy.calls.count()).toBe(1);
    expect(httpPostSpy.calls.mostRecent().args[0]).toEqual('pipelines/p1/copy');
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.CREATE_PIPELINE, pipeline]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.UPDATE_PIPELINE_LIST]);
    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual([`Pipeline cloned: new name`]);
  }));

  it('should use request parameters when calling listOperators', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callThrough();
    service.listOperators(params).subscribe();
    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args.slice(0, 2)).toEqual(['pipeline-operators', params]);
  }));

  it('should use default parameters when calling listOperators', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callThrough();
    const defaultParams = {
      page: 1,
      page_size: 1000,
    };
    service.listOperators().subscribe();
    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args.slice(0, 2)).toEqual(['pipeline-operators', defaultParams]);
  }));

});

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';

import { IListRequest } from '../core/interfaces/common.interface';
import { EventService } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { NotificationService } from '../core/services/notification.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { AppHttpMock } from '../mocks/http.mock';
import { NotificationServiceMock } from '../mocks/notification.service.mock';

import { PmeService } from './pme-management.service';

describe('PmeService', () => {
  const params: IListRequest = {
    page: 1,
    page_size: 5,
  };

  let service: PmeService,
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
        PmeService,
      ],
    });
    executeSpy = spyOn(AppHttp, 'execute').and.callFake((data) => Observable.of(data)).and.callThrough();
    service = TestBed.get(PmeService);
  });

  afterEach(() => {
    executeSpy.calls.reset();
  });

  it('should return a list of pmes', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callThrough();
    service.list(params).subscribe();
    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args).toEqual(['pmes', params]);
  }));

  it('should get a user', inject([AppHttp], (http: AppHttp) => {
    const httpGetSpy = spyOn(http, 'get').and.callThrough();
    service.get('id').subscribe();

    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args).toEqual(['pmes/id']);
  }));
});

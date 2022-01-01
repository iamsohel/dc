import { TestBed, inject } from '@angular/core/testing';

import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { IBackendList } from '../core/interfaces/common.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { NotificationService } from '../core/services/notification.service';
import { ProcessService } from '../core/services/process.service';
import { SharedResourceService } from '../core/services/shared-resource.service';
import { StorageService } from '../core/services/storage.service';
import { EventServiceMock } from '../mocks/event.service.mock';
import { AppHttpMock } from '../mocks/http.mock';
import { NotificationServiceMock } from '../mocks/notification.service.mock';
import { SharedResourceServiceMock } from '../mocks/shared-resource.service.mock';
import { StorageServiceMock } from '../mocks/storage.service.mock';

import { ITable, ITableUpdate } from './table.interface';
import { ITableImportFromS3, TableService } from './table.service';

describe('TableService', () => {
  const params = { page: 1, page_size: 5 };
  let service: TableService,
    executeSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppHttp,
          useClass: AppHttpMock,
        },
        {
          provide: StorageService,
          useClass: StorageServiceMock,
        },
        {
          provide: NotificationService,
          useClass: NotificationServiceMock,
        },
        {
          provide: SharedResourceService,
          useClass: SharedResourceServiceMock,
        },
        {
          provide: EventService,
          useClass: EventServiceMock,
        },
        ProcessService,
        TableService,
      ],
    });
    service = TestBed.get(TableService);
    executeSpy = spyOn(AppHttp, 'execute').and.callFake((data) => Observable.of(data)).and.callThrough();
  });

  afterEach(() => {
    executeSpy.calls.reset();
  });

  it('should return list of tables', inject([AppHttp], (http: AppHttp) => {
    const response: IBackendList<ITable> = {
      count: 1,
      data: [
        <ITable> {
          id: 'prostate_cancer',
          name: 'all_cohort_For_DEMO_2',
          ownerId: 'ownerId1',
          datasetId: 'prostate_cancer',
          columns: [{
            name: 'patientid',
            displayName: 'patientid',
            dataType: ITable.ColumnDataType.STRING,
            variableType: ITable.ColumnVariableType.CATEGORICAL,
            columnType: 'ATTRIBUTE',
            align: ITable.ColumnAlign.LEFT,
          }],
          status: ITable.Status.ACTIVE,
          created: '2017-03-24T13:57:29.522Z',
          updated: '2017-03-24T13:57:29.522Z',
          datasetType: ITable.DatasetType.DERIVED,
        },
      ],
    };
    const httpGetSpy = spyOn(http, 'get').and.callFake(() => {
      return Observable.of(response);
    });
    service.list(params).subscribe();
    expect(httpGetSpy.calls.count()).toBe(1);
    expect(httpGetSpy.calls.mostRecent().args[0]).toEqual('tables');
    expect(httpGetSpy.calls.mostRecent().args[1]).toEqual(params);
  }));

  it('should get table', inject([SharedResourceService], (sharedResourceService: SharedResourceService) => {
    const table: ITable = {
      id: 'prostate_cancer',
      parentId: 'prostate_cancer',
      version: 1,
      name: 'all_cohort_For_DEMO_2',
      ownerId: 'ownerId1',
      datasetId: 'prostate_cancer',
      columns: [{
        name: 'patientid',
        displayName: 'patientid',
        dataType: ITable.ColumnDataType.STRING,
        variableType: ITable.ColumnVariableType.CATEGORICAL,
        columnType: 'ATTRIBUTE',
        align: ITable.ColumnAlign.LEFT,
      }],
      status: ITable.Status.ACTIVE,
      created: '2017-03-24T13:57:29.522Z',
      updated: '2017-03-24T13:57:29.522Z',
      datasetType: ITable.DatasetType.DERIVED,
      current: true,
    };
    const accessSharedResourceSpy = spyOn(sharedResourceService, 'withSharedAccess').and.callFake(() => {
      return {
        get: () => Observable.of(table),
      };
    });
    service.get('tableId').subscribe();

    expect(accessSharedResourceSpy.calls.count()).toBe(1);
    expect(accessSharedResourceSpy.calls.mostRecent().args).toEqual(['TABLE', 'tableId']);
  }));

  it('should update table', inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify: NotificationService) => {
    const createNotificationSpy = spyOn(notify, 'create');
    const httpPutSpy = spyOn(http, 'put').and.callThrough();
    const data: ITableUpdate = {
      name: 'updated Table Name',
      columns: [],
    };
    service.update('tableId', data).subscribe();
    expect(httpPutSpy.calls.count()).toBe(1);
    expect(httpPutSpy.calls.mostRecent().args[0]).toEqual('tables/tableId');
    expect(httpPutSpy.calls.mostRecent().args[1]).toEqual(data);

    expect(executeSpy.calls.count()).toBe(1);
    expect(executeSpy.calls.mostRecent().args[0]).toEqual(Observable.of(data));

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['Table updated: ' + data.name]);
  }));

  it('should delete table', inject([AppHttp, EventService], (http: AppHttp, eventService: EventService) => {
    const httpDeleteSpy = spyOn(http, 'delete').and.callFake((...args) => Observable.of(...args));
    const emitEventSpy = spyOn(eventService, 'emit').and.callThrough();
    const table: ITable = {
      id: 'prostate_cancer',
      parentId: 'prostate_cancer',
      version: 1,
      name: 'all_cohort_For_DEMO_2',
      ownerId: 'ownerId1',
      datasetId: 'prostate_cancer',
      columns: [{
        name: 'patientid',
        displayName: 'patientid',
        dataType: ITable.ColumnDataType.STRING,
        variableType: ITable.ColumnVariableType.CATEGORICAL,
        columnType: 'ATTRIBUTE',
        align: ITable.ColumnAlign.LEFT,
      }],
      status: ITable.Status.ACTIVE,
      created: '2017-03-24T13:57:29.522Z',
      updated: '2017-03-24T13:57:29.522Z',
      datasetType: ITable.DatasetType.DERIVED,
      current: true,
    };
    service.delete(table).subscribe();
    expect(httpDeleteSpy.calls.count()).toBe(1);
    expect(httpDeleteSpy.calls.mostRecent().args).toEqual(['tables/' + table.id]);

    expect(emitEventSpy.calls.count()).toBe(2);
    expect(emitEventSpy.calls.first().args).toEqual([IEvent.Type.UPDATE_TABLE_LIST]);
    expect(emitEventSpy.calls.mostRecent().args).toEqual([IEvent.Type.DELETE_TABLE, {id: 'prostate_cancer'}]);
  }));

  it('should show table name and version in notification if the table has name', inject([NotificationService], (notify: NotificationService) => {
    const createNotificationSpy = spyOn(notify, 'create');
    const table: ITable = {
      id: 'prostate_cancer',
      parentId: 'prostate_cancer',
      version: 1,
      name: 'all_cohort_For_DEMO_2',
      ownerId: 'ownerId1',
      datasetId: 'prostate_cancer',
      columns: [],
      status: ITable.Status.ACTIVE,
      created: '2017-03-24T13:57:29.522Z',
      updated: '2017-03-24T13:57:29.522Z',
      datasetType: ITable.DatasetType.DERIVED,
      current: true,
    };
    service.delete(table).subscribe();

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['Table deleted: ' + table.name + ' (Version ' + table.version + ')']);
  }));

  it('should show table version in notification if the table has no name', inject([NotificationService], (notify: NotificationService) => {
    const createNotificationSpy = spyOn(notify, 'create');
    const table: ITable = {
      id: 'prostate_cancer',
      parentId: 'prostate_cancer',
      version: 1,
      name: '',
      ownerId: 'ownerId1',
      datasetId: 'prostate_cancer',
      columns: [],
      status: ITable.Status.ACTIVE,
      created: '2017-03-24T13:57:29.522Z',
      updated: '2017-03-24T13:57:29.522Z',
      datasetType: ITable.DatasetType.DERIVED,
      current: true,
    };
    service.delete(table).subscribe();

    expect(createNotificationSpy.calls.count()).toBe(1);
    expect(createNotificationSpy.calls.mostRecent().args).toEqual(['Table deleted: Version ' + table.version]);
  }));

  it('should import table from S3 using csv file', inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify: NotificationService) => {
    const httpPostSpy = spyOn(http, 'post').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const emitEventSpy = spyOn(eventService, 'emit').and.callThrough();

    const methodParams: ITableImportFromS3 = {
      AWSS3BucketId: 'AWSS3BucketId',
      AWSRegion: 'AWSRegion',
      AWSS3BucketName: 'AWSS3BucketName',
      AWSAccessKey: 'AWSAccessKey',
      AWSSecretKey: 'AWSSecretKey',
      AWSSessionToken: 'AWSSessionToken',
      filePath: 'S3FilePath',
      name: 'test',
      nullValue: 'NULL',
      format: 'csv',
      delimiter: '|',
      description: 'testing',
    };
    const postData = {...methodParams};
    delete postData['format'];

    service.importFromS3(methodParams).subscribe();

    expect(httpPostSpy.calls.count()).toBe(1);
    expect(httpPostSpy.calls.mostRecent().args).toEqual(['tables/importFromS3/csv', postData]);
    expect(executeSpy.calls.count()).toBe(3);
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(createNotificationSpy.calls.count()).toBe(1);
  }));

  it('should import table from S3 using JSON file', inject([AppHttp, EventService, NotificationService], (http: AppHttp, eventService: EventService, notify: NotificationService) => {
    const httpPostSpy = spyOn(http, 'post').and.callThrough();
    const createNotificationSpy = spyOn(notify, 'create');
    const emitEventSpy = spyOn(eventService, 'emit').and.callThrough();

    const methodParams: ITableImportFromS3 = {
      AWSS3BucketId: 'AWSS3BucketId',
      AWSRegion: 'AWSRegion',
      AWSS3BucketName: 'AWSS3BucketName',
      AWSAccessKey: 'AWSAccessKey',
      AWSSecretKey: 'AWSSecretKey',
      AWSSessionToken: 'AWSSessionToken',
      filePath: 'S3FilePath',
      name: 'test',
      nullValue: null,
      format: 'json',
      delimiter: '|',
      description: 'testing',
    };

    const postData = {
      AWSS3BucketId: 'AWSS3BucketId',
      AWSRegion: 'AWSRegion',
      AWSS3BucketName: 'AWSS3BucketName',
      AWSAccessKey: 'AWSAccessKey',
      AWSSecretKey: 'AWSSecretKey',
      AWSSessionToken: 'AWSSessionToken',
      filePath: 'S3FilePath',
      name: 'test',
      description: 'testing',
    };

    service.importFromS3(methodParams).subscribe();

    expect(httpPostSpy.calls.count()).toBe(1);
    expect(httpPostSpy.calls.mostRecent().args).toEqual(['tables/importFromS3/json', postData]);
    expect(executeSpy.calls.count()).toBe(3);
    expect(emitEventSpy.calls.count()).toBe(2);
    expect(createNotificationSpy.calls.count()).toBe(1);
  }));

  it('should return a string that starts with \'column\' followed by the number passed as an argument if \'generateColumnField\' function is called', () => {
    let columnCount = 12;

    let result = service.generateColumnField(columnCount);

    expect(result).toEqual('column' + columnCount.toString());
  });

  it('should return a string containing letter according to the index (index starts from 1) if \'generateColumnLetter\' function is called', () => {
    const START_INDEX = 1;
    let letterIndex = 4;
    let expectedString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[letterIndex - START_INDEX];

    let actualString = service.generateColumnLetter(letterIndex);

    expect(actualString).toEqual(expectedString);
  });

  it('should return multiple letters if the index (index start from 1) is greater than 26 when \'generateColumnLetter\' function is called', () => {
    const START_INDEX = 1;
    const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const COUNT_OF_ALPHABETS = ALPHABETS.length;

    let letterIndex = 27;
    let firstIndex = Math.floor(letterIndex / COUNT_OF_ALPHABETS);
    let lastIndex = letterIndex % COUNT_OF_ALPHABETS;
    let expectedString = ALPHABETS[firstIndex - START_INDEX] + ALPHABETS[lastIndex - START_INDEX];

    let actualString = service.generateColumnLetter(letterIndex);

    expect(actualString).toEqual(expectedString);
  });

  it('should return the values returned by \'generateColumnField\' and \'generateColumnLetter\' functions as an object when the \'generateColumn\' is called', () => {
    const INDEX = 10,
      COLUMN_COUNT = 2,
      COLUMN_FIELD = 'col-field',
      COLUMN_LETTER = 'aBc';

    spyOn(service, 'generateColumnField').and.returnValue(COLUMN_FIELD);
    spyOn(service, 'generateColumnLetter').and.returnValue(COLUMN_LETTER);

    let result = service.generateColumn(INDEX, COLUMN_COUNT);

    expect(result).toEqual({ headerName: COLUMN_LETTER, field: COLUMN_FIELD });
  });
});

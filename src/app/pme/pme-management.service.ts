import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';

import config from '../config';
import { IBackendList, IObjectId, TObjectId } from '../core/interfaces/common.interface';
import { EventService, IEvent } from '../core/services/event.service';
import { AppHttp } from '../core/services/http.service';
import { NotificationService } from '../core/services/notification.service';

import {
  ICSVQuotRecord,
  IPmeSearchParams,
  IPmeUpdateRequest,
  IPriceRecord,
  IQuotation,
  IQuotationRecord,
} from './pme.interfaces';

@Injectable()
export class PmeService {
  private readonly _baseUrl = 'price-records/';
  private readonly _approveUrl = 'staging-price-records/';
  private readonly _quotationUrl = 'quotes/search/';

  constructor(protected http: AppHttp, protected events: EventService, private notifications: NotificationService) {}

  list(params: IPmeSearchParams): Observable<IBackendList<IPriceRecord>> {
    return this.http.getpme(this._baseUrl, params);
  }

  listAllPriceRecords(body: any , params: IPmeSearchParams): Observable<IBackendList<IPriceRecord>> {
    return this.http.postpme(this._baseUrl, body, params);
  }

  approveList(params: IPmeSearchParams): Observable<IBackendList<IPriceRecord>> {
    return this.http.getpme(this._approveUrl, params);
  }
  // approveList(body: any , params: IPmeSearchParams): Observable<IBackendList<IPriceRecord>> {
  //   return this.http.postpme(this._approveUrl, body, params);
  // } //displayColumnwise open

  pmecsvdownload(searchValue: any): Observable<any> {
    const observable = this.http.postpmedownload(this._baseUrl + 'download/', searchValue).do((data: any) => {});
    return observable;
  }

  pmeapprovercsvdownload(searchValue: any): Observable<any> {
    const observable = this.http.postpmedownload('staging/download/', searchValue).do((data: any) => {});

    return observable;
  }

  pmecsvupload(uploadData: any): Observable<any> {
    const observable = this.http.uploadPme(this._baseUrl + 'upload/', uploadData).do((data: any) => {
    });

    return observable;
  }

  pmestagingcsvupload(uploadData: any): Observable<any> {
    const observable = this.http.uploadPme('staging/upload/', uploadData).do((data: any) => {
    });

    return observable;
  }

  approveBatch(): Observable<any> {
    const observable = this.http.postpme('approve-batch-price-records/').do((data: any) => {
      this.events.emit(IEvent.Type.UPDATE_PME);
      this.events.emit(IEvent.Type.UPDATE_PME, data);
      this.notifications.create('Accepted Records pushed to PME');
    });

    return observable;
  }

  rejecteBatch(): Observable<any> {
    const observable = this.http.postpme('reject-batch-price-records/').do((data: any) => {
      this.events.emit(IEvent.Type.UPDATE_PME);
      this.events.emit(IEvent.Type.UPDATE_PME, data);
      this.notifications.create('Rejection has been done');
    });

    return observable;
  }

  quotationList(params: IPmeSearchParams): Observable<IBackendList<IQuotationRecord>> {
    return this.http.getpme(this._quotationUrl, params);
  }

  create(item: IPriceRecord): Observable<IPriceRecord> {
    const observable = this.http.post(this._baseUrl, item).do((data: IPriceRecord) => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.CREATE_USER, data);
      this.notifications.create('User has been created: ' + this.getPmeInformation(data));
    });

    return observable;
  }

  batchQuotation(quotes: ICSVQuotRecord[]): Observable<any> {
    const observable = this.http.postpme('quotes', quotes);
    return AppHttp.execute(observable, (file: any) => {
      this.events.emit(IEvent.Type.UPDATE_PME);
      this.events.emit(IEvent.Type.BATCH_QUOTATION);
      this.notifications.create('Batch quotation uploaded');
    });
  }

  distributedQuotation(quotation: IQuotation): Observable<IQuotation> {
    const observable = this.http.postpme('quotes/distributed', quotation).do((data: any) => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.CREATE_USER, data);
      this.notifications.create('File creation in progress.');
    });

    return observable;
  }

  createQuotation(quotation: IQuotation[]): Observable<IQuotation> {
    const observable = this.http.postpme('quotes', quotation).do((data: any) => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.CREATE_USER, data);
      // this.notifications.create('Record has been created: ' + this.getQuotationInformation(data));
      if (data.code === 199) {
        this.notifications.create(data.notifications.notificationDescription, config.notification.level.values.DANGER);
      } else {
        this.notifications.create('Record has been created');
      }
    });

    return observable;
  }

  downloadQuotation(caseId: string): any {
    return this.http.getpmedownload('quote/distributed/download', {quote_case_id: caseId});
  }

  get(id: TObjectId): Observable<IPriceRecord> {
    return this.http.getpme(this._baseUrl  + id);
  }

  update(id: TObjectId, data: IPmeUpdateRequest): Observable<IPriceRecord> {
    const observable = this.http.putpme(this._baseUrl + id + '/', data);

    return AppHttp.execute(observable, (data: IPriceRecord) => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.UPDATE_USER, { id });
      this.notifications.create('Pme data has been updated: ' + id);
    });
  }

  delete(item: IPriceRecord, transferTo: IPriceRecord = null): Observable<IObjectId> {
    const params = transferTo ? { transferOwnershipTo: transferTo.item_id } : null;
    const observable = this.http.delete(this._baseUrl + item.item_id, params);

    return AppHttp.execute(observable, () => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.DELETE_USER, { id: item.item_id });
      this.notifications.create(
        'User has been deleted: ' +
          this.getPmeInformation(item) +
          (transferTo ? '. Ownership was transferred to ' + this.getPmeInformation(transferTo) : ''),
      );
    });
  }

  clone(itemId: string): Observable<IObjectId> {
    const observable = this.http.postpme(this._baseUrl + 'clone/?item_id=' + itemId);

    return AppHttp.execute(observable, () => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.CLONE_RECORD, { id: itemId });
      this.notifications.create('Pme data has been cloned from id: ' + itemId);
    });
  }

  commit(items: IPriceRecord[]): Observable<IObjectId> {
    let payload = {
      price_record_ids: [],
    };

    items.map((item) => {
      payload.price_record_ids.push(item.item_id);
    });

    const observable = this.http.postpme(this._baseUrl + 'commit/', payload);

    return AppHttp.execute(observable, () => {
      this.events.emit(IEvent.Type.UPDATE_PME);
      // this.events.emit(IEvent.Type.COMMIT_PME, { id: item.item_id });
      this.notifications.create('Record has been committed');
    });
  }

  getPmeInformation(item: IPriceRecord): string {
    return item.item_id;
  }

  getQuotationInformation(item: IQuotation): string {
    return item.id;
  }

  listAll(): Observable<IPriceRecord[]> {
    const fetcher = (page: number): Observable<IBackendList<IPriceRecord>> => {
      return this.list({ page: page, page_size: config.listAllChunkSize, order: 'status' });
    };
    return fetcher(1).flatMap((firstResponse: IBackendList<IPriceRecord>) => {
      if (firstResponse.count <= firstResponse.results.length) {
        return of(firstResponse.results);
      } else {
        const pageToFetch = Array(Math.ceil(firstResponse.count / config.listAllChunkSize - 1))
          .fill(0)
          .map((_, i) => i + 2);
        const observables = pageToFetch.map(fetcher);
        return forkJoin(observables).map((responses: IBackendList<IPriceRecord>[]) => {
          return [...firstResponse.results].concat(...responses.map((_) => _.results));
        });
      }
    });
  }

  activateUser(item: IPriceRecord): Observable<IPriceRecord> {
    if (item.gi_status === IPriceRecord.Status.INSERT_REQUESTED_SELLING_PRICE) {
      this.notifications.create('User is already active', config.notification.level.values.DANGER);
      return Observable.of(item);
    }

    const observable = this.http.post(this._baseUrl + item.item_id + '/activate', null);

    return AppHttp.execute(observable, () => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.ACTIVATE_USER, { id: item.item_id });
      this.notifications.create('User has been activated: ' + this.getPmeInformation(item));
    });
  }

  deactivateUser(item: IPriceRecord): Observable<IPriceRecord> {
    if (item.gi_status === IPriceRecord.Status.INSERT_REQUESTED_SELLING_PRICE) {
      this.notifications.create('User is already deactivated', config.notification.level.values.DANGER);
      return Observable.of(item);
    }

    const observable = this.http.post(this._baseUrl + item.item_id + '/deactivate', null);

    return AppHttp.execute(observable, () => {
      this.events.emit(IEvent.Type.UPDATE_USER_LIST);
      this.events.emit(IEvent.Type.DEACTIVATE_USER, { id: item.item_id });
      this.notifications.create('User has been deactivated: ' + this.getPmeInformation(item));
    });
  }

  makeEmptyPropertiesNull = (obj: any) => {
    Object.keys(obj).forEach((key, index) => {
      if (obj[key] === '') {
        obj[key] = null;
      }
    });
  };

  removeEmptyProperties = (obj: any) => {
    Object.keys(obj).forEach((key, index) => {
      if (obj[key] === null || obj[key] === '') {
        delete obj[key];
      }
    });
  };
}

declare module '../core/services/event.service' {
  export namespace IEvent {
    export const enum Type {
      UPDATE_PME = 'UPDATE_PME',
      COMMIT_PME = 'COMMIT_PME',
      BATCH_QUOTATION = 'BATCH_QUOTATION',
    }
  }
}

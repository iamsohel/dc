import { Injectable } from '@angular/core';

import 'rxjs/add/observable/empty';
import { Observable } from 'rxjs/Observable';

import { ICd, IGmm, IPmeSearchParams, ISalesManager, ISalesRepresentative } from '../../pme/pme.interfaces';
import { IBackendList } from '../interfaces/common.interface';

import { EventService } from './event.service';
import { AppHttp } from './http.service';

// fetch and update processes (realtime)
// TODO: experimental service
// TODO: specify typings

// TODO: refactoring - it seems that we don't need to use subscribe() method
// get() and getByTarget() should automatically push item into _subscriptions
// also there is something strange with count property (it seems redundant to ++ and -- it)

@Injectable()
export class SalesPersonService {
  constructor(protected http: AppHttp,
    protected events: EventService) {

  }

  getSalesManagerlist(params?: IPmeSearchParams): Observable<IBackendList<ISalesManager>> {
    return this.http.get('salesmanagers', params);
  }

  getSalesRepresentativelist(params?: IPmeSearchParams): Observable<IBackendList<ISalesRepresentative>> {
    return this.http.get('salesrepresentatives', params);
  }

  getCDlist(params?: IPmeSearchParams): Observable<IBackendList<ICd>> {
    return this.http.get('cds', params);
  }

  getGMMlist(params?: IPmeSearchParams): Observable<IBackendList<IGmm>> {
    return this.http.get('gmms', params);
  }

}


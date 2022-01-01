import { Injectable } from '@angular/core';

import 'rxjs/add/observable/empty';
import { Observable } from 'rxjs/Observable';

import { IPmeSearchParams, IRegion } from '../../pme/pme.interfaces';
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
export class RegionService {

  constructor(protected http: AppHttp,
    protected events: EventService) {

  }

  list(params?: IPmeSearchParams): Observable<IBackendList<IRegion>> {
    return this.http.get('regions', params);
  }


}


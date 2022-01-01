import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/delay';
import { Observable } from 'rxjs/Observable';

import { TObjectId } from '../core/interfaces/common.interface';
import { IDCProjectSession } from '../develop/dc-project.interfaces';
import { DCProjectService } from '../develop/dc-project.service';

export class DcProjectServiceFixture extends DCProjectService {
  getSessionStatusStream(dcProjectId: TObjectId): Observable<IDCProjectSession.Status> {
    return Observable.from([
      IDCProjectSession.Status.QUEUED,
      IDCProjectSession.Status.SUBMITTED,
      IDCProjectSession.Status.RUNNING,
      IDCProjectSession.Status.COMPLETED,
    ])
      .concatMap(status => Observable.of(status).delay(2000))
      .do(status => {
        console.log(status);
      });
  }
}

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';

import config from '../config';
import { AppSelectOptionData } from '../core-ui/components/app-select.component';

import { IBackendList, TObjectId } from './interfaces/common.interface';
import { IProject, IProjectFolder } from './interfaces/project.interface';

export class WithProjectSelectionHelpers {
  readonly prepareProjectOptions = function(projects: IProject[]): AppSelectOptionData<TObjectId>[] {
    return projects ? projects.map(project => ({
      id: project.id,
      text: project.name,
    })) : [];
  };

  readonly prepareFolderOptions = function(projects: IProject[], selectedProject: TObjectId): AppSelectOptionData<TObjectId>[] {
    const folders: IProjectFolder[] = (projects || [])
      .filter(project => project.id === selectedProject).map(project => project.folders)[0] || [];

    return _.sortBy(folders.map(folder => ({
      id: folder.id,
      text: folder.path,
    })), 'text');
  };
}

export function listAll<T, P extends {page?: number, page_size?: number}>(
  listFn: (params: P) => Observable<IBackendList<T>>,
  params: P,
): Observable<T[]> {
  const fetcher = (page: number): Observable<IBackendList<T>> => {
    return listFn({...((params || {}) as object), page: page, page_size: config.listAllChunkSize} as P);
  };
  return fetcher(1).flatMap((firstResponse: IBackendList<T>) => {
    if (firstResponse.count <= firstResponse.data.length) {
      return of(firstResponse.data);
    } else {
      const pagesToFetch = Array(
        Math.ceil(firstResponse.count / config.listAllChunkSize - 1),
      ).fill(0).map((_, i) => i + 2);
      const observables = pagesToFetch.map(fetcher);
      return forkJoin(observables).map((responses: IBackendList<T>[]) => {
        return [...firstResponse.data].concat(...responses.map(_ => _.data));
      });
    }
  });
}

export function createComparerOfObjectsWithVersions<T>(versionFieldName: keyof T): (a: T, B: T) => number {
  return (o1: T, o2: T) => {
    const v1 = (<string> (o1[versionFieldName] || '')).split('.').map(_ => parseInt(_));
    const v2 = (<string> (o2[versionFieldName] || '')).split('.').map(_ => parseInt(_));
    return _.zip(v1, v2).filter(([n1, n2]) => n1 !== n2).map(([n1, n2]) => n2 - n1)[0] || 0;
  };
}

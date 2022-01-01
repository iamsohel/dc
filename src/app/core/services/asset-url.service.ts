import { Inject, Injectable } from '@angular/core';

import config from '../../config';
import { LIBRARY_SECTIONS, LibrarySectionDefinition } from '../../library/library.interface';
import { ASSET_BASE_ROUTE, IAsset } from '../interfaces/common.interface';

export type AssetURLMap = {[k: string]: string[]};

@Injectable()
export class AssetURLService {
  private readonly _baseUrlMap: AssetURLMap = {};

  constructor(
    @Inject(ASSET_BASE_ROUTE) assetURLMaps: AssetURLMap[],
    @Inject(LIBRARY_SECTIONS) sections: LibrarySectionDefinition<IAsset>[],
  ) {
    this._baseUrlMap = {
      ...sections.filter(_ => !!_.baseRoute).reduce((acc, section) => {
        return {[section.assetType]: section.baseRoute, ...acc};
      }, {}),
      ...assetURLMaps.reduce((acc, map) => {
        return Object.assign(acc, map);
      }, {}),
    };
  }

  assetURL(assetType: IAsset.Type, assetId: string): string[] {
    if (assetType in this._baseUrlMap) {
      return this._baseUrlMap[assetType].concat([assetId]);
    }
    return ['/desk', 'library', config.asset.aliasesPlural[assetType], assetId];
  }
}

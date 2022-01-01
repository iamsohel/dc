import { IFixtureServiceRoute } from '../fixture.interface';

export const regionsRoutes: IFixtureServiceRoute[] = [
  {
    url: 'regions$',
    method: 'GET',
    handler: function(this, params) {
      const regions = this.collections.regions;
      const resultset = regions.chain();

      return this.prepareListResponse(resultset, params);
    },
  },
];

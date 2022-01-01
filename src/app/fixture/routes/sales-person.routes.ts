import { IFixtureServiceRoute } from '../fixture.interface';

export const salesPersonRoutes: IFixtureServiceRoute[] = [
  {
    url: 'salesmanagers$',
    method: 'GET',
    handler: function (this, params) {
      const regions = this.collections.salesManagers;
      const resultset = regions.chain();

      return this.prepareListResponse(resultset, params);
    },
  },
  {
    url: 'salesrepresentatives$',
    method: 'GET',
    handler: function (this, params) {
      const regions = this.collections.salesRepresentatives;
      const resultset = regions.chain();

      return this.prepareListResponse(resultset, params);
    },
  },
  {
    url: 'cds$',
    method: 'GET',
    handler: function (this, params) {
      const regions = this.collections.cds;
      const resultset = regions.chain();

      return this.prepareListResponse(resultset, params);
    },
  },
  {
    url: 'gmms$',
    method: 'GET',
    handler: function (this, params) {
      const regions = this.collections.gmms;
      const resultset = regions.chain();

      return this.prepareListResponse(resultset, params);
    },
  },

];

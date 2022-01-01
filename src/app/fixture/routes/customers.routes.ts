import { IFixtureServiceRoute } from '../fixture.interface';

export const customerRoutes: IFixtureServiceRoute[] = [
  {
    url: 'customers$',
    method: 'GET',
    handler: function(this, params) {
      const processes = this.collections.customers;
      const resultset = processes.chain();

      return this.prepareListResponse(resultset, params);
    },
  },
];

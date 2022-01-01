import { IFixtureServiceRoute } from '../fixture.interface';

export const productRoutes: IFixtureServiceRoute[] = [
  {
    url: 'products$',
    method: 'GET',
    handler: function(this, params) {
      const processes = this.collections.products;
      const resultset = processes.chain();

      return this.prepareListResponse(resultset, params);
    },
  },
];

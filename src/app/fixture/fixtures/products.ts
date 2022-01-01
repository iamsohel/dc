import { IProduct } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const products: IFixtureData<IProduct> = {
  data: [
    {
      id: 'prod_001',
      code: 'prod_code_001',
      name: 'product 1',
    },
    {
      id: 'prod_002',
      code: 'prod_code_002',
      name: 'product 2',
    },
    {
      id: 'prod_003',
      code: 'prod_code_003',
      name: 'product 3',
    },
    {
      id: 'prod_004',
      code: 'prod_code_004',
      name: 'product 4',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },

};

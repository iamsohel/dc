import { ICustomer } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const customers: IFixtureData<ICustomer> = {
  data: [
    {
      id: 'custo_001',
      name: 'customer1',
      address: 'address 1',
    },
    {
      id: 'custo_002',
      name: 'customer2',
      address: 'address 2',
    },
    {
      id: 'custo_003',
      name: 'customer3',
      address: 'address 3',
    },
    {
      id: 'custo_004',
      name: 'customer4',
      address: 'address 4',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },

};

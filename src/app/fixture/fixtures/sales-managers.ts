import { ISalesManager } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const salesManagers: IFixtureData<ISalesManager> = {
  data: [
    {
      id: 'sm_0011',
      name: 'Sales Manager 1',
      address: 'nai',
    },
    {
      id: 'sm_0012',
      name: 'Sales Manager 2',
      address: 'nai',
    },
    {
      id: 'sm_0013',
      name: 'Sales Manager 3',
      address: 'nai',
    },
    {
      id: 'sm_0014',
      name: 'Sales Manager 4',
      address: 'nai',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },

};

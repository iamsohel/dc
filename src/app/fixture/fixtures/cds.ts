import { ISalesManager } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const cds: IFixtureData<ISalesManager> = {
  data: [
    {
      id: 'cd_001',
      name: 'CD 1',
      address: 'nai',
    },
    {
      id: 'cd_002',
      name: 'CD 2',
      address: 'nai',
    },
    {
      id: 'cd_003',
      name: 'CD 3',
      address: 'nai',
    },
    {
      id: 'cd_004',
      name: 'CD 4',
      address: 'nai',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },

};

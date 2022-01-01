import { ISalesManager } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const gmms: IFixtureData<ISalesManager> = {
  data: [
    {
      id: 'gmm_001',
      name: 'GMM 1',
      address: 'nai',
    },
    {
      id: 'gmm_002',
      name: 'GMM 2',
      address: 'nai',
    },
    {
      id: 'gmm_003',
      name: 'GMM 3',
      address: 'nai',
    },
    {
      id: 'gmm_004',
      name: 'GMM 4',
      address: 'nai',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },

};

import { ISalesRepresentative } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const salesRepresentatives: IFixtureData<ISalesRepresentative> = {
  data: [
    {
      id: 'sr_0011',
      name: 'Sales rep 1',
      address: 'nai',
    },
    {
      id: 'sr_0012',
      name: 'Sales rep 2',
      address: 'nai',
    },
    {
      id: 'sr_0013',
      name: 'Sales rep 3',
      address: 'nai',
    },
    {
      id: 'sr_0014',
      name: 'Sales rep 4',
      address: 'nai',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },
};

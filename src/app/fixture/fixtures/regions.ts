import { IRegion } from '../../pme/pme.interfaces';
import { IFixtureData } from '../fixture.interface';

export const regions: IFixtureData<IRegion> = {
  data: [
    {
      id: 'reg_001',
      name: 'region1',
    },
    {
      id: 'reg_002',
      name: 'region2',
    },
    {
      id: 'reg_003',
      name: 'region3',
    },
    {
      id: 'reg_004',
      name: 'region4',
    },
  ],
  options: {
    indices: ['id', 'name'],
  },

};

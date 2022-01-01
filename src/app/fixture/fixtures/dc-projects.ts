import { IDCProject } from '../../develop/dc-project.interfaces';
import { IFixtureData } from '../fixture.interface';

export const dcProjects: IFixtureData<IDCProject> = {
  data: [
    {
      id: 'dcProject1',
      ownerId: 'ownerId1',
      name: 'DC ML',
      created: '2019-09-01 12:00',
      updated: '2019-09-01 12:00',
      status: IDCProject.Status.IDLE,
      description: 'DC Machine Learning',
      packageName: 'package1',
      packageVersion: '1.1.0',
    },
  ],
  options: {
    indices: ['id', 'ownerId'],
  },
};

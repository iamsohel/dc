import { IDCProjectSession } from '../../../develop/dc-project.interfaces';
import { IFixtureData } from '../../fixture.interface';

export const dcProjectSessions: IFixtureData<IDCProjectSession> = {
  data: [
  ],
  options: {
    indices: ['id', 'ownerId'],
  },
};

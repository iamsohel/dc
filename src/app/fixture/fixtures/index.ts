import { IOnlineAPI } from '../../deploy/online-api.interface';
import { IFixtureData } from '../fixture.interface';

export { tables } from './tables';
export { pictures } from './pictures';
export { users } from './users';
export { pricerecords } from './price-records';
export { customers } from './customers';
export { products } from './products';
export { regions } from './regions';
export { salesManagers } from './sales-managers';
export { salesRepresentatives } from './sales-representatives';
export { cds } from './cds';
export { gmms } from './gmms';
export { albums } from './albums';
export { flows } from './flows';
export { shares } from './shares';
export { replays } from './replays';
export { projectsAssets } from './project-assets';
export { projects } from './projects';
export { models } from './models';
export { cvModels } from './cv-models';
export { cvPredictions } from './cv-predictions';
export { processes } from './processes';
export { datasets } from './datasets';
export { binaryDatasets } from './binary-datasets';
export { tableStatistics } from './table-statistics';
export { modelPredictors } from './model-predictors';
export { optimizations } from './optimizations';
export { dashboards } from './dashboards';
export { diaas } from './diaas';
export { modelProgresses } from './model-progresses';
export { jobs } from './jobs';
export { cvArchitectures } from './config/cv/architectures';
export { cvClassifiers } from './config/cv/classifiers';
export { cvDetectors } from './config/cv/detectors';
export { cvDecoders } from './config/cv/decoders';
export { dcProjects } from './dc-projects';
export { packages } from './packages';
export { dcProjectSessions } from './dc-projects/sessions';
export { pipelines } from './pipelines';
export { pipelineOperators } from './pipeline-operators';
export { operatorCategories } from './config/operator-categories';
export { experiments } from './experiments';
export { scriptDeployments } from './script-deployments';

export const apis: IFixtureData<IOnlineAPI> = {
  data: [],
  options: {
    indices: ['id', 'ownerId', 'name'],
  },
};

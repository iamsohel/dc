import * as _ from 'lodash';
import * as Loki from 'lokijs';
import 'rxjs/add/operator/map';

import { IAlbum, IAlbumAugmentParams } from '../../albums/album.interface';
import { IAsset, IAssetReference } from '../../core/interfaces/common.interface';
import { IProcess } from '../../core/interfaces/process.interface';
import {
  ExecutionTarget,
  ExperimentType,
  IAbstractExperimentResult,
  IExperiment,
  IExperimentCreate,
  IExperimentFull,
} from '../../experiments/experiment.interfaces';
import { IGenericExperiment, Pipeline } from '../../pipelines/pipeline.interfaces';
import { CVModelType, IAugmentationSummary, ICVModel } from '../../train/cv-model.interface';
import { ICVTLTrainPipeline, ICVTLTrainStepResult } from '../../train/cvtl-train.interfaces';
import { MiscUtils } from '../../utils/misc';
import { IFixturePicture, IFixtureServiceRoute } from '../fixture.interface';
import { FixtureServiceCollectionsMap } from '../fixture.service';

const albumSize = function(pictures: Loki.Collection<IFixturePicture>, albumId: string): number {
  return pictures.chain().find({albumId: albumId}).count();
};

const runGenericExperiment = function(genericPipeline: IGenericExperiment.Pipeline, collections: FixtureServiceCollectionsMap, user, experimentId): [IGenericExperiment.StepResult[], IAssetReference[]] {
  const executedSteps: {[parameter: string]: any[]} = {};
  const stepResults: IGenericExperiment.StepResult[] = [];
  const selectedAssets: IAssetReference[] = [];
  do {
    let stuck = true;
    genericPipeline.steps.forEach(step => {
      if (!(step.id in executedSteps)) {
        const requiredSteps: string[] = Object.keys(Object.values(step.inputs).reduce(
            (acc, v) => {
              ((Array.isArray(v) ? v : [v]) as Pipeline.OutputReference[]).forEach(vv => acc[vv.stepId] = true);
              return acc;
            },
            {},
          ),
        );
        const eligibleForRun = requiredSteps.every(s => s in executedSteps);
        if (eligibleForRun) {
          const operator = collections.pipelineOperators.find({id: step.operator})[0];
          console.log(`Executing step ${step.id} (${operator.name})`);
          const outputs = [];
          const stepResult: IGenericExperiment.StepResult = {
            stepId: step.id,
            assets: [],
            summaries: [],
            outputValues: {},
            executionTime: 0,
          };
          const inputs = Object.entries(step.inputs).reduce((acc, [inputName, sources]) => {
            ((Array.isArray(sources) ? sources : [sources]) as Pipeline.OutputReference[]).forEach(source => {
              acc[inputName] = executedSteps[source.stepId].length > source.outputIndex ? executedSteps[source.stepId][source.outputIndex] : null;
            });
            return acc;
          }, {});
          try {
            switch (operator.id) {
              case 'select_model':
                if (!('model' in step.params)) {
                  throw new Error(`model parameter not specified`);
                }
                const models = collections.cvModels.find({id: <string> step.params['model']});
                if (models.length < 1) {
                  throw new Error(`Model not found`);
                }
                selectedAssets.push({type: IAsset.Type.CV_MODEL, id: models[0].id});
                outputs.push({...models[0]});
                break;
              case 'select_album':
                if (!('album_id' in step.params)) {
                  throw new Error(`album_id parameter not specified`);
                }
                const albums = collections.albums.find({id: <string> step.params['album_id']});
                if (albums.length < 1) {
                  throw new Error(`Album not found`);
                }
                selectedAssets.push({type: IAsset.Type.ALBUM, id: albums[0].id});
                outputs.push({...albums[0], type: IAlbum.Type.SOURCE});
                stepResult.executionTime = 1;
                break;
              case 'split_album':
                if (!('album' in inputs)) {
                  throw new Error(`album not specified`);
                }
                outputs.push({...inputs['album']});
                outputs.push({...inputs['album']});
                break;
              case 'transform_album':
                if (!('album' in inputs)) {
                  throw new Error(`album not specified`);
                }
                outputs.push(inputs['album']);
                break;
              case 'create_dataloader':
                if (!('album' in inputs)) {
                  throw new Error(`album not provided`);
                }
                const haveFixture = 'fixtureSummary' in inputs['album'];
                stepResult['summaries'] = [
                  {
                    type: IGenericExperiment.SummaryType.SIMPLE,
                    values: {
                      batch_size: 4,
                      classes: haveFixture ? inputs['album']['fixtureSummary']['labels'].join(', ') : '',
                      image_sizes: '374x500, 419x500, 375x500, 500x360, 333x500, 500x496',
                      number_of_batches: 3,
                      number_of_items: albumSize(collections.pictures, inputs['album'].id),
                    },
                  },
                ];
                outputs.push(inputs['album']);
                stepResult.executionTime = 3;
                break;
              case 'learn_detection_model':
              case 'learn_non_neural_classification_model':
              case 'learn_neural_classification_model':
                if (!inputs['model']) {
                  throw new Error(`model not provided`);
                }
                if (!('train_dataloader' in inputs)) {
                  throw new Error(`train_dataloader not provided`);
                }
                if (!('validate_dataloader' in inputs)) {
                  throw new Error(`validate_dataloader not provided`);
                }
                const model: ICVModel = inputs['model'];
                if ('fixtureSummary' in inputs['train_dataloader']) {
                  model.classes = inputs['train_dataloader']['fixtureSummary']['labels'];
                }
                outputs.push(model);
                stepResult.executionTime = 30/*Math.round(
                  Math.random() * 2 * albumSize(collections.pictures, inputs['train_dataloader'].id),
                )*/;
                break;
              case 'create_kpcn_mnl_classifier':
              case 'create_freescale_classifier':
              case 'create_fcn_classifier':
                const classificationModel: ICVModel = {
                  id: 'm_' + Date.now().toString(),
                  experimentId: experimentId,
                  ownerId: user.id,
                  name: 'm_' + Date.now().toString(),
                  updated: new Date().toString(),
                  created: new Date().toString(),
                  inLibrary: false,
                  status: ICVModel.Status.ACTIVE,
                  modelType: {
                    type: CVModelType.Type.CUSTOM,
                    labelMode: IAlbum.LabelMode.CLASSIFICATION,
                    classReference: {
                      packageId: 'dc-operators',
                      moduleName: 'deepcortex.ml.cv.transfer_learning',
                      className: 'ClassificationModel',
                    },
                  },
                  classes: [],
                };
                outputs.push(classificationModel);
                break;
              case 'create_prediction_model':
                if (!inputs['model']) {
                  throw new Error(`model not provided`);
                }
                outputs.push(inputs['model']);
                stepResult.executionTime = 1;
                break;
              case 'create_ssd_detector':
                const detectionModel: ICVModel = {
                  id: 'm_' + Date.now().toString(),
                  experimentId: experimentId,
                  ownerId: user.id,
                  name: 'm_' + Date.now().toString(),
                  updated: new Date().toString(),
                  created: new Date().toString(),
                  inLibrary: false,
                  status: ICVModel.Status.ACTIVE,
                  modelType: {
                    type: CVModelType.Type.CUSTOM,
                    labelMode: IAlbum.LabelMode.LOCALIZATION,
                    classReference: {
                      packageId: 'dc-operators',
                      moduleName: 'deepcortex.ml.cv.transfer_learning',
                      className: 'DetectionModel',
                    },
                  },
                  classes: [],
                };
                outputs.push(detectionModel);
                stepResult.executionTime = 1;
                break;
              case 'save_model':
                if (!('name' in step.params)) {
                  throw new Error(`name parameter not specified`);
                }
                if (!inputs['model']) {
                  throw new Error('model not provided');
                }
                const modelToSave = inputs['model'];
                const modelName = step.params['name'] || 'CVModel-' + Date.now().toString();
                modelToSave.name = modelName;
                collections.cvModels.insertOne({...modelToSave, inLibrary: false, updated: new Date().toString()});
                stepResult.assets.push({ type: IAsset.Type.CV_MODEL, id: modelToSave.id});
                stepResult.executionTime = 1;
                break;
              case 'calculate_praf_matrix':
              case 'calculate_dc_map_score':
                if (!('album' in inputs)) {
                  throw new Error(`no album provided`);
                }
                const album: IAlbum = inputs['album'];
                if ('fixtureSummary' in album) {
                  stepResult['summaries'] = [
                    {
                      type: IGenericExperiment.SummaryType.CONFUSION_MATRIX,
                      labels: album['fixtureSummary']['labels'],
                      rows: album['fixtureSummary']['confusionMatrix'],
                    },
                    {
                      type: IGenericExperiment.SummaryType.SIMPLE,
                      values: {
                        'mAP score': album['fixtureSummary']['mAP'],
                      },
                    },
                  ];
                }
                stepResult.executionTime = 0;
                break;
              case 'predict_2step':
                if (!('detection_model' in inputs)) {
                  throw new Error(`no detection model provided`);
                }
                if (!('classification_model' in inputs)) {
                  throw new Error(`no classification model provided`);
                }
                if (!('album' in inputs)) {
                  throw new Error(`no album provided`);
                }
                stepResult.executionTime = Math.round(
                  Math.random() * 0.05 * albumSize(collections.pictures, inputs['album'].id),
                );
                break;
              case 'predict_1step':
                if (!('model' in inputs)) {
                  throw new Error(`no model provided`);
                }
                if (!('album' in inputs)) {
                  throw new Error(`no album provided`);
                }
                stepResult.executionTime = Math.round(
                  Math.random() * 0.01 * albumSize(collections.pictures, inputs['album'].id),
                );
                break;
              case 'save_album':
                if (!('album' in inputs)) {
                  throw new Error(`no album provided`);
                }
                const oldAlbum = inputs['album'];
                // Save album
                const albumToSave: IAlbum = Object.assign({}, oldAlbum, {
                  id: Date.now().toString(),
                  name: step.params['name'] || 'Album ' + Date.now().toString(),
                  description: step.params['description'] || '',
                  ownerId: user.id,
                  updated: new Date().toString(),
                  created: new Date().toString(),
                  status: IAlbum.Status.ACTIVE,
                });
                delete albumToSave['$loki'];
                collections.albums.insertOne({...albumToSave, inLibrary: false});
                // Save pictures
                const pictures = collections.pictures.chain().find({ albumId: oldAlbum.id }).data();
                const addPredictions = oldAlbum.type !== IAlbum.Type.SOURCE;
                let picturesCount = 0;
                pictures.forEach(picture => {
                  const copiedPicture = Object.assign({}, picture, {
                    albumId: albumToSave.id,
                    id: `${albumToSave.id}_${picture.id}`,
                  });
                  if (addPredictions && picture['fixtureTags']) {
                    copiedPicture.predictedTags = picture.fixtureTags;
                  }
                  delete copiedPicture['$loki'];
                  collections.pictures.insert(copiedPicture);
                  picturesCount++;
                });
                stepResult.assets.push({ type: IAsset.Type.ALBUM, id: albumToSave.id});
                stepResult.summaries = [
                  {
                    type: IGenericExperiment.SummaryType.SIMPLE,
                    values: {
                      'Album ID': albumToSave.id,
                    },
                  },
                ];
                stepResult.executionTime = Math.round(
                  Math.random() * 0.01 * picturesCount,
                );
                break;
              case 'add_prediction_to_album':
                if (!('album' in inputs)) {
                  throw new Error(`album not specified`);
                }
                const albumWithPredictions: IAlbum = {...inputs['album'], type: IAlbum.Type.TRAINRESULTS};
                outputs.push(albumWithPredictions);
                stepResult.executionTime = Math.round(
                  Math.random() * 0.001 * albumSize(collections.pictures, albumWithPredictions.id),
                );
                break;
              default:
                console.log(`No processing for ${operator.id}`);
            }
          } catch (e) {
            throw new Error(`Error while executing pipeline: ${operator.name} ${e}`);
          }
          executedSteps[step.id] = outputs;
          stepResults.push(stepResult);
          stuck = false;
        }
      }
    });
    if (stuck) {
      throw new Error('Error while executing pipeline (stuck)');
    }
  } while (Object.keys(executedSteps).length < genericPipeline.steps.length);
  console.log('Pipeline executed');
  return [stepResults, selectedAssets];
};

const generateSimpleAugmentationAlbumSummary = (
  picturesLength: number,
  augmentations: IAlbumAugmentParams.Augmentation[],
): IAugmentationSummary[] => {
  return augmentations.map(augmentation => {
    return {
      count: MiscUtils.getRandomInt(1, picturesLength),
      augmentation,
    };
  });
};

function runCVTLTrainExperiment(pipeline: ICVTLTrainPipeline, collections: FixtureServiceCollectionsMap, user, experimentId: string) {
  let stepIdModelId;
  let result: IAbstractExperimentResult;
  console.log(pipeline);
  if (!pipeline.step1.featureExtractorModelId) {
    const step1Model: ICVModel = {
      id: 'm_' + Date.now().toString(),
      ownerId: user.id,
      name: 'CVModel',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      inLibrary: false,
      experimentId: experimentId,
      status: ICVModel.Status.ACTIVE,
      modelType: {
        type: CVModelType.Type.TL,
        tlType: CVModelType.TLType.LOCALIZATION,
        architecture: pipeline.step1.architecture,
        labelMode: IAlbum.LabelMode.LOCALIZATION,
        detectorType: 'RFBNET',
      },
      classes: [
        'bmp2_tank',
        'btr60_transport',
        'btr70_transport',
        't72_tank',
      ],
    };
    stepIdModelId = step1Model.id;
    collections.cvModels.insertOne(step1Model);
  } else {
    stepIdModelId = pipeline.step1.featureExtractorModelId;
  }
  const step1TrainAlbum = collections.albums.findOne({id: pipeline.step1.input});
  const step1: ICVTLTrainStepResult = {
    cvModelId: stepIdModelId,
    output: pipeline.step1.input,
    summary: step1TrainAlbum.fixtureSummary,
    trainTimeSpentSummary: {
      tasksQueuedTime: 3401,
      totalJobTime: 15000,
      dataLoadingTime: 1304,
      pipelineDetails: [
        { time: 101, description: 'Feature Extraction' },
        { time: 354, description: 'KPCA Training' },
      ],
      trainingTime: 2422,
      initialPredictionTime: 1105,
      modelSavingTime: 320,
    },
    evaluationTimeSpentSummary: {
      tasksQueuedTime: 3402,
      totalJobTime: 15001,
      dataLoadingTime: 1305,
      pipelineDetails: [],
      modelLoadingTime: 123123,
      scoreTime: 123127,
    },
  };

  if (pipeline.step1.augmentationOptions && pipeline.step1.augmentationOptions.augmentations.length) {
    step1.augmentationSummary = generateSimpleAugmentationAlbumSummary(
      1000,
      pipeline.step1.augmentationOptions.augmentations,
    );

    if (pipeline.step1.augmentationOptions.prepareSampleAlbum) {
      step1.augmentedSampleAlbum = step1.output;
    }
  }

  result = { step1 };
  if (pipeline.step2) {
    const step2TrainAlbum = collections.albums.findOne({id: pipeline.step2.input});
    const step2Model: ICVModel = {
      id: 'm_' + Date.now().toString(),
      ownerId: user.id,
      name: 'CVModel',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      inLibrary: false,
      status: ICVModel.Status.ACTIVE,
      modelType: {
        type: CVModelType.Type.CUSTOM,
        labelMode: IAlbum.LabelMode.CLASSIFICATION,
        classReference: {
          packageId: 'some package',
          moduleName: 'some module',
          className: 'some class',
        },
      },
      classes: 'fixtureSummary' in step2TrainAlbum ? step2TrainAlbum.fixtureSummary.labels : [],
    };
    collections.cvModels.insertOne(step2Model);
    const step2: ICVTLTrainStepResult = {
      cvModelId: step2Model.id,
      output: pipeline.step2.input,
      testOutput: pipeline.step2.testInput,
      summary: step2TrainAlbum.fixtureSummary,
      trainTimeSpentSummary: {
        tasksQueuedTime: 3401,
        totalJobTime: 15000,
        dataLoadingTime: 1304,
        pipelineDetails: [
          { time: 101, description: 'Feature Extraction' },
          { time: 354, description: 'KPCA Training' },
        ],
        trainingTime: 2422,
        initialPredictionTime: 1105,
        modelSavingTime: 320,
      },
      evaluationTimeSpentSummary: {
        tasksQueuedTime: 3402,
        totalJobTime: 15001,
        dataLoadingTime: 1305,
        pipelineDetails: [
          { time: 103, description: 'Feature Extraction' },
          { time: 356, description: 'KPCA Training' },
        ],
        modelLoadingTime: 123123,
        scoreTime: 123127,
      },
    };

    if (pipeline.step2.augmentationOptions && pipeline.step2.augmentationOptions.augmentations.length) {
      step2.augmentationSummary = generateSimpleAugmentationAlbumSummary(
        1000,
        pipeline.step2.augmentationOptions.augmentations,
      );

      if (pipeline.step2.augmentationOptions.prepareSampleAlbum) {
        step2.augmentedSampleAlbum = step2.output;
      }
    }

    result['step2'] = step2;
  }
  return result;
}

export const experimentsRoutes: IFixtureServiceRoute[] = [
  {
    url: 'experiments$',
    method: 'GET',
    handler: function (this, params, user) {
      return this.serveAssetListRequest(this.collections.experiments, IAsset.Type.EXPERIMENT, params, user);
    },
  },
  {
    url: 'experiments/([\\w\\-]+)$',
    method: 'GET',
    handler: function(this, params, user) {
      const id = params[1];
      const experiments = this.collections.experiments;
      const experiment = experiments.findOne({id: id, ownerId: user.id});

      if (!experiment) {
        throw new Error('Experiment Not found');
      }

      return experiment;
    },
  },
  {
    url: 'config/execution-targets$',
    method: 'GET',
    handler: function(this, params, user) {
      if (!this['__counter']) {
        this['__counter'] = 0;
      }
      const targets: ExecutionTarget[] = [
        {
          name: 'DeepCortex cluster',
        },
      ];
      if (this['__counter'] > 10) {
        targets.push({
          name: 'my local machine',
          serviceId: 'remote',
          targetId: 'localhost1',
        });
      }
      this['__counter'] = this['__counter'] + 1;
      return targets;
    },
  },
  {
    url: 'experiments$',
    method: 'POST',
    handler: function(this, params: IExperimentCreate, user) {
      const { experiments, processes } = this.collections;

      let expectedDuration = null;

      const experimentId = Date.now().toString();
      let result: IAbstractExperimentResult;
      const isInteractive = params.isInteractive;
      switch (params.type) {
        case ExperimentType.TestExperiment:
          result = { ...params.pipeline };
          break;
        case ExperimentType.GenericExperiment:
          const genericPipeline = <IGenericExperiment.Pipeline> params.pipeline;
          if (!isInteractive) {
            const [stepResults, selectedAssets] = runGenericExperiment(genericPipeline, this.collections, user, experimentId);
            result = {
              pipeline: {...genericPipeline, assets: selectedAssets},
              steps: stepResults,
            };
            expectedDuration = _.sum(stepResults.map(_ => _.executionTime)) * 1000 + 5000;
          } else {
            result = null;
          }
          break;
        case ExperimentType.CVTLTrain:
          const pipeline = params.pipeline as ICVTLTrainPipeline;
          result = runCVTLTrainExperiment(pipeline, this.collections, user, experimentId);

          break;
        default:
          result = null;
      }

      const newExperiment: IExperimentFull = Object.assign(
        {
          id: experimentId,
          name: null,
          description: null,
          type: null,
          ownerId: user.id,
          status: IExperiment.Status.RUNNING,
          isInteractive: isInteractive,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          result,
        },
        params,
      );
      processes.insertOne({
        id: 'm_' + Date.now().toString(),
        ownerId: user.id,
        target: IAsset.Type.EXPERIMENT,
        targetId: newExperiment.id,
        progress: 0,
        status: IProcess.Status.RUNNING,
        created: new Date().toISOString(),
        started: new Date().toISOString(),
        jobType: IProcess.JobType.GENERIC_EXPERIMENT,
        _expectedDuration: expectedDuration,
      });
      return experiments.insertOne(newExperiment);
    },
  },
  {
    url: 'experiments/([\\w\\-]+)$',
    method: 'PUT',
    handler: function(this, params, user) {
      const id = params[1];
      const experiments = this.collections.experiments;
      const experiment = experiments.findOne({ id: id, ownerId: user.id });
      if (!experiment) {
        throw new Error('Experiment Not found');
      }

      // update (specific properties only)
      [
        'name',
        'description',
      ].forEach(prop =>
        params[prop] !== undefined && (experiment[prop] = params[prop]),
      );

      experiments.update(experiment);

      return experiment;
    },
  },
  {
    url: 'experiments/([\\w\\-]+)$',
    method: 'DELETE',
    handler: function(this, params, user) {
      const id = params[1];
      const experiments = this.collections.experiments;
      const experiment = experiments.findOne({ id: id, ownerId: user.id });
      if (!experiment) {
        throw new Error('Experiment Not found');
      }

      experiments.remove(experiment);

      return experiment;
    },
  },
  {
    url: 'experiments/([\\w\\-]+)/pipeline$',
    method: 'PUT',
    handler: function(this, params, user) {
      const id = params[1];
      const experiments = this.collections.experiments;
      const experiment = experiments.findOne({ id: id, ownerId: user.id });
      if (!experiment) {
        throw new Error('Experiment Not found');
      }
      if (!experiment.isInteractive) {
        throw new Error('Unable to update pipeline of non-interactive experiments');
      }
      [
        'steps',
      ].forEach(prop =>
        params[prop] !== undefined && (experiment['pipeline'][prop] = params[prop]),
      );

      return experiment;
    },
  },
];

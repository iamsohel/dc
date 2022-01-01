import { IAsset } from '../../core/interfaces/common.interface';
import { PipelineOperator } from '../../pipelines/pipeline.interfaces';
import { LIST_TYPE_DEFINITION } from '../../pipelines/pipeline.service';
import { IFixtureData } from '../fixture.interface';

const albumType = {
  definition: 'deepcortex.library.albums.Album',
  parents: [],
  typeArguments: [],
};

const tableType = {
  definition: 'deepcortex.library.tables.Table',
  parents: [],
  typeArguments: [],
};

const dataLoaderType = {
  definition: 'torch.utils.data.dataloader.DataLoader',
  parents: [],
  typeArguments: [],
};

const featureExtractorType = {
  definition: 'ml_lib.feature_extractors.FeatureExtractor.FeatureExtractor',
  parents: [],
  typeArguments: [],
};

const dataInfoType = {
  definition: 'deepcortex.operators.DataInfo',
  parents: [],
  typeArguments: [],
};

const transformationType = {
  definition: 'deepcortex.ml.cv.dataset.transformations.Transformation',
  parents: [],
  typeArguments: [],
};

const baseModelType = {
  definition: 'deepcortex.ml.cv.transfer_learning.detector.BaseModel',
  parents: [],
  typeArguments: [],
};

const detectionModelType = {
  definition: 'deepcortex.ml.cv.transfer_learning.detector.DetectionModel',
  parents: [
    baseModelType,
  ],
  typeArguments: [],
};

const predictionModelType = {
  definition: 'deepcortex.ml.cv.transfer_learning.detector.PredictionModel',
  parents: [
    baseModelType,
  ],
  typeArguments: [],
};

const neuralClassificationModelType = {
  definition: 'deepcortex.ml.cv.transfer_learning.classificator.NeuralClassificationModel',
  parents: [
    baseModelType,
  ],
  typeArguments: [],
};

const nonNeuralClassificationModelType = {
  definition: 'deepcortex.ml.cv.transfer_learning.classificator.NonNeuralClassificationModel',
  parents: [
    baseModelType,
  ],
  typeArguments: [],
};

const odResultType = {
  definition: 'deepcortex.operators.PredictionResult',
  parents: [],
  typeArguments: [],
};
const myObjectType = { definition: 'MyObject', parents: [], typeArguments: [] };
const myObjectListType = { definition: LIST_TYPE_DEFINITION, parents: [], typeArguments: [myObjectType] };
const objAType =  { definition: 'A', parents: [], typeArguments: [] };
const objAListType =  { definition: LIST_TYPE_DEFINITION, parents: [], typeArguments: [objAType] };
const objBType =  { definition: 'B', parents: [], typeArguments: [] };
const objBListType =  { definition: LIST_TYPE_DEFINITION, parents: [], typeArguments: [objBType] };
const objCType =  { definition: 'C', parents: [], typeArguments: [] };

export const pipelineOperators: IFixtureData<PipelineOperator> = {
  data: [
    {
      id: 'select_album',
      name: 'Select Album',
      className: 'SelectAlbum',
      moduleName: 'deepcortex.pipelines.operators.selectors',
      packageName: 'dc-operators',
      category: 'SELECTOR',
      inputs: [],
      outputs: [
        { type: albumType, description: 'Album' },
      ],
      params: [
        { name: 'album_id', caption: 'Album', multiple: false, assetType: IAsset.Type.ALBUM, type: 'assetReference' },
      ],
    },
    {
      id: 'select_table',
      name: 'Select Table',
      className: 'SelectTable',
      moduleName: 'deepcortex.pipelines.operators.selectors',
      packageName: 'dc-operators',
      category: 'SELECTOR',
      inputs: [],
      outputs: [
        { type: tableType, description: 'Table' },
      ],
      params: [
        { name: 'table_id', caption: 'Table', multiple: false, assetType: IAsset.Type.TABLE, type: 'assetReference'},
      ],
    },
    {
      id: 'save_album',
      name: 'Save Album',
      className: 'SaveAlbum',
      moduleName: 'deepcortex.pipelines.operators.save_album',
      packageName: 'dc-operators',
      category: 'SAVER',
      inputs: [
        { name: 'album', description: 'Loaded album', type: albumType, covariate: true },
      ],
      outputs: [],
      params: [
        { name: 'name', caption: 'Album name', multiple: false, options: [], type: 'string' },
        { name: 'description', caption: 'Album description', multiple: false, options: [], type: 'string' },
      ],
    },
    {
      id: 'split_album',
      name: 'Split Album',
      className: 'SplitAlbum',
      moduleName: 'deepcortex.pipelines.operators.',
      packageName: 'dc-operators',
      category: 'ALBUM_TRANSFORMER',
      inputs: [
        { name: 'album', description: 'Loaded album', type: albumType, covariate: true },
      ],
      outputs: [
        { type: albumType, description: 'Train Album' },
        { type: albumType, description: 'Test Album' },
      ],
      params: [
        { name: 'size', caption: 'Size of a first album', type: 'float', defaults: [ 0.8 ], min: 0, max: 1 },
      ],
    },
    {
      id: 'transform_album',
      name: 'Transform Album',
      className: 'TransformAlbum',
      moduleName: 'deepcortex.pipelines.operators.',
      packageName: 'dc-operators',
      category: 'ALBUM_TRANSFORMER',
      inputs: [
        { name: 'album', description: 'Album', type: albumType, covariate: true },
        { name: 'transformation', description: 'Transformation', type: transformationType, covariate: true },
      ],
      outputs: [
        { type: albumType, description: 'Transformed album' },
      ],
      params: [
        { name: 'bloat_factor', caption: 'Bloat factor', type: 'int', defaults: [0], multiple: false },
        { name: 'augment', caption: 'Augment', type: 'boolean', defaults: [true] },
      ],
    },
    {
      id: 'fix_channels',
      name: 'Fix Channels',
      className: 'FixChannels',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [
        { name: 'channels', caption: 'Number of channels', type: 'int', multiple: false },
      ],
    },
    {
      id: 'convert_to_float32',
      name: 'Convert to Float32',
      className: 'ConvertToFloat32',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'box_relative_coordinates',
      name: 'Box Relative Coordinates',
      className: 'BoxRelativeCoordinates',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'resize_and_pad',
      name: 'Resize and Pad',
      className: 'ResizeAndPad',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [
        { name: 'width', caption: 'Width', type: 'int', multiple: false },
        { name: 'height', caption: 'Height', type: 'int', multiple: false },
      ],
    },
    {
      id: 'normalize_by_max',
      name: 'Normalize by Max',
      className: 'NormalizeByMax',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'random_horizontal_flip',
      name: 'Random Horizontal Flip',
      className: 'RandomHorizontalFlip',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'random_vertical_flip',
      name: 'Random Vertical Flip',
      className: 'RandomVerticalFlip',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'rotate_image',
      name: 'Rotate Image',
      className: 'RotateImage',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'shear_image',
      name: 'Shear Image',
      className: 'ShearImage',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'salt_pepper',
      name: 'Salt Pepper',
      className: 'SaltPepper',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'choose_one',
      name: 'Choose One',
      className: 'ChooseOne',
      moduleName: 'deepcortex.pipelines.operators.transformations',
      packageName: 'dc-operators',
      category: 'TRANSFORMER',
      inputs: [
        { name: 'transformation1', description: '', type: transformationType, covariate: true },
        { name: 'transformation2', description: '', type: transformationType, covariate: true },
      ],
      outputs: [
        { type: transformationType, description: '' },
      ],
      params: [],
    },
    {
      id: 'create_dataloader',
      name: 'Create DataLoader',
      className: 'CreateDataLoader',
      moduleName: 'deepcortex.pipelines.operators.dataloader',
      packageName: 'dc-operators',
      category: 'DATA_PREPARATION',
      inputs: [
        { name: 'album', description: '', type: albumType, covariate: true },
        { name: 'transformation', description: '', type: transformationType, covariate: true, optional: true },
        { name: 'data_augmentation_transformation', description: '', type: transformationType, covariate: true, optional: true },
      ],
      outputs: [
        { type: dataLoaderType, description: 'Data loader object' },
        { type: dataInfoType, description: 'Data info' },
      ],
      params: [],
    },
    {
      id: 'create_fe',
      name: 'MobilenetV2 CNN',
      className: 'MobilenetV2',
      moduleName: 'deepcortex.pipelines.operators.cnn',
      packageName: 'dc-operators',
      category: 'FEATURE_EXTRACTOR',
      inputs: [],
      outputs: [
        { type: featureExtractorType, description: 'Feature Extractor' },
      ],
      params: [
        {
          name: 'take_feature_extractor_from',
          caption: 'Take feature extractor from',
          multiple: false,
          options: ['Existing model', 'New model'],
          defaults: ['New model'],
          type: 'string',
        },
        {
          name: 'id_feature_extractor',
          caption: 'Select the model to retrieve the feature extractor',
          multiple: false,
          conditions: { take_feature_extractor_from: { values: ['Existing model'] } },
          assetType: IAsset.Type.CV_MODEL,
          type: 'assetReference',
        },
        { name: 'width_multiplier', caption: 'Width multiplier', type: 'float', defaults: [ 1.0 ], multiple: false, conditions: { take_feature_extractor_from: { values: ['New model'] } } },
        { name: 'pooling_layer', caption: 'Add pooling layer', type: 'boolean', defaults: [ true ], multiple: false, conditions: { take_feature_extractor_from: { values: ['New model'] } } },
      ],
    },
    {
      id: 'create_vgg16_rfb_fe',
      name: 'VGG16 RFB CNN',
      className: 'VGG16RFB',
      moduleName: 'deepcortex.pipelines.operators.cnn',
      packageName: 'dc-operators',
      category: 'FEATURE_EXTRACTOR',
      inputs: [],
      outputs: [
        { type: featureExtractorType, description: 'Feature Extractor' },
      ],
      params: [
        {
          name: 'take_feature_extractor_from',
          caption: 'Take feature extractor from',
          multiple: false,
          options: ['Existing model', 'New model'],
          defaults: ['New model'],
          type: 'string',
        },
        {
          name: 'id_feature_extractor',
          caption: 'Select the model to retrieve the feature extractor',
          multiple: false,
          conditions: { take_feature_extractor_from: { values: ['Existing model'] } },
          assetType: IAsset.Type.CV_MODEL,
          type: 'assetReference',
        },
        { name: 'batch_normalization', caption: 'Enable batch normalization', type: 'boolean', defaults: [ false], multiple: false, conditions: { take_feature_extractor_from: { values: ['New model'] } } },
      ],
    },
    {
      id: 'append_feature_fusion',
      name: 'Append Feature Fusion',
      className: 'AppendFeatureFusion',
      moduleName: 'deepcortex.pipelines.operators.append_fe_fu',
      packageName: 'dc-operators',
      category: 'FEATURE_TRANSFORMER',
      inputs: [
        { name: 'feature_extractor', type: featureExtractorType, description: '', covariate: true },
      ],
      outputs: [
        { type: featureExtractorType, description: '' },
      ],
      params: [],
    },
    {
      id: 'rfb_cell',
      name: 'Append RFB Cell',
      className: 'AppendRFBCell',
      moduleName: 'deepcortex.pipelines.operators.rfbcell',
      packageName: 'dc-operators',
      category: 'FEATURE_TRANSFORMER',
      inputs: [
        { name: 'feature_extractor', type: featureExtractorType, description: '', covariate: true },
      ],
      outputs: [
        { type: featureExtractorType, description: '' },
      ],
      params: [],
    },
    {
      id: 'create_ssd_detector',
      name: 'Create SSD Detector',
      className: 'CreateSSDDetector',
      moduleName: 'deepcortex.pipelines.operators.detectors',
      packageName: 'dc-operators',
      category: 'DETECTOR',
      inputs: [
        { name: 'feature_extractor', type: featureExtractorType, description: '', covariate: true },
        { name: 'data_info', type: dataInfoType, description: '', covariate: true },
      ],
      outputs: [
        { type: detectionModelType, description: '' },
      ],
      params: [],
    },
    {
      id: 'create_fcn_classifier',
      name: 'Create FCN Classifier',
      className: 'CreateFCNClassifier',
      moduleName: 'deepcortex.pipelines.operators.detectors',
      packageName: 'dc-operators',
      category: 'CLASSIFIER',
      inputs: [
        { name: 'feature_extractor', type: featureExtractorType, description: '', covariate: true },
        { name: 'data_info', type: dataInfoType, description: '', covariate: true },
      ],
      outputs: [
        { type: neuralClassificationModelType, description: '' },
      ],
      params: [],
    },
    {
      id: 'create_freescale_classifier',
      name: 'Create FreeScale Classifier',
      className: 'CreateFreeScaleClassifier',
      moduleName: 'deepcortex.pipelines.operators.detectors',
      packageName: 'dc-operators',
      category: 'CLASSIFIER',
      inputs: [
        { name: 'feature_extractor', type: featureExtractorType, description: '', covariate: true },
        { name: 'data_info', type: dataInfoType, description: '', covariate: true },
      ],
      outputs: [
        { type: neuralClassificationModelType, description: '' },
      ],
      params: [],
    },
    {
      id: 'create_kpcn_mnl_classifier',
      name: 'Create KPCN MNL Classifier',
      className: 'CreateKPCNMNLClassifier',
      moduleName: 'deepcortex.pipelines.operators.detectors',
      packageName: 'dc-operators',
      category: 'CLASSIFIER',
      inputs: [
        { name: 'feature_extractor', type: featureExtractorType, description: '', covariate: true },
        { name: 'data_info', type: dataInfoType, description: '', covariate: true },
      ],
      outputs: [
        { type: nonNeuralClassificationModelType, description: '' },
      ],
      params: [
        { name: 'components', type: 'int', caption: 'Number of main components', defaults: [ 600 ], multiple: false },
      ],
    },
    {
      id: 'learn_detection_model',
      name: 'Learn Detection Model',
      className: 'LearnDetectionModel',
      moduleName: 'deepcortex.pipelines.operators.learners',
      packageName: 'dc-operators',
      category: 'LEARNER',
      inputs: [
        { name: 'model', type: detectionModelType, description: '', covariate: true },
        { name: 'train_dataloader', type: dataLoaderType, description: '', covariate: true },
        { name: 'validate_dataloader', type: dataLoaderType, description: '', covariate: true, optional: true },
      ],
      outputs: [
        { type: detectionModelType, description: '' },
      ],
      params: [
        {
          name: 'max_epoch',
          caption: 'Maximum number of epochs for training',
          multiple: false,
          defaults: [10],
          type: 'int',
        }, {
          name: 'optimizer',
          caption: 'Select optimizer',
          multiple: false,
          options: ['SGD', 'Adam'],
          defaults: ['SGD'],
          type: 'string',
        }, {
          name: 'lr',
          caption: 'Learning rate',
          multiple: false,
          defaults: [0.0010000000474974513],
          type: 'float',
        }, {
          name: 'finetune',
          caption: 'Finetune of feature extractor',
          multiple: false,
          defaults: [true],
          type: 'boolean',
        }, {
          name: 'finetune_lr',
          caption: 'Finetune learning rate',
          multiple: false,
          conditions: { finetune: { value: true } },
          defaults: [0.0010000000474974513],
          type: 'float',
        }, {
          name: 'momentum',
          caption: 'Momentum factor',
          multiple: false,
          conditions: { optimizer: { values: ['SGD'] } },
          defaults: [0],
          type: 'float',
        }, {
          name: 'nesterov',
          caption: 'Enables Nesterov momentum',
          multiple: false,
          conditions: { optimizer: { values: ['SGD'] } },
          defaults: [false],
          type: 'boolean',
        }, {
          name: 'betas',
          caption: 'Betas coefficients',
          multiple: false,
          conditions: { optimizer: { values: ['Adam'] } },
          options: [],
          defaults: ['(0.9, 0.999)'],
          type: 'string',
        }, {
          name: 'eps',
          caption: 'Epsilon coefficients',
          multiple: false,
          conditions: { optimizer: { values: ['Adam'] } },
          defaults: [9.99999993922529e-9],
          type: 'float',
        }, {
          name: 'amsgrad',
          caption: 'Whether to use the AMSGrad variant',
          multiple: false,
          conditions: { optimizer: { values: ['Adam'] } },
          defaults: [false],
          type: 'boolean',
        }, {
          name: 'scheduler_type',
          caption: 'Scheduler Type',
          multiple: false,
          options: ['ReduceLROnPlateau', 'StepLR'],
          defaults: ['ReduceLROnPlateau'],
          type: 'string',
        }, {
          name: 'warmup_period',
          caption: 'A warmup period for scheduler',
          multiple: false,
          defaults: [0],
          type: 'int',
        }, {
          name: 'patience',
          caption: 'Patience period',
          multiple: false,
          defaults: [10],
          type: 'int',
        }, {
          name: 'step_size',
          caption: 'Step size',
          multiple: false,
          conditions: { scheduler_type: { values: ['StepLR'] } },
          defaults: [20],
          type: 'int',
        }, {
          name: 'gamma',
          caption: 'Gamma coefficient',
          multiple: false,
          conditions: { scheduler_type: { values: ['StepLR'] } },
          defaults: [0.5],
          type: 'float',
        },
      ],
    },
    {
      id: 'learn_non_neural_classification_model',
      name: 'Learn Non-neural Classification Model',
      className: 'LearnNonNeuralClassificationModel',
      moduleName: 'deepcortex.pipelines.operators.learners',
      packageName: 'dc-operators',
      category: 'LEARNER',
      inputs: [
        { name: 'model', type: nonNeuralClassificationModelType, description: '', covariate: true },
        { name: 'train_dataloader', type: dataLoaderType, description: '', covariate: true },
        { name: 'validate_dataloader', type: dataLoaderType, description: '', covariate: true, optional: true },
      ],
      outputs: [
        { type: nonNeuralClassificationModelType, description: '' },
      ],
      params: [],
    },
    {
      id: 'learn_neural_classification_model',
      name: 'Learn Neural Classification Model',
      className: 'LearnNeuralClassificationModel',
      moduleName: 'deepcortex.pipelines.operators.learners',
      packageName: 'dc-operators',
      category: 'LEARNER',
      inputs: [
        { name: 'model', type: neuralClassificationModelType, description: '', covariate: true },
        { name: 'train_dataloader', type: dataLoaderType, description: '', covariate: true },
        { name: 'validate_dataloader', type: dataLoaderType, description: '', covariate: true, optional: true },
      ],
      outputs: [
        { type: neuralClassificationModelType, description: '' },
      ],
      params: [
        {
          name: 'max_epoch',
          caption: 'Maximum number of epochs for training',
          multiple: false,
          defaults: [10],
          type: 'int',
        }, {
          name: 'optimizer',
          caption: 'Select optimizer',
          multiple: false,
          options: ['SGD', 'Adam'],
          defaults: ['SGD'],
          type: 'string',
        }, {
          name: 'lr',
          caption: 'Learning rate',
          multiple: false,
          defaults: [0.0010000000474974513],
          type: 'float',
        }, {
          name: 'finetune',
          caption: 'Finetune of feature extractor',
          multiple: false,
          defaults: [true],
          type: 'boolean',
        }, {
          name: 'finetune_lr',
          caption: 'Finetune learning rate',
          multiple: false,
          conditions: { finetune: { value: true } },
          defaults: [0.0010000000474974513],
          type: 'float',
        }, {
          name: 'momentum',
          caption: 'Momentum factor',
          multiple: false,
          conditions: { optimizer: { values: ['SGD'] } },
          defaults: [0],
          type: 'float',
        }, {
          name: 'nesterov',
          caption: 'Enables Nesterov momentum',
          multiple: false,
          conditions: { optimizer: { values: ['SGD'] } },
          defaults: [false],
          type: 'boolean',
        }, {
          name: 'betas',
          caption: 'Betas coefficients',
          multiple: false,
          conditions: { optimizer: { values: ['Adam'] } },
          options: [],
          defaults: ['(0.9, 0.999)'],
          type: 'string',
        }, {
          name: 'eps',
          caption: 'Epsilon coefficients',
          multiple: false,
          conditions: { optimizer: { values: ['Adam'] } },
          defaults: [9.99999993922529e-9],
          type: 'float',
        }, {
          name: 'amsgrad',
          caption: 'Whether to use the AMSGrad variant',
          multiple: false,
          conditions: { optimizer: { values: ['Adam'] } },
          defaults: [false],
          type: 'boolean',
        }, {
          name: 'scheduler_type',
          caption: 'Scheduler Type',
          multiple: false,
          options: ['ReduceLROnPlateau', 'StepLR'],
          defaults: ['ReduceLROnPlateau'],
          type: 'string',
        }, {
          name: 'warmup_period',
          caption: 'A warmup period for scheduler',
          multiple: false,
          defaults: [0],
          type: 'int',
        }, {
          name: 'patience',
          caption: 'Patience period',
          multiple: false,
          defaults: [10],
          type: 'int',
        }, {
          name: 'step_size',
          caption: 'Step size',
          multiple: false,
          conditions: { scheduler_type: { values: ['StepLR'] } },
          defaults: [20],
          type: 'int',
        }, {
          name: 'gamma',
          caption: 'Gamma coefficient',
          multiple: false,
          conditions: { scheduler_type: { values: ['StepLR'] } },
          defaults: [0.5],
          type: 'float',
        },
      ],
    },
    {
      id: 'create_prediction_model',
      name: 'Create Prediction Model',
      className: 'CreatePredictionModel',
      moduleName: 'deepcortex.pipelines.operators.models',
      packageName: 'dc-operators',
      category: 'SAVER',
      inputs: [
        { name: 'model', type: baseModelType, description: '', covariate: true },
        { name: 'transformation', type: transformationType, description: '', covariate: true, optional: true },
      ],
      outputs: [
        { type: predictionModelType, description: '' },
      ],
      params: [],
    },
    {
      id: 'calculate_dc_map_score',
      name: 'Calculate DC_MAP Score',
      className: 'CalculateDCMapScore',
      moduleName: 'deepcortex.pipelines.operators.metric',
      packageName: 'dc-operators',
      category: 'METRIC',
      inputs: [
        { name: 'album', type: albumType, description: '', covariate: true },
        { name: 'predictions', type: odResultType, description: '', covariate: true },
      ],
      outputs: [
      ],
      params: [],
    },
    {
      id: 'calculate_praf_matrix',
      name: 'Calculate PRAF Matrix',
      className: 'CalculatePRAFMatrix',
      moduleName: 'deepcortex.pipelines.operators.metric',
      packageName: 'dc-operators',
      category: 'METRIC',
      inputs: [
        { name: 'album', type: albumType, description: '', covariate: true },
        { name: 'predictions', type: odResultType, description: '', covariate: true },
      ],
      outputs: [
      ],
      params: [],
    },
    {
      id: 'save_model',
      name: 'Save Model',
      className: 'SaveModel',
      moduleName: 'deepcortex.pipelines.operators.models',
      packageName: 'dc-operators',
      category: 'SAVER',
      inputs: [
        { name: 'model', type: baseModelType, description: '', covariate: true },
      ],
      outputs: [
      ],
      params: [
        { name: 'name', caption: 'Model name', type: 'string', options: [] },
      ],
    },
    {
      id: 'predict_2step',
      name: 'Predict 2 Step',
      className: 'Predict2Step',
      moduleName: 'deepcortex.pipelines.operators.predict2step',
      packageName: 'dc-operators',
      category: 'PREDICTOR',
      inputs: [
        { name: 'album', type: albumType, description: 'Album', covariate: true },
        { name: 'detection_model', type: baseModelType, description: 'Detection model', covariate: true },
        { name: 'classification_model', type: baseModelType, description: 'Classification model', covariate: true },
      ],
      outputs: [
        { type: odResultType, description: '' },
      ],
      params: [],
    },
    {
      id: 'predict_1step',
      name: 'Predict 1 Step',
      className: 'Predict1Step',
      moduleName: 'deepcortex.pipelines.operators.predict1step',
      packageName: 'dc-operators',
      category: 'PREDICTOR',
      inputs: [
        { name: 'album', type: albumType, description: 'Album', covariate: true },
        { name: 'model', type: baseModelType, description: 'Trained model', covariate: true },
      ],
      outputs: [
        { type: odResultType, description: '' },
      ],
      params: [],
    },
    {
      id: 'add_prediction_to_album',
      name: 'Add prediction to album',
      className: 'AddODResultToAlbum',
      moduleName: 'deepcortex.pipelines.operators.?',
      packageName: 'dc-operators',
      category: 'ALBUM_TRANSFORMER',
      inputs: [
        { name: 'prediction', type: odResultType, description: 'Prediction Result', covariate: true },
        { name: 'album', type: albumType, description: 'Album', covariate: true },
      ],
      outputs: [
        { type: albumType, description: 'Album with predictions' },
      ],
      params: [],
    },
    {
      id: 'select_model',
      name: 'Select Model',
      className: 'SelectModel',
      moduleName: 'deepcortex.pipelines.operators.models',
      packageName: 'dc-operators',
      category: 'SELECTOR',
      inputs: [
      ],
      outputs: [
        { type: baseModelType, description: 'Model' },
      ],
      params: [
        { name: 'model', caption: 'CV Model', multiple: false, assetType: IAsset.Type.CV_MODEL, type: 'assetReference' },
      ],
    },
    {
      id: 'testOperator1',
      name: 'Test Operator',
      className: 'TestMetricOperator',
      moduleName: 'package2.operators.metrics',
      packageName: 'dc-project-2',
      category: 'METRIC',
      inputs: [
      ],
      outputs: [
      ],
      params: [],
    },
    {
      id: 'filter_album',
      name: 'Filter Album',
      className: 'FilterAlbum',
      moduleName: 'package2.operators',
      packageName: 'dc-operators',
      category: 'ALBUM_TRANSFORMER',
      customComponent: {
        name: 'filter-album-component',
        path: '/assets/fixtures/common-components/components.module.js',
      },
      inputs: [
        { name: 'album', type: albumType, covariate: false, optional: false },
      ],
      outputs: [
        { type: albumType, description: 'Filtered album' },
      ],
      params: [
        { name: 'min', caption: 'First element index', type: 'int', defaults: []},
        { name: 'max', caption: 'Last element index', type: 'int', defaults: []},
      ],
    },
    {
      id: 'produce_myObject',
      name: 'Produce MyObject',
      className: 'ProduceMyObject',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'TRANSFORMER',
      inputs: [],
      outputs: [
        { type: myObjectType, description: 'Single MyObject' },
      ],
      params: [],
    },
    {
      id: 'produce_myObjects',
      name: 'Produce List of MyObjects',
      className: 'ProduceMyObjects',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'TRANSFORMER',
      inputs: [],
      outputs: [
        { type: myObjectListType, description: 'List of MyObjects' },
      ],
      params: [],
    },
    {
      id: 'consume_myObject',
      name: 'Consume MyObject',
      className: 'ConsumeMyObject',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'TRANSFORMER',
      inputs: [
        {name: 'single_object', type: myObjectType, covariate: false},
      ],
      outputs: [],
      params: [],
    },
    {
      id: 'consume_myObjects',
      name: 'Consume MyObjects',
      className: 'ConsumeMyObjects',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'TRANSFORMER',
      inputs: [
        {name: 'multiple_objects', type: myObjectListType, covariate: false},
      ],
      outputs: [],
      params: [],
    },
    {
      id: 'sample_fan_in',
      name: 'Sample FAN-IN Operator',
      className: 'SampleFanIn1',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'TRANSFORMER',
      inputs: [
        {name: 'many_of_a', type: objAListType, covariate: false},
        {name: 'many_of_b', type: objBListType, covariate: false, fanIn: true},
        {name: 'single_c', type: objCType, covariate: false},
      ],
      outputs: [],
      params: [],
    },
    {
      id: 'select_a',
      name: 'Select A',
      className: 'SelectA',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'SELECTOR',
      inputs: [],
      outputs: [
        { type: objAType, description: 'Object of type A' },
      ],
      params: [],
    },
    {
      id: 'select_b',
      name: 'Select B',
      className: 'SelectB',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'SELECTOR',
      inputs: [],
      outputs: [
        { type: objBType, description: 'Object of type B' },
      ],
      params: [],
    },
    {
      id: 'select_c',
      name: 'Select C',
      className: 'SelectC',
      moduleName: 'package3.operators',
      packageName: 'myObject-manipulations',
      category: 'SELECTOR',
      inputs: [],
      outputs: [
        { type: objCType, description: 'Object of type C' },
      ],
      params: [],
    },
    {
      id: 'slice_album',
      name: 'Slice Album',
      className: 'SliceAlbum',
      moduleName: 'package2.operators',
      packageName: 'dc-operators',
      category: 'ALBUM_TRANSFORMER',
      customComponent: {
        name: 'slice-album-component',
        path: '/assets/fixtures/common-components/components.module.js',
      },
      inputs: [
        { name: 'album', type: albumType, covariate: false, optional: false },
      ],
      outputs: [
        { type: albumType, description: 'Filtered album' },
      ],
      params: [
        { name: 'min', caption: 'First element index', type: 'int', defaults: []},
        { name: 'max', caption: 'Last element index', type: 'int', defaults: []},
      ],
    },
    {
      id: 'test_album_operator',
      name: 'Test Album Transformation',
      className: 'TestTransformAlbum',
      moduleName: 'package2.operators',
      packageName: 'dc-operators',
      category: 'ALBUM_TRANSFORMER',
      inputs: [
        { name: 'album', type: albumType, covariate: false, optional: false },
      ],
      outputs: [
        { type: albumType, description: 'Filtered album' },
      ],
      params: [
        { name: 'p1', caption: 'P-One', type: 'int', defaults: [41] },
        {
          name: 'customized',
          caption: 'Important Parameter',
          type: 'int',
          defaults: [],
          customComponent: {
            name: 'slider-component',
            path: '/assets/fixtures/common-components/components.module.js',
          },
        },
      ],
      customEdaComponents: [
        {
          name: 'logo-component',
          path: '/assets/fixtures/common-components/components.module.js',
        },
      ],
    },
    //{
    //  id: '',
    //  name: '',
    //  className: '',
    //  moduleName: 'deepcortex.pipelines.operators.?',
    //  packageName: 'dc-operators',
    //  category: '',
    //  inputs: [
    //  ],
    //  outputs: [
    //  ],
    //  params: [],
    //},
  ],
  options: {
    indices: ['id'],
  },
};

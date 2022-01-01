import { ITable } from '../../tables/table.interface';
import { IModel, ITabularModel } from '../../train/model.interface';
import { IFixtureData, IFixtureTabularModel } from '../fixture.interface';

export const models: IFixtureData<IModel> = {
  data: [
    {
      id: 'model_1',
      name: 'XGBoost Regressor',
      status: IModel.Status.ACTIVE,
      dataType: 'python:dcoperators==0.0.1/dcoperators.tabular.regression.xgboost_regressor/XGBoostRegressor',
      tag: 'model',
      size: 128,
      ownerId: 'ownerId0',
      experimentId: '1568189266392',
      created: '2020-03-24T17:28:40.761Z',
      updated: '2020-03-24T17:36:51.440Z',
      inLibrary: true,
    },
  ],
  options: {
    indices: ['id'],
  },
};

export const tabularModels: IFixtureData<IFixtureTabularModel> = {
  data: [
    {
      id: 'prostate_model',
      name: 'Prostate Cancer Model 12',
      predictorColumns: [
        {
        'name': 'ethnicity',
        'displayName': 'ethnicity',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, {
        'name': 'age_at_time_of_enrolled',
        'displayName': 'age_at_time_of_enrolled',
        'dataType': ITable.ColumnDataType.DOUBLE,
        'variableType': ITable.ColumnVariableType.CONTINUOUS,
      }, { 'name': 'pre_rt_psa',
        'displayName': 'pre_rt_psa', 'dataType': ITable.ColumnDataType.DOUBLE, 'variableType': ITable.ColumnVariableType.CONTINUOUS }, {
        'name': '__cores_positive',
        'displayName': '__cores_positive',
        'dataType': ITable.ColumnDataType.DOUBLE,
        'variableType': ITable.ColumnVariableType.CONTINUOUS,
      }, {
        'name': 'total_gleason',
        'displayName': 'total_gleason',
        'dataType': ITable.ColumnDataType.INTEGER,
        'variableType': ITable.ColumnVariableType.CONTINUOUS,
      }, {
        'name': 'prior_radical_prostatectomy',
        'displayName': 'prior_radical_prostatectomy',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, {
        'name': 'prior_androgen_suppression',
        'displayName': 'prior_androgen_suppression',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, {
        'name': 'prior_dutasteride',
        'displayName': 'prior_dutasteride',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, {
        'name': 'prior_testosterone_',
        'displayName': 'prior_testosterone_',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, {
        'name': 'prior_finasteride',
        'displayName': 'prior_finasteride',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, {
        'name': 'prior_medication_for_urinary_symptoms',
        'displayName': 'prior_medication_for_urinary_symptoms',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, { 'name': 'length_rt',
        'displayName': 'length_rt', 'dataType': ITable.ColumnDataType.INTEGER, 'variableType': ITable.ColumnVariableType.CONTINUOUS }, {
        'name': '__of_sites',
        'displayName': '__of_sites',
        'dataType': ITable.ColumnDataType.INTEGER,
        'variableType': ITable.ColumnVariableType.CONTINUOUS,
      }, {
        'name': 'interruption_in_treatment',
        'displayName': 'interruption_in_treatment',
        'dataType': ITable.ColumnDataType.STRING,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      }, { 'name': '__days_of_btw_end_of_rt_and_last_follow_up',
        'displayName': '__days_of_btw_end_of_rt_and_last_follow_up', 'dataType': ITable.ColumnDataType.INTEGER, 'variableType': ITable.ColumnVariableType.CONTINUOUS },
      ],
      responseColumn: {
        'name': 'all_pre_rt_psa_responded_to_therapy',
        'displayName': 'all_pre_rt_psa_responded_to_therapy',
        'dataType': ITable.ColumnDataType.INTEGER,
        'variableType': ITable.ColumnVariableType.CATEGORICAL,
      },
      class: ITabularModel.Class.CLASSIFICATION,
      status: IModel.Status.ACTIVE,
      ownerId: 'ownerId1',
      created: '2017-03-24T17:28:40.761Z',
      updated: '2017-03-24T17:36:51.440Z',
      experimentId: 'experiment6',
      fixtureEquation: {
        type: 'logistic',
        scales: {},
        intercept: -1.1984318856607632,
        categorical: [
          ['ethnicity', 'Non-Hispanic', 0.6492584290881904],
          ['ethnicity', 'Not Reported', 0.5464095173270612],
          ['ethnicity', 'Hispanic or Latino', 0.6421486189854321],
          ['prior_radical_prostatectomy', 'No', 0.9064602971192712],
          ['prior_radical_prostatectomy', 'Yes (R0)', 0.19604407829760648],
          ['prior_radical_prostatectomy', 'Yes (R1)', -1.1108354022578146],
          ['prior_androgen_suppression', 'No', 0.6683128753658292],
          ['prior_androgen_suppression', 'Yes', -0.3729298750381237],
          ['prior_dutasteride', 'No', 0.7091078594695126],
          ['prior_dutasteride', 'Yes', 0.3391039012174753],
          ['prior_dutasteride', 'NotAvailable', -10.411871446510611],
          ['prior_testosterone_', 'No', 3.400698099358018],
          ['prior_testosterone_', 'Yes', 2.989989199887077],
          ['prior_finasteride', 'No', -3.83228739102846],
          ['prior_finasteride', 'Yes', -3.8375465608048493],
          ['prior_medication_for_urinary_symptoms', 'No', 1.1742066527497854],
          ['prior_medication_for_urinary_symptoms', 'Yes', 1.156746119409322],
          ['interruption_in_treatment', 'No', 1.5028685246787132],
          ['interruption_in_treatment', 'Yes, due to other reason (specify)', 1.5449494427199268],
        ],
        continuous: [
          ['age_at_time_of_enrolled', -0.029468954496391295],
          ['pre_rt_psa', 0.007962397824670332],
          ['__cores_positive', -0.4175419023572645],
          ['total_gleason', -0.2240096770328814],
          ['length_rt', -0.00040333702195606157],
          ['__of_sites', -0.07366329329427362],
          ['__days_of_btw_end_of_rt_and_last_follow_up', -0.001674463635163713],
        ],
        threshold: 0.282096921434192,
        answers: [1, 0],
      },
    },
    {
      id: '95a1df0a-9e1c-43af-b947-190c07a3682c',
      name: '20161118 First GBM',
      predictorColumns: [
        {
          'name': 'score1',
          'displayName': 'score1',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'score2',
          'displayName': 'score2',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'score4',
          'displayName': 'score4',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'score5',
          'displayName': 'score5',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'trd',
          'displayName': 'trd',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'bc_trd',
          'displayName': 'bc_trd',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'nomt_trd',
          'displayName': 'nomt_trd',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'rev_trd',
          'displayName': 'rev_trd',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'rtl_trd',
          'displayName': 'rtl_trd',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'cv10',
          'displayName': 'cv10',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'cv11',
          'displayName': 'cv11',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'cv12',
          'displayName': 'cv12',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'cv13',
          'displayName': 'cv13',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'cv14',
          'displayName': 'cv14',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'at01s',
          'displayName': 'at01s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'at06s',
          'displayName': 'at06s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'at09s',
          'displayName': 'at09s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'at20s',
          'displayName': 'at20s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'at104s',
          'displayName': 'at104s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'au01s',
          'displayName': 'au01s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'bc01s',
          'displayName': 'bc01s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'br01s',
          'displayName': 'br01s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'fr01s',
          'displayName': 'fr01s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'g041s',
          'displayName': 'g041s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
        {
          'name': 'g042s',
          'displayName': 'g042s',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
      ],
      responseColumn: {'name': 'bad',
        'displayName': 'bad', 'dataType': ITable.ColumnDataType.INTEGER, 'variableType': ITable.ColumnVariableType.CATEGORICAL},
      class: ITabularModel.Class.BINARY_CLASSIFICATION,
      status: IModel.Status.ACTIVE,
      ownerId: 'ownerId1',
      created: '2017-05-12T01:33:32.475Z',
      updated: '2017-05-12T01:41:16.832Z',
      experimentId: 'experiment7',
    },
    {
      id: 'model_9',
      name: 'Repeat_Purchase_Model',
      predictorColumns: [
        {
          'name': 'category',
          'displayName': 'category',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': 'company',
          'displayName': 'company',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': 'brand',
          'displayName': 'brand',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': 'l_offer',
          'displayName': 'l_offer',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': 'quantity',
          'displayName': 'quantity',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        }, {
          'name': 'offervalue',
          'displayName': 'offervalue',
          'dataType': ITable.ColumnDataType.DOUBLE,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        }, {
          'name': 'agg_qty',
          'displayName': 'agg_qty',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        }, {
          'name': 'agg_amt',
          'displayName': 'agg_amt',
          'dataType': ITable.ColumnDataType.DOUBLE,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        }, {
          'name': 'l_alias_gender',
          'displayName': 'l_alias_gender',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': 'age',
          'displayName': 'age',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': 'state',
          'displayName': 'state',
          'dataType': ITable.ColumnDataType.STRING,
          'variableType': ITable.ColumnVariableType.CATEGORICAL,
        }, {
          'name': '__of_subscriber',
          'displayName': '__of_subscriber',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        }, {
          'name': 'avg___daily_calls_received',
          'displayName': 'avg___daily_calls_received',
          'dataType': ITable.ColumnDataType.INTEGER,
          'variableType': ITable.ColumnVariableType.CONTINUOUS,
        },
      ],
      responseColumn: {
        'name': 'repeat_flag',
        'displayName': 'repeat_flag',
        'dataType': ITable.ColumnDataType.INTEGER,
        'variableType': ITable.ColumnVariableType.CONTINUOUS,
      },
      class: ITabularModel.Class.REGRESSION,
      status: IModel.Status.ACTIVE,
      ownerId: 'ownerId1',
      created: '2017-06-02T07:07:25.611Z',
      updated: '2017-06-02T07:13:26.126Z',
      experimentId: 'experiment8',
    },
  ],
  options: {
    indices: ['id'],
  },
};

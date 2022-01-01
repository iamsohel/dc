# Salsa - DeepCortex UI

[![Build Status](https://travis-ci.com/deepcortex/salsa.svg?token=dYQ8y9WVPQU8KZMpENtE&branch=develop)](https://travis-ci.com/deepcortex/salsa)

Big Data, meet Big Science


## Installation and Usage
```
yarn install
yarn start
```


## Demo
<http://demo.dev.deepcortex.ai.s3-website-us-east-1.amazonaws.com/>
login/pass:  
sheng.zhao@sentrana.com / test  


## Development

- to run in "mock backend" mode:
```
yarn run start:mock
```

- to build in "mock backend" mode:
```
yarn run build:mock
```

- to build and deploy changes to dev:
```
yarn build:prod
aws s3 sync dist s3://deepcortex-stage-dcos-apps/static-content/dev --profile deepcortex-dev
```

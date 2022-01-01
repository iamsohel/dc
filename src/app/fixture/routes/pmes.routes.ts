import { IFixturePriceRecord, IFixtureServiceRoute } from '../fixture.interface';

export const pmesRoutes: IFixtureServiceRoute[] = [
  {
    url: 'price-records/$',
    method: 'GET',
    handler: function (this, params) {
      let resultset = this.collections.pricerecords.chain();

      let searchField = 'search';

      if (params['status']) {
        searchField = 'status';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re }; //@TODO ON BACKSLASH INVALID REGULAR EXPRESSION BUG
        resultset = resultset.find(searchObject);
      }
      if (params['customerId']) {
        searchField = 'customerId';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re }; //@TODO ON BACKSLASH INVALID REGULAR EXPRESSION BUG
        resultset = resultset.find(searchObject);
      }
      if (params['productId']) {
        searchField = 'productId';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re };
        resultset = resultset.find(searchObject);
      }
      if (params['regionId']) {
        searchField = 'regionId';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re };
        resultset = resultset.find(searchObject);
      }
      if (params['salesManagerId']) {
        searchField = 'salesManagerId';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re };
        resultset = resultset.find(searchObject);
      }
      if (params['cdId']) {
        searchField = 'cdId';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re };
        resultset = resultset.find(searchObject);
      }
      if (params['gmmId']) {
        searchField = 'gmmId';
        const search = params[searchField];
        let re = new RegExp(search, 'i');
        const searchObject = {};
        searchObject[searchField] = { '$regex': re };
        resultset = resultset.find(searchObject);
      }

      //return this.prepareListResponse(resultset, params, searchField, searchField);
      const count = resultset.count();
      return {
        count: count,
        data: resultset.data(),
      };

      /*if (params['status']) {
        searchField = 'status';
      }
      if (params['lastName']) {
        searchField = 'lastName';
      }
      return this.prepareListResponse(resultset, params, searchField, searchField);*/

    },
  },
  {
    url: 'pmes/([\\w\\-]+)$',
    method: 'GET',
    handler: function (this, params) {
      const id = params[1];
      const models = this.collections.pricerecords;
      const model = models.findOne({ item_id: id });

      if (!model) {
        throw new Error('Model Not found');
      }

      return model;
    },
  },
  {
    url: 'pmes$',
    method: 'POST',
    handler: function (this, params) {
      const models = this.collections.pricerecords;

      const newModel: IFixturePriceRecord = Object.assign(
        {
          id: Date.now().toString(),
          username: null,
          email: null,
          firstName: null,
          lastName: null,
          token: null,
          password: null,

          created: Date.now().toString(),
          updated: Date.now().toString(),
        },
        params,
      );

      return models.insertOne(newModel);
    },
  },
  {
    url: 'pmes/([\\w\\-]+)$',
    method: 'PUT',
    handler: function (this, params) {
      const id = params[1];
      const models = this.collections.pricerecords;
      const model = models.findOne({ item_id: id });
      if (!model) {
        throw new Error('Model Not found');
      }

      // update (specific properties only)
      [
        'salesRepresentative',
        'salesManager',
        'cd',
        'gmm',
        'customer',
        'material',
        'product',
        'portfolioStrategy',
        'region',
        'salesDistrict',
        'exworksDvpPrice',
        'dvpModelPrice',
        'invoiceCurrency',
        'dvpModelPriceInvoiceCurrency',
        'dvpModelPriceInvoiceCurrency',
        'vbpPrice',
        'lastInvoicePrice',
        'lastInvoicePriceCurrency',
        'lastInvoicePriceDate',
        'lastInvoicePriceLocalCurrency',
        'lastValidatedPriceCurrency',
        'currecntSAPPrice',
        'currentSAPPriceValidDate',
      ].forEach((prop) => params[prop] !== undefined && (model[prop] = params[prop]));

      models.update(model);

      return model;
    },
  },
  {
    url: 'pmes/([\\w\\-]+)$',
    method: 'DELETE',
    handler: function (this, params) {
      const id = params[1];
      const models = this.collections.pricerecords;
      const model = models.findOne({ item_id: id });
      if (!model) {
        throw new Error('Model Not found');
      }

      models.remove(model);

      return model;
    },
  },
  {
    url: 'pmes/([\\w\\-]+)/(activate|deactivate)$',
    method: 'POST',
    handler: function (this, params) {
      const id = params[1];
      // const action = params[2];
      const models = this.collections.pricerecords;
      const model = models.findOne({ item_id: id });
      if (!model) {
        throw new Error('Model Not found');
      }

      //model.status = action === 'activate' ? Pmestatus.ACTIVE : Pmestatus.DEACTIVATED;
      models.update(model);

      return model;
    },
  },
];

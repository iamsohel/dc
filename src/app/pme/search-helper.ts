import { FormControl } from '@angular/forms';

import { AppSelectOptionData } from '../core-ui/components/app-select.component';
import { AppFormGroup } from '../utils/forms';

import {
  // generateCsvFilters,
  IPmeSearchParams,
  // ValueSetter,
} from './pme.interfaces';

export enum SearchModes {
  ITEM_ID = 'ITEM_ID',
  STATUS = 'STATUS',
  PRIORITY = 'PRIORITY',
  PRODUCT_TYPE = 'PRODUCT_TYPE',
  RECOORD_TYPE = 'RECOORD_TYPE',
  SALES_REP = 'SALES_REP',
  SALES_MANAGER = 'SALES_MANAGER',
  COMM_DIR = 'COMM_DIR',
  GMM = 'GMM',
  CUSTOMER = 'CUSTOMER',
  CUSTOMER_CODE = 'CUSTOMER_CODE',
  PRODUCT_NAME = 'PRODUCT_NAME',
  MATERIAL_NAME = 'MATERIAL_NAME',
  MATERIAL_CODE = 'MATERIAL_CODE',
  REGION = 'REGION',
  SALES_DISTRICT = 'SALES_DISTRICT',
  UOM = 'UOM',
  INVOICE_CURRENCY = 'INVOICE_CURRENCY',
  LAST_INVOICE_PRICE = 'LAST_INVOICE_PRICE',
  DVP_MODEL_PRICE = 'DVP_MODEL_PRICE',
  LAST_VALIDATED_PRICE = 'LAST_VALIDATED_PRICE',
  REQUESTED_SELLING_PRICE = 'REQUESTED_SELLING_PRICE',
  ANNUALIZED_VOLUME_COMMITMENT = 'ANNUALIZED_VOLUME_COMMITMENT',
  LAST_TWELVE_MONTH_VOLUME = 'LAST_TWELVE_MONTH_VOLUME',
  PRICE_VALID_FROM = 'PRICE_VALID_FROM',
  PRICE_VALID_TO = 'PRICE VALID TO',
  CURRENT_SAP_PRICE_VALIDITY_DATE = 'CURRENT_SAP_PRICE_VALIDITY_DATE',
  PORTFOLIO_STRATEGY = 'PORTFOLIO_STRATEGY',
  EXWORKS_DVP_PRICE = 'EXWORKS_DVP_PRICE',
  DVP_MODEL_PRICE_INVOICE_CURRENCY = 'DVP_MODEL_PRICE_INVOICE_CURRENCY',
  VBP_PRICE = 'VBP_PRICE',
  LAST_INVOICE_PRICE_DATE = 'LAST_INVOICE_PRICE_DATE',
  LAST_INVOICE_PRICE_CURRENCY = 'LAST_INVOICE_PRICE_CURRENCY',
  LAST_VALIDATED_PRICE_CURRENCY = 'LAST_VALIDATED_PRICE_CURRENCY',
  BUSINESS_TYPE = 'BUSINESS_TYPE',
  NBA_COMPANY_NAME = 'NBA_COMPANY_NAME',
  NBA_PRODUCT = 'NBA_PRODUCT',
  RELATIVE_STRENGTH_HUNTSMAN = 'RELATIVE_STRENGTH_HUNTSMAN',
  RELATIVE_STRENGTH_NBA = 'RELATIVE_STRENGTH_NBA',
  NBA_PRICE_CURRENCY = 'NBA_PRICE_CURRENCY',
  NBA_PRICE_PER_KG = 'NBA_PRICE_PER_KG',
  SOURCE_OF_NBA_PRICE = 'SOURCE_OF_NBA_PRICE',
  THIRD_PARTY = 'THIRD_PARTY',
  ADJUSTED_NBA_PRICE_PER_KG = 'ADJUSTED_NBA_PRICE_PER_KG',
  PRODUCT_DIFFERENTIATION = 'PRODUCT_DIFFERENTIATION',
  TOP_VALUE_DRIVERS_DIFFERENTIATION = 'TOP_VALUE_DRIVERS_DIFFERENTIATION',
  OTHER_VALUE_DRIVERS_DIFFERENTIATION = 'OTHER_VALUE_DRIVERS_DIFFERENTIATION',
  SPOT_DEAL = 'SPOT_DEAL',
  PRODUCT_SITE = 'PRODUCT_SITE',
  SALES_ORGANIZATION = 'SALES_ORGANIZATION',
  FREIGHT = 'FREIGHT',
  DUTY_APPLIED = 'DUTY_APPLIED',
  LAST_MILE = 'LAST MILE',
  BUFFER = 'BUFFER',
  COMMISSION = 'COMMISSION',
  REBATE = 'REBATE',
  FIX_RATE = 'FIX_RATE',
  PARTY = 'PARTY',
  FREIGHT_SURCHARGE = 'FREIGHT_SURCHARGE',
  PROFIT_SHARING = 'PROFIT_SHARING',
  SALES_REP_JUSTIFICATION_FOR_LOWER_RSP = 'SALES_REP_JUSTIFICATION_FOR_LOWER_RSP',
  SALES_REP_JUSTIFICATION_FOR_LOWER_VOLUME = 'SALES_REP_JUSTIFICATION_FOR_LOWER_VOLUME',
  TOTAL_PRODUCT_COST = 'TOTAL_PRODUCT_COST',
  SM_THRESHOLD_PRICE = 'SM_THRESHOLD_PRICE',
  REQUESTED_SELLING_PRICE_NM = 'REQUESTED_SELLING_PRICE_NM',
  LAST_TRANSCTION_NM = 'LAST_TRANSCTION_NM',
  LAST_VALIDATED_PRICE_NM = 'LAST_VALIDATED_PRICE_NM',
  CD_THRESHOLD_PRICE = 'CD_THRESHOLD_PRICE',
  LAST_INVOICE_PRICE_LOCAL_CURRENCY = 'LAST_INVOICE_PRICE_LOCAL_CURRENCY',
  SM_THRESHOLD_NM = 'SM_THRESHOLD_NM',
  RSP_CHANGE_VS_LAST_TRANSACTED_PRICE = 'RSP_CHANGE_VS_LAST_TRANSACTED_PRICE',
  RSP_CHANGE_VS_LAST_VALIDATED_PRICE = 'RSP_CHANGE_VS_LAST_VALIDATED_PRICE',
  RSP_VS_ADJUSTED_NBA_PRICE = 'RSP_VS_ADJUSTED_NBA_PRICE',
}

export const SearchModeOptions = AppSelectOptionData.fromList(
  [
    SearchModes.ITEM_ID,
    SearchModes.STATUS,
    SearchModes.PRIORITY,
    SearchModes.PRODUCT_TYPE,
    SearchModes.RECOORD_TYPE,
    SearchModes.SALES_REP,
    SearchModes.SALES_MANAGER,
    SearchModes.COMM_DIR,
    SearchModes.GMM,
    SearchModes.CUSTOMER,
    SearchModes.CUSTOMER_CODE,
    SearchModes.PRODUCT_NAME,
    SearchModes.MATERIAL_CODE,
    SearchModes.MATERIAL_NAME,
    SearchModes.REGION,
    SearchModes.SALES_DISTRICT,
    SearchModes.UOM,
    SearchModes.INVOICE_CURRENCY,
    SearchModes.LAST_INVOICE_PRICE,
    SearchModes.DVP_MODEL_PRICE,
    SearchModes.LAST_VALIDATED_PRICE,
    SearchModes.REQUESTED_SELLING_PRICE,
    SearchModes.ANNUALIZED_VOLUME_COMMITMENT,
    SearchModes.LAST_TWELVE_MONTH_VOLUME,
    SearchModes.PRICE_VALID_FROM,
    SearchModes.PRICE_VALID_TO,
    SearchModes.CURRENT_SAP_PRICE_VALIDITY_DATE,
    SearchModes.PORTFOLIO_STRATEGY,
    SearchModes.EXWORKS_DVP_PRICE,
    SearchModes.DVP_MODEL_PRICE_INVOICE_CURRENCY,
    SearchModes.VBP_PRICE,
    SearchModes.LAST_INVOICE_PRICE_DATE,
    SearchModes.LAST_INVOICE_PRICE_CURRENCY,
    SearchModes.LAST_INVOICE_PRICE_LOCAL_CURRENCY,
    SearchModes.LAST_VALIDATED_PRICE_CURRENCY,
    SearchModes.BUSINESS_TYPE,
    SearchModes.NBA_COMPANY_NAME,
    SearchModes.NBA_PRODUCT,
    SearchModes.RELATIVE_STRENGTH_HUNTSMAN,
    SearchModes.RELATIVE_STRENGTH_NBA,
    SearchModes.NBA_PRICE_CURRENCY,
    SearchModes.NBA_PRICE_PER_KG,
    SearchModes.SOURCE_OF_NBA_PRICE,
    SearchModes.THIRD_PARTY,
    SearchModes.ADJUSTED_NBA_PRICE_PER_KG,
    SearchModes.PRODUCT_DIFFERENTIATION,
    SearchModes.TOP_VALUE_DRIVERS_DIFFERENTIATION,
    SearchModes.OTHER_VALUE_DRIVERS_DIFFERENTIATION,
    SearchModes.SPOT_DEAL,
    SearchModes.PRODUCT_SITE,
    SearchModes.SALES_ORGANIZATION,
    SearchModes.FREIGHT,
    SearchModes.DUTY_APPLIED,
    SearchModes.LAST_MILE,
    SearchModes.BUFFER,
    SearchModes.COMMISSION,
    SearchModes.REBATE,
    SearchModes.FIX_RATE,
    SearchModes.PARTY,
    SearchModes.FREIGHT_SURCHARGE,
    SearchModes.PROFIT_SHARING,
    SearchModes.SALES_REP_JUSTIFICATION_FOR_LOWER_RSP,
    SearchModes.SALES_REP_JUSTIFICATION_FOR_LOWER_VOLUME,
    SearchModes.TOTAL_PRODUCT_COST,
    SearchModes.SM_THRESHOLD_PRICE,
    SearchModes.REQUESTED_SELLING_PRICE_NM,
    SearchModes.LAST_TRANSCTION_NM,
    SearchModes.LAST_VALIDATED_PRICE_NM,
    SearchModes.RSP_CHANGE_VS_LAST_TRANSACTED_PRICE,
    SearchModes.RSP_CHANGE_VS_LAST_VALIDATED_PRICE,
    SearchModes.RSP_VS_ADJUSTED_NBA_PRICE,
    SearchModes.CD_THRESHOLD_PRICE,
  ],
  [
    'ItemId',
    'Status',
    'Priority',
    'Product Type',
    'Record Type',
    'Sales Rep',
    'Sales Manager',
    'Comm Dir',
    'GMM',
    'Customer',
    'Customer Code',
    'Product Name',
    'Material Code',
    'Material Name',
    'Region',
    'Sales District',
    'Uom',
    'Invoice Currency',
    'Last Invoice Price',
    'Dvp Model Price',
    'Last Validated Price',
    'Requested selling price(rsp) in local currency',
    'Annualized Volume Commitment',
    'Last twelve month volume',
    'Price valid from',
    'Price valid to',
    'Current sap price validity date',
    'Portfolio strategy',
    'Exworks dvp price',
    'Dvp model price invoice currency',
    'Vbp price',
    'Last invoice price date',
    'Last invoice price currency',
    'Last invoice price in local currency',
    'Last validated price currency',
    'Business type',
    'Nba company name',
    'Nba product',
    'Relative strength huntsman',
    'Relative strength nba',
    'Nba price currency',
    'Nba price per kg',
    'Source of nba price',
    'Third party',
    'Adjusted nba price per kg',
    'Product differentiation',
    'Top value drivers differentiation',
    'Other value drivers differentiation',
    'Spot deal',
    'Product site',
    'Sales organization',
    'Freight',
    'Duty applied',
    'Last mile',
    'Buffer',
    'Commission',
    'Rebate',
    'Fix rate',
    'Party',
    'Freight surcharge',
    'Profit sharing',
    'Sales rep justification for lower rsp',
    'Sales rep justification for lower volume',
    'Total product cost',
    'Sm threshold price',
    'Requested selling price nm',
    'Last transction nm',
    'Last validated price nm',
    'Rsp change % vs last transacted price',
    'Rsp change % vs last validated price',
    'Rsp vs adjusted nba price',
    'Cd threshold price',
  ],
);

export const SearchForm = new AppFormGroup({
  searchMode: new FormControl(''),
  search_text: new FormControl(''),
  item_id: new FormControl(''),
  gi_status: new FormControl(''),
  priority_of_review: new FormControl(''),
  product_type: new FormControl(''),
  record_type: new FormControl(''),
  customer_name: new FormControl(''),
  gi_product_name: new FormControl(''),
  gi_sales_manager_name: new FormControl(''),
  gi_sales_rep_name: new FormControl(''),
  gi_material_code: new FormControl(''),
  gi_material_name: new FormControl(''),
  gi_customer_code: new FormControl(''),
  gi_commercial_director_name: new FormControl(''),
  gi_gmm_name: new FormControl(''),
  gi_region: new FormControl(''),
  gi_sales_district: new FormControl(''),
  uom: new FormControl(''),
  invoice_currency: new FormControl(''),
  last_invoice_price: new FormControl(''),
  dvp_model_price: new FormControl(''),
  last_validated_price: new FormControl(''),
  requested_selling_price: new FormControl(''),
  annualized_volume_commitment: new FormControl(''),
  last_twelve_months_volume: new FormControl(''),
  price_valid_from: new FormControl(''),
  price_valid_to: new FormControl(''),
  current_sap_price_validity_date: new FormControl(''),
  gi_portfolio_strategy: new FormControl(''),
  gi_exworks_dvp_price: new FormControl(''),
  gi_dvp_model_price_in_invoice_currency: new FormControl(''),
  gi_vbp_price: new FormControl(''),
  gi_last_invoice_price_date: new FormControl(''),
  gi_last_invoice_price_currency: new FormControl(''),
  gi_last_invoice_price_in_local_currency: new FormControl(''),
  gi_last_validated_price_currency: new FormControl(''),
  pdm_business_type: new FormControl(''),
  pdm_nba_company_name: new FormControl(''),
  pdm_nba_product: new FormControl(''),
  pdm_rltv_strength_huntsman: new FormControl(''),
  pdm_rltv_strength_nba: new FormControl(''),
  pdm_nba_price_currency: new FormControl(''),
  pdm_nba_price_per_kg: new FormControl(''),
  pdm_source_of_nba_price: new FormControl(''),
  pdm_third_party: new FormControl(''),
  pdm_adjusted_nba_price_per_kg: new FormControl(''),
  pdm_product_differentiation: new FormControl(''),
  pdm_top_value_drivers_differentiation: new FormControl(''),
  pdm_other_value_drivers_differentiation: new FormControl(''),
  pdm_spot_deal: new FormControl(''),
  ai_product_site: new FormControl(''),
  ai_sales_organization: new FormControl(''),
  ai_freight: new FormControl(''),
  ai_duty_applied: new FormControl(''),
  ai_last_mile: new FormControl(''),
  ai_buffer: new FormControl(''),
  ai_commission: new FormControl(''),
  ai_rebate: new FormControl(''),
  ai_fx_rate: new FormControl(''),
  ai_party: new FormControl(''),
  ai_freight_surcharge: new FormControl(''),
  ai_profit_sharing: new FormControl(''),
  srep_justification_for_lower_rsp: new FormControl(''),
  srep_justification_for_lower_volume: new FormControl(''),
  ai_total_product_cost: new FormControl(''),
  sm_threshold_price: new FormControl(''),
  requested_selling_price_nm: new FormControl(''),
  last_transaction_nm: new FormControl(''),
  last_validated_price_nm: new FormControl(''),
  rsp_change_vs_last_transacted_price: new FormControl(''),
  rsp_change_vs_last_validated_price: new FormControl(''),
  rsp_vs_adjusted_nba_price: new FormControl(''),
  cd_threshold_price: new FormControl(''),
});

export const SearchModeChange = (searchForm: any, _itemsLoader: any) => {
  const controls = searchForm.controls;

  if (controls['item_id'].value) {
    controls['item_id'].reset('');
    _itemsLoader.load();
  }

  if (controls['customer_name'].value) {
    controls['customer_name'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_status'].value) {
    controls['gi_status'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_product_name'].value) {
    controls['gi_product_name'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_sales_manager_name'].value) {
    controls['gi_sales_manager_name'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_sales_rep_name'].value) {
    controls['gi_sales_rep_name'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_material_name'].value) {
    controls['gi_material_name'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_material_code'].value) {
    controls['gi_material_code'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_customer_code'].value) {
    controls['gi_customer_code'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_region'].value) {
    controls['gi_region'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_commercial_director_name'].value) {
    controls['gi_commercial_director_name'].reset('');
    _itemsLoader.load();
  }

  if (controls['gi_sales_district'].value) {
    controls['gi_sales_district'].reset('');
    _itemsLoader.load();
  }

  if (controls['uom'].value) {
    controls['uom'].reset();
    _itemsLoader.load();
  }

  if (controls['invoice_currency'].value) {
    controls['invoice_currency'].reset();
    _itemsLoader.load();
  }
};

export const PrepareRequestParams = (tableViewForm: any, searchForm: any, searchColumnsCsv: any[]): IPmeSearchParams => {
  const pagination = tableViewForm.controls;
  const search = searchForm.controls;

  let params = {};

  // ?search_fields=gi_commercial_director_name&search=Christine Cai&search_fields=customer_name&search=Dong
  // ?search_fields=gi_commercial_director_name&search=Christine Cai&search_fields=customer_name&search=Dong

  if (search['search_text'].value) {
    if (!search['searchMode'].value || search['searchMode'].value.length <= 0) {
      params['search_fields'] = 'customer_name';
      params['search'] = search['search_text'].value;
      searchColumnsCsv.push('customer_name');
    } else {
      search['searchMode'].value.forEach((sField) => {
        if (sField === SearchModes.ITEM_ID) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=item_id&search=' + search['search_text'].value)
            : (params['search_fields'] = 'item_id&search=' + search['search_text'].value);
          searchColumnsCsv.push('item_id');
        }
        if (sField === SearchModes.CUSTOMER) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=customer_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'customer_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('customer_name');
        }
        if (sField === SearchModes.STATUS) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_status&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_status&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_status');
        }
        if (sField === SearchModes.PRIORITY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=priority_of_review&search=' + search['search_text'].value)
            : (params['search_fields'] = 'priority_of_review&search=' + search['search_text'].value);
          searchColumnsCsv.push('priority_of_review');
        }
        if (sField === SearchModes.PRODUCT_TYPE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=product_type&search=' + search['search_text'].value)
            : (params['search_fields'] = 'product_type&search=' + search['search_text'].value);
          searchColumnsCsv.push('product_type');
        }
        if (sField === SearchModes.RECOORD_TYPE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=record_type&search=' + search['search_text'].value)
            : (params['search_fields'] = 'record_type&search=' + search['search_text'].value);
          searchColumnsCsv.push('record_type');
        }
        if (sField === SearchModes.CUSTOMER_CODE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_customer_code&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_customer_code&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_customer_code');
        }
        if (sField === SearchModes.SALES_MANAGER) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_sales_manager_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_sales_manager_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_sales_manager_name');
        }

        if (sField === SearchModes.SALES_REP) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_sales_rep_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_sales_rep_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_sales_rep_name');
        }

        if (sField === SearchModes.PRODUCT_NAME) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_product_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_product_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_product_name');
        }
        if (sField === SearchModes.COMM_DIR) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_commercial_director_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_commercial_director_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_commercial_director_name');
        }
        if (sField === SearchModes.MATERIAL_CODE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_material_code&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_material_code&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_material_code');
        }
        if (sField === SearchModes.MATERIAL_NAME) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_material_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_material_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_material_name');
        }
        if (sField === SearchModes.GMM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_gmm_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_gmm_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_gmm_name');
        }
        if (sField === SearchModes.UOM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=uom&search=' + search['search_text'].value)
            : (params['search_fields'] = 'uom&search=' + search['search_text'].value);
          searchColumnsCsv.push('uom');
        }
        if (sField === SearchModes.SALES_DISTRICT) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_sales_district&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_sales_district&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_sales_district');
        }
        if (sField === SearchModes.REGION) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_region&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_region&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_region');
        }

        if (sField === SearchModes.INVOICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=invoice_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'invoice_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('invoice_currency');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_invoice_price_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_last_invoice_price_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_invoice_price_currency');
        }
        if (sField === SearchModes.DVP_MODEL_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=dvp_model_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'dvp_model_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('dvp_model_price');
        }
        if (sField === SearchModes.LAST_VALIDATED_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=last_validated_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_validated_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_validated_price');
        }
        if (sField === SearchModes.REQUESTED_SELLING_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=requested_selling_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'requested_selling_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('requested_selling_price');
        }
        if (sField === SearchModes.ANNUALIZED_VOLUME_COMMITMENT) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=annualized_volume_commitment&search=' + search['search_text'].value)
            : (params['search_fields'] = 'annualized_volume_commitment&search=' + search['search_text'].value);
          searchColumnsCsv.push('annualized_volume_commitment');
        }
        if (sField === SearchModes.LAST_TWELVE_MONTH_VOLUME) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=last_twelve_months_volume&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_twelve_months_volume&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_twelve_months_volume');
        }
        if (sField === SearchModes.PRICE_VALID_FROM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=price_valid_from&search=' + search['search_text'].value)
            : (params['search_fields'] = 'price_valid_from&search=' + search['search_text'].value);
          searchColumnsCsv.push('price_valid_from');
        }
        if (sField === SearchModes.PRICE_VALID_TO) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=price_valid_to&search=' + search['search_text'].value)
            : (params['search_fields'] = 'price_valid_to&search=' + search['search_text'].value);
          searchColumnsCsv.push('price_valid_to');
        }
        if (sField === SearchModes.CURRENT_SAP_PRICE_VALIDITY_DATE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=current_sap_price_validity_date&search=' + search['search_text'].value)
            : (params['search_fields'] = 'current_sap_price_validity_date&search=' + search['search_text'].value);
          searchColumnsCsv.push('current_sap_price_validity_date');
        }

        if (sField === SearchModes.PORTFOLIO_STRATEGY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_portfolio_strategy&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_portfolio_strategy&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_portfolio_strategy');
        }
        if (sField === SearchModes.EXWORKS_DVP_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_exworks_dvp_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_exworks_dvp_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_exworks_dvp_price');
        }
        if (sField === SearchModes.DVP_MODEL_PRICE_INVOICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_dvp_model_price_in_invoice_currency&search=' + search['search_text'].value)
            : (params['search_fields'] =
                'gi_dvp_model_price_in_invoice_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_dvp_model_price_in_invoice_currency');
        }
        if (sField === SearchModes.VBP_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_vbp_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_vbp_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_vbp_price');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_DATE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_invoice_price_date&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_last_invoice_price_date&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_invoice_price_date');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_LOCAL_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_invoice_price_in_local_currency&search=' + search['search_text'].value)
            : (params['search_fields'] =
                'gi_last_invoice_price_in_local_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_invoice_price_in_local_currency');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_LOCAL_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_validated_price_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_last_validated_price_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_validated_price_currency');
        }
        if (sField === SearchModes.BUSINESS_TYPE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_business_type&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_business_type&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_business_type');
        }
        if (sField === SearchModes.NBA_COMPANY_NAME) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_company_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_company_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_company_name');
        }
        if (sField === SearchModes.NBA_PRODUCT) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_product&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_product&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_product');
        }
        if (sField === SearchModes.RELATIVE_STRENGTH_HUNTSMAN) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_rltv_strength_huntsman&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_rltv_strength_huntsman&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_rltv_strength_huntsman');
        }
        if (sField === SearchModes.RELATIVE_STRENGTH_NBA) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_rltv_strength_nba&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_rltv_strength_nba&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_rltv_strength_nba');
        }
        if (sField === SearchModes.NBA_PRICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_price_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_price_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_price_currency');
        }
        if (sField === SearchModes.NBA_PRICE_PER_KG) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_price_per_kg&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_price_per_kg&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_price_per_kg');
        }
        if (sField === SearchModes.SOURCE_OF_NBA_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_source_of_nba_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_source_of_nba_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_source_of_nba_price');
        }
        if (sField === SearchModes.THIRD_PARTY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_third_party&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_third_party&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_third_party');
        }
        if (sField === SearchModes.ADJUSTED_NBA_PRICE_PER_KG) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_adjusted_nba_price_per_kg&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_adjusted_nba_price_per_kg&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_adjusted_nba_price_per_kg');
        }
        if (sField === SearchModes.PRODUCT_DIFFERENTIATION) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_product_differentiation&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_product_differentiation&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_product_differentiation');
        }
        if (sField === SearchModes.TOP_VALUE_DRIVERS_DIFFERENTIATION) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_top_value_drivers_differentiation&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_top_value_drivers_differentiation&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_top_value_drivers_differentiation');
        }
        if (sField === SearchModes.OTHER_VALUE_DRIVERS_DIFFERENTIATION) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_other_value_drivers_differentiation&search=' + search['search_text'].value)
            : (params['search_fields'] =
                'pdm_other_value_drivers_differentiation&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_other_value_drivers_differentiation');
        }
        if (sField === SearchModes.SPOT_DEAL) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_spot_deal&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_spot_deal&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_spot_deal');
        }
        if (sField === SearchModes.PRODUCT_SITE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_product_site&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_product_site&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_product_site');
        }
        if (sField === SearchModes.SALES_ORGANIZATION) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_sales_organization&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_sales_organization&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_sales_organization');
        }
        if (sField === SearchModes.FREIGHT) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_freight&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_freight&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_freight');
        }
        if (sField === SearchModes.DUTY_APPLIED) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_duty_applied&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_duty_applied&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_duty_applied');
        }
        if (sField === SearchModes.LAST_MILE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_last_mile&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_last_mile&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_last_mile');
        }
        if (sField === SearchModes.BUFFER) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_buffer&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_buffer&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_buffer');
        }
        if (sField === SearchModes.COMMISSION) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_commission&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_commission&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_commission');
        }
        if (sField === SearchModes.REBATE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_rebate&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_rebate&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_rebate');
        }
        if (sField === SearchModes.FIX_RATE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_fx_rate&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_fx_rate&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_fx_rate');
        }
        if (sField === SearchModes.PARTY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_party&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_party&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_party');
        }
        if (sField === SearchModes.FREIGHT_SURCHARGE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_freight_surcharge&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_freight_surcharge&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_freight_surcharge');
        }
        if (sField === SearchModes.PROFIT_SHARING) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_profit_sharing&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_profit_sharing&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_profit_sharing');
        }
        if (sField === SearchModes.SALES_REP_JUSTIFICATION_FOR_LOWER_RSP) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=srep_justification_for_lower_rsp&search=' + search['search_text'].value)
            : (params['search_fields'] = 'srep_justification_for_lower_rsp&search=' + search['search_text'].value);
          searchColumnsCsv.push('srep_justification_for_lower_rsp');
        }
        if (sField === SearchModes.SALES_REP_JUSTIFICATION_FOR_LOWER_VOLUME) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=srep_justification_for_lower_volume&search=' + search['search_text'].value)
            : (params['search_fields'] = 'srep_justification_for_lower_volume&search=' + search['search_text'].value);
          searchColumnsCsv.push('srep_justification_for_lower_volume');
        }
        if (sField === SearchModes.TOTAL_PRODUCT_COST) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_total_product_cost&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_total_product_cost&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_total_product_cost');
        }
        if (sField === SearchModes.SM_THRESHOLD_NM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=sm_threshold_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'sm_threshold_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('sm_threshold_price');
        }
        if (sField === SearchModes.REQUESTED_SELLING_PRICE_NM) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=requested_selling_price_nm&search=' + search['search_text'].value)
            : (params['search_fields'] = 'requested_selling_price_nm&search=' + search['search_text'].value);
          searchColumnsCsv.push('requested_selling_price_nm');
        }
        if (sField === SearchModes.LAST_TRANSCTION_NM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=last_transaction_nm&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_transaction_nm&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_transaction_nm');
        }
        if (sField === SearchModes.LAST_VALIDATED_PRICE_NM) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=last_validated_price_nm&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_validated_price_nm&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_validated_price_nm');
        }
        if (sField === SearchModes.RSP_CHANGE_VS_LAST_TRANSACTED_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=rsp_change_vs_last_transacted_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'rsp_change_vs_last_transacted_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('rsp_change_vs_last_transacted_price');
        }
        if (sField === SearchModes.RSP_CHANGE_VS_LAST_VALIDATED_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=rsp_change_vs_last_validated_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'rsp_change_vs_last_validated_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('rsp_change_vs_last_validated_price');
        }
        if (sField === SearchModes.RSP_VS_ADJUSTED_NBA_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=rsp_vs_adjusted_nba_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'rsp_vs_adjusted_nba_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('rsp_vs_adjusted_nba_price');
        }
        if (sField === SearchModes.CD_THRESHOLD_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=cd_threshold_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'cd_threshold_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('cd_threshold_price');
        }
      });
    }
  }

  return params;
};
export const PrepareRequestParamsStaging = (tableViewForm: any, searchForm: any, searchColumnsCsv: any[]): IPmeSearchParams => {
  const pagination = tableViewForm.controls;
  const search = searchForm.controls;

  let params = {
    offset: (pagination['page'].value - 1) * pagination['page_size'].value,
    limit: pagination['page_size'].value,
    order: pagination['order'].value,
  };

  // ?search_fields=gi_commercial_director_name&search=Christine Cai&search_fields=customer_name&search=Dong
  // ?search_fields=gi_commercial_director_name&search=Christine Cai&search_fields=customer_name&search=Dong

  if (search['search_text'].value) {
    if (!search['searchMode'].value || search['searchMode'].value.length <= 0) {
      params['search_fields'] = 'customer_name';
      params['search'] = search['search_text'].value;
      searchColumnsCsv.push('customer_name');
    } else {
      search['searchMode'].value.forEach((sField) => {
        if (sField === SearchModes.ITEM_ID) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=item_id&search=' + search['search_text'].value)
            : (params['search_fields'] = 'item_id&search=' + search['search_text'].value);
          searchColumnsCsv.push('item_id');
        }
        if (sField === SearchModes.CUSTOMER) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=customer_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'customer_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('customer_name');
        }
        if (sField === SearchModes.STATUS) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_status&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_status&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_status');
        }
        if (sField === SearchModes.PRIORITY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=priority_of_review&search=' + search['search_text'].value)
            : (params['search_fields'] = 'priority_of_review&search=' + search['search_text'].value);
          searchColumnsCsv.push('priority_of_review');
        }
        if (sField === SearchModes.PRODUCT_TYPE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=product_type&search=' + search['search_text'].value)
            : (params['search_fields'] = 'product_type&search=' + search['search_text'].value);
          searchColumnsCsv.push('product_type');
        }
        if (sField === SearchModes.RECOORD_TYPE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=record_type&search=' + search['search_text'].value)
            : (params['search_fields'] = 'record_type&search=' + search['search_text'].value);
          searchColumnsCsv.push('record_type');
        }
        if (sField === SearchModes.CUSTOMER_CODE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_customer_code&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_customer_code&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_customer_code');
        }
        if (sField === SearchModes.SALES_MANAGER) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_sales_manager_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_sales_manager_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_sales_manager_name');
        }

        if (sField === SearchModes.SALES_REP) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_sales_rep_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_sales_rep_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_sales_rep_name');
        }

        if (sField === SearchModes.PRODUCT_NAME) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_product_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_product_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_product_name');
        }
        if (sField === SearchModes.COMM_DIR) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_commercial_director_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_commercial_director_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_commercial_director_name');
        }
        if (sField === SearchModes.MATERIAL_CODE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_material_code&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_material_code&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_material_code');
        }
        if (sField === SearchModes.MATERIAL_NAME) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_material_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_material_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_material_name');
        }
        if (sField === SearchModes.GMM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_gmm_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_gmm_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_gmm_name');
        }
        if (sField === SearchModes.UOM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=uom&search=' + search['search_text'].value)
            : (params['search_fields'] = 'uom&search=' + search['search_text'].value);
          searchColumnsCsv.push('uom');
        }
        if (sField === SearchModes.SALES_DISTRICT) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_sales_district&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_sales_district&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_sales_district');
        }
        if (sField === SearchModes.REGION) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_region&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_region&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_region');
        }

        if (sField === SearchModes.INVOICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=invoice_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'invoice_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('invoice_currency');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_invoice_price_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_last_invoice_price_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_invoice_price_currency');
        }
        if (sField === SearchModes.DVP_MODEL_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=dvp_model_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'dvp_model_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('dvp_model_price');
        }
        if (sField === SearchModes.LAST_VALIDATED_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=last_validated_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_validated_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_validated_price');
        }
        if (sField === SearchModes.REQUESTED_SELLING_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=requested_selling_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'requested_selling_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('requested_selling_price');
        }
        if (sField === SearchModes.ANNUALIZED_VOLUME_COMMITMENT) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=annualized_volume_commitment&search=' + search['search_text'].value)
            : (params['search_fields'] = 'annualized_volume_commitment&search=' + search['search_text'].value);
          searchColumnsCsv.push('annualized_volume_commitment');
        }
        if (sField === SearchModes.LAST_TWELVE_MONTH_VOLUME) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=last_twelve_months_volume&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_twelve_months_volume&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_twelve_months_volume');
        }
        if (sField === SearchModes.PRICE_VALID_FROM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=price_valid_from&search=' + search['search_text'].value)
            : (params['search_fields'] = 'price_valid_from&search=' + search['search_text'].value);
          searchColumnsCsv.push('price_valid_from');
        }
        if (sField === SearchModes.PRICE_VALID_TO) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=price_valid_to&search=' + search['search_text'].value)
            : (params['search_fields'] = 'price_valid_to&search=' + search['search_text'].value);
          searchColumnsCsv.push('price_valid_to');
        }
        if (sField === SearchModes.CURRENT_SAP_PRICE_VALIDITY_DATE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=current_sap_price_validity_date&search=' + search['search_text'].value)
            : (params['search_fields'] = 'current_sap_price_validity_date&search=' + search['search_text'].value);
          searchColumnsCsv.push('current_sap_price_validity_date');
        }

        if (sField === SearchModes.PORTFOLIO_STRATEGY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_portfolio_strategy&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_portfolio_strategy&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_portfolio_strategy');
        }
        if (sField === SearchModes.EXWORKS_DVP_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_exworks_dvp_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_exworks_dvp_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_exworks_dvp_price');
        }
        if (sField === SearchModes.DVP_MODEL_PRICE_INVOICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_dvp_model_price_in_invoice_currency&search=' + search['search_text'].value)
            : (params['search_fields'] =
                'gi_dvp_model_price_in_invoice_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_dvp_model_price_in_invoice_currency');
        }
        if (sField === SearchModes.VBP_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=gi_vbp_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_vbp_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_vbp_price');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_DATE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_invoice_price_date&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_last_invoice_price_date&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_invoice_price_date');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_LOCAL_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_invoice_price_in_local_currency&search=' + search['search_text'].value)
            : (params['search_fields'] =
                'gi_last_invoice_price_in_local_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_invoice_price_in_local_currency');
        }
        if (sField === SearchModes.LAST_INVOICE_PRICE_LOCAL_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=gi_last_validated_price_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'gi_last_validated_price_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('gi_last_validated_price_currency');
        }
        if (sField === SearchModes.BUSINESS_TYPE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_business_type&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_business_type&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_business_type');
        }
        if (sField === SearchModes.NBA_COMPANY_NAME) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_company_name&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_company_name&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_company_name');
        }
        if (sField === SearchModes.NBA_PRODUCT) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_product&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_product&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_product');
        }
        if (sField === SearchModes.RELATIVE_STRENGTH_HUNTSMAN) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_rltv_strength_huntsman&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_rltv_strength_huntsman&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_rltv_strength_huntsman');
        }
        if (sField === SearchModes.RELATIVE_STRENGTH_NBA) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_rltv_strength_nba&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_rltv_strength_nba&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_rltv_strength_nba');
        }
        if (sField === SearchModes.NBA_PRICE_CURRENCY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_price_currency&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_price_currency&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_price_currency');
        }
        if (sField === SearchModes.NBA_PRICE_PER_KG) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_nba_price_per_kg&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_nba_price_per_kg&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_nba_price_per_kg');
        }
        if (sField === SearchModes.SOURCE_OF_NBA_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_source_of_nba_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_source_of_nba_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_source_of_nba_price');
        }
        if (sField === SearchModes.THIRD_PARTY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_third_party&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_third_party&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_third_party');
        }
        if (sField === SearchModes.ADJUSTED_NBA_PRICE_PER_KG) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_adjusted_nba_price_per_kg&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_adjusted_nba_price_per_kg&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_adjusted_nba_price_per_kg');
        }
        if (sField === SearchModes.PRODUCT_DIFFERENTIATION) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_product_differentiation&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_product_differentiation&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_product_differentiation');
        }
        if (sField === SearchModes.TOP_VALUE_DRIVERS_DIFFERENTIATION) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_top_value_drivers_differentiation&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_top_value_drivers_differentiation&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_top_value_drivers_differentiation');
        }
        if (sField === SearchModes.OTHER_VALUE_DRIVERS_DIFFERENTIATION) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=pdm_other_value_drivers_differentiation&search=' + search['search_text'].value)
            : (params['search_fields'] =
                'pdm_other_value_drivers_differentiation&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_other_value_drivers_differentiation');
        }
        if (sField === SearchModes.SPOT_DEAL) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=pdm_spot_deal&search=' + search['search_text'].value)
            : (params['search_fields'] = 'pdm_spot_deal&search=' + search['search_text'].value);
          searchColumnsCsv.push('pdm_spot_deal');
        }
        if (sField === SearchModes.PRODUCT_SITE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_product_site&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_product_site&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_product_site');
        }
        if (sField === SearchModes.SALES_ORGANIZATION) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_sales_organization&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_sales_organization&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_sales_organization');
        }
        if (sField === SearchModes.FREIGHT) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_freight&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_freight&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_freight');
        }
        if (sField === SearchModes.DUTY_APPLIED) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_duty_applied&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_duty_applied&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_duty_applied');
        }
        if (sField === SearchModes.LAST_MILE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_last_mile&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_last_mile&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_last_mile');
        }
        if (sField === SearchModes.BUFFER) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_buffer&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_buffer&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_buffer');
        }
        if (sField === SearchModes.COMMISSION) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_commission&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_commission&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_commission');
        }
        if (sField === SearchModes.REBATE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_rebate&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_rebate&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_rebate');
        }
        if (sField === SearchModes.FIX_RATE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_fx_rate&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_fx_rate&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_fx_rate');
        }
        if (sField === SearchModes.PARTY) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_party&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_party&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_party');
        }
        if (sField === SearchModes.FREIGHT_SURCHARGE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_freight_surcharge&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_freight_surcharge&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_freight_surcharge');
        }
        if (sField === SearchModes.PROFIT_SHARING) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_profit_sharing&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_profit_sharing&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_profit_sharing');
        }
        if (sField === SearchModes.SALES_REP_JUSTIFICATION_FOR_LOWER_RSP) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=srep_justification_for_lower_rsp&search=' + search['search_text'].value)
            : (params['search_fields'] = 'srep_justification_for_lower_rsp&search=' + search['search_text'].value);
          searchColumnsCsv.push('srep_justification_for_lower_rsp');
        }
        if (sField === SearchModes.SALES_REP_JUSTIFICATION_FOR_LOWER_VOLUME) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=srep_justification_for_lower_volume&search=' + search['search_text'].value)
            : (params['search_fields'] = 'srep_justification_for_lower_volume&search=' + search['search_text'].value);
          searchColumnsCsv.push('srep_justification_for_lower_volume');
        }
        if (sField === SearchModes.TOTAL_PRODUCT_COST) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=ai_total_product_cost&search=' + search['search_text'].value)
            : (params['search_fields'] = 'ai_total_product_cost&search=' + search['search_text'].value);
          searchColumnsCsv.push('ai_total_product_cost');
        }
        if (sField === SearchModes.SM_THRESHOLD_NM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=sm_threshold_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'sm_threshold_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('sm_threshold_price');
        }
        if (sField === SearchModes.REQUESTED_SELLING_PRICE_NM) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=requested_selling_price_nm&search=' + search['search_text'].value)
            : (params['search_fields'] = 'requested_selling_price_nm&search=' + search['search_text'].value);
          searchColumnsCsv.push('requested_selling_price_nm');
        }
        if (sField === SearchModes.LAST_TRANSCTION_NM) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=last_transaction_nm&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_transaction_nm&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_transaction_nm');
        }
        if (sField === SearchModes.LAST_VALIDATED_PRICE_NM) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=last_validated_price_nm&search=' + search['search_text'].value)
            : (params['search_fields'] = 'last_validated_price_nm&search=' + search['search_text'].value);
          searchColumnsCsv.push('last_validated_price_nm');
        }
        if (sField === SearchModes.RSP_CHANGE_VS_LAST_TRANSACTED_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=rsp_change_vs_last_transacted_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'rsp_change_vs_last_transacted_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('rsp_change_vs_last_transacted_price');
        }
        if (sField === SearchModes.RSP_CHANGE_VS_LAST_VALIDATED_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=rsp_change_vs_last_validated_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'rsp_change_vs_last_validated_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('rsp_change_vs_last_validated_price');
        }
        if (sField === SearchModes.RSP_VS_ADJUSTED_NBA_PRICE) {
          params['search_fields']
            ? (params['search_fields'] +=
                '&search_fields=rsp_vs_adjusted_nba_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'rsp_vs_adjusted_nba_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('rsp_vs_adjusted_nba_price');
        }
        if (sField === SearchModes.CD_THRESHOLD_PRICE) {
          params['search_fields']
            ? (params['search_fields'] += '&search_fields=cd_threshold_price&search=' + search['search_text'].value)
            : (params['search_fields'] = 'cd_threshold_price&search=' + search['search_text'].value);
          searchColumnsCsv.push('cd_threshold_price');
        }
      });
    }
  }

  return params;
};

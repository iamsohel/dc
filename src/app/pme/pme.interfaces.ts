import config from '../config';
import { TObjectId } from '../core/interfaces/common.interface';

//pme module

export interface IPmeUpdateRequest {
  id: TObjectId;
  created: Date;
  updated: Date;
  priority: IPriceRecord.Priority;
  status: IPriceRecord.Status;
  salesRepresentative: ISalesRepresentative;
  cd: ICd;
  salesManager: ISalesManager;
  gmm: IGmm;
  customer: ICustomer;
  material: IMaterail;
  product: IProduct;
  portfolioStrategy: String;
  region?: String;
  salesDistrict?: String;
  exworksDvpPrice?: Number;
  dvpModelPrice?: Number;
  invoiceCurrency?: String;
  dvpModelPriceInvoiceCurrency?: Number;
  vbpPrice?: Number;
  lastInvoicePrice?: Number;
  lastInvoicePriceCurrency?: String;
  lastInvoicePriceDate?: Date;
  lastInvoicePriceLocalCurrency?: Number;
  currecntSAPPrice?: Number;
  lastValidatedPriceCurrency?: Number;
  currentSAPPriceValidDate?: Date;
}

export namespace IPriceRecord {
  export enum Priority {
    P1 = 'P1',
    P2 = 'P2',
    P3 = 'P3',
    AUTO_EXTENDED = 'AUTO_EXTENDED',
  }
  export enum Status {
    INSERT_REQUESTED_SELLING_PRICE = 'INSERT_REQUESTED_SELLING_PRICE',
    REVIEW_REQUESTED_SELLING_PRICE_CD = 'REVIEW_REQUESTED_SELLING_PRICE_CD',
    REVIEW_REQUESTED_SELLING_PRICE_SM = 'REVIEW_REQUESTED_SELLING_PRICE_SM',
    REVIEW_REQUESTED_SELLING_PRICE_GMM = 'REVIEW_REQUESTED_SELLING_PRICE_GMM',
    REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD = 'REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD',
    REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SM = 'REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SM',
    REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR = 'REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR',
    VALIDATED_PRICE = 'VALIDATED_PRICE',
  }
  export enum SearchModes {
    ALL_RECORDS = 'ALL_RECORDS',
    ASSIGN_TO_ME = 'ASSIGN_TO_ME',
  }
  export enum ProductType {
    VBM = 'VBM',
    MTO = 'MTO',
  }
  export enum RecordType {
    DVP = 'DVP',
    QUOTE = 'QUOTE',
  }
}

export interface ISalesRepresentative {
  id: TObjectId;
  name: string;
  address?: string;
}

export interface ISalesManager {
  id: TObjectId;
  name: string;
  address?: string;
}

export interface ICd {
  id: TObjectId;
  name: string;
  address?: string;
}

export interface IGmm {
  id: TObjectId;
  name: string;
  address?: string;
}

export interface ICustomer {
  id: TObjectId;
  gi_customer_code?: string;
  customer_code?: string;
  customer_name?: string;
  sales_district?: string;
  sales_organization?: string;
  name?: string;
  address?: string;
  code?: String;
}
export interface IMaterail {
  id: TObjectId;
  name: string;
  code?: String;
  type?: String;
  material_name?: string;
  material_code?: string;
}
export interface ISalesDistrict {
  id: TObjectId;
  name: string;
  code?: String;
  type?: String;
}

export interface ISalesOrganization {
  id: TObjectId;
  name: string;
  code?: String;
  type?: String;
}

export interface IUom {
  id: TObjectId;
  name: string;
  code?: String;
  type?: String;
}

export interface ICurrency {
  id: TObjectId;
  name: string;
  code?: String;
  type?: String;
}

export interface IProduct {
  id: TObjectId;
  code?: string;
  name: string;
  type?: string;
}
export interface IRegion {
  id: TObjectId;
  name: string;
}

export interface IPmeSearchParams {
  page?: number;
  page_size?: number;
  order?: string;
  status?: string;
  customer?: string;
}
export interface IReview {
  review_by_role_name?: string;
  review_by?: string;
  updated_at?: Date;
  proposed_rsp?: number;
  review_status?: string;
  reason?: string;
  final_valid_from?: Date;
  final_valid_to?: Date;
  suggested_valid_to?: string;
  suggested_valid_from?: string;
}

export interface IPriceRecordImport {
  name?: string;
}

export interface IQuotation {
  id: TObjectId;
  customer_code?: string;
  materail_code?: string;
  sales_district?: string;
  sales_organization?: string;
  uom?: string;
  currency?: string;
  start_date?: Date;
  commited_volume?: string;
}

export interface ICSVQuotRecord {
  fileName?: string;
  customer_code?: string;
  uom?: string;
  currency?: string;
  sales_organization?: string;
  sales_district?: string;
  materail_code?: string;
  price_validity_start_date?: string;
  quote_type?: string;
  commited_volume?: Number;
  isValid?: boolean;
}

// price records
export interface IPriceRecord {
  item_id: TObjectId;
  parent_id?: Number;
  productType: IPriceRecord.ProductType;
  recordType: IPriceRecord.RecordType;
  customer_name?: String;
  priority_of_review?: IPriceRecord.Priority;
  priority_of_review_value?: IPriceRecord.Priority;
  uom?: String;
  invoice_currency?: String;
  vbm_1_price?: Number;
  vbm_2_price?: Number;
  vbm_3_price?: Number;
  rsp_tier_1?: Number;
  rsp_tier_2?: Number;
  rsp_tier_3?: Number;
  last_invoice_price?: Number;
  dvp_model_price?: Number;
  last_validated_price?: Number;
  last_validated_price_nm?: Number;
  requested_selling_price?: Number;
  requested_selling_price_nm?: Number;
  last_transaction_nm?: Number;
  rsp_change_vs_last_transacted_price?: Number;
  rsp_change_vs_last_validated_price?: Number;
  rsp_vs_adjusted_nba_price?: Number;
  annualized_volume_commitment?: Number;
  last_twelve_months_volume?: String;
  price_valid_from?: Date;
  price_valid_to?: Date;
  final_valid_from?: Date;
  final_valid_to?: Date;
  current_sap_price_validity_date?: Date;

  gi_status?: IPriceRecord.Status;
  gi_status_value?: string;
  gi_sales_rep_name?: String;
  gi_sales_manager_name?: String;
  gi_commercial_director_name?: String;
  gi_gmm_name?: String;
  gi_customer_code?: String;
  gi_material_code?: String;
  gi_material_name?: String;
  gi_product_name?: String;
  gi_portfolio_strategy?: String;
  gi_region?: String;
  gi_sales_district?: String;
  gi_exworks_dvp_price?: Number;
  gi_dvp_model_price_in_invoice_currency?: Number;
  //gi_dvp_model_price_in_invoice_currency: Number;
  gi_vbp_price?: Number;
  gi_last_invoice_price_date?: Date;
  gi_last_invoice_price_currency?: String;
  gi_last_invoice_price_in_local_currency?: Number;
  gi_last_validated_price_currency?: String;

  pdm_business_type?: String;
  pdm_nba_company_name?: String;
  pdm_nba_product?: String;
  pdm_rltv_strength_huntsman?: Number;
  pdm_rltv_strength_nba?: String;
  pdm_nba_price_currency?: String;
  pdm_nba_price_per_kg?: Number;
  pdm_source_of_nba_price?: String;
  pdm_third_party?: String;
  pdm_adjusted_nba_price_per_kg?: Number;
  pdm_product_differentiation?: String;
  pdm_top_value_drivers_differentiation?: String;
  pdm_other_value_drivers_differentiation?: String;
  pdm_spot_deal?: String;

  ai_product_site: String;
  ai_sales_organization: String;
  ai_freight: Number;
  ai_duty_applied: Number;
  ai_last_mile: Number;
  ai_buffer: Number;
  ai_commission: Number;
  ai_rebate: Number;
  ai_fx_rate: Number;
  ai_party: String;
  ai_total_product_cost: Number;
  ai_freight_surcharge: Number;
  ai_profit_sharing: Number;
  assigned_to?: String;

  ti_sm_threshold_nm: Number;
  ti_cd_threshold_nm: Number;

  srep_justification_for_lower_rsp: String;
  srep_justification_for_lower_volume: String;
  sm_threshold_price?: Number;
  cd_threshold_price?: Number;
  is_deleted?: boolean;
  delete_reason?: String;
  c4c_price_record_url?: any;
  review_validations?: IReview[];
}

export interface IQuotationRecord {
  quote_id: TObjectId;
  request_date: Date;
  requester_code?: string;
  requester: string;
  status: string;
  customer_code: string;
  customer_name?: string;
  material_code?: string;
  material_name?: string;
  uom?: string;
  currency?: string;
  sales_organization?: string;
  sales_district?: string;
  price_validity_start_date?: Date;
  commited_volume?: number;
  quote_type?: string;
}

export interface ColDef {
  headerName?: string;
  field?: string;
  width?: number;
  checkboxSelection?: any;
  headerCheckboxSelection?: boolean;
  headerCheckboxSelectionFilteredOnly?: boolean;
  pinned?: string;
  cellStyle?: any;
  cellRenderer?: any;
  headerTooltip?: any;
  tooltipField?: any;
  hide?: boolean;
  valueFormatter?: any;
  menuTabs?: any;
  suppressColumnsToolPanel?: boolean;
  lockVisible?: boolean;
  lockPosition?: boolean;
  editable?: any;
  valueSetter?: any;
  cellEditor?: any;
  cellEditorParams?: any;
  valueGetter?: any;
}
export interface LocalCol {
  data: any;
}

export function CellStyleDefineForType(params) {
  return `<div style="width: 50%; max-width:100px; margin: auto;border-radius: 10px; text-align: center; line-height: normal;padding: 2px; font-size: x-small; color: white;margin-top: 3px; background-color: ${
    params.value === config.pmeitem.productType.labels.MTO
      ? '#48C248'
      : params.value === config.pmeitem.productType.labels.VBM
      ? '#0DCAF0'
      : params.value === config.pmeitem.recordType.labels.DVP
      ? '#6C757D'
      : params.value === config.pmeitem.recordType.labels.QUOTE
      ? '#198754'
      : null
  }; display: ${params.value === null ? 'none' : ''} " > ${params.value} </div>`;
}

export function CellStyleDefineForStatus(params) {
  return `<div style="width: 110%; max-width:200px; margin: auto;border-radius: 10px; text-align: center; line-height: normal;padding: 2px; font-size: x-small; color: white;margin-top: 3px; background-color: ${
    params.value === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_SM ||
    params.value === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_GMM ||
    params.value === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_CD
      ? '#F8A748'
      : params.value === config.pmeitem.status.labels.INSERT_REQUESTED_SELLING_PRICE
      ? '#17A2B8'
      : params.value === config.pmeitem.status.labels.VALIDATED_PRICE
      ? '#39B54A'
      : params.value === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_CD ||
        params.value === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SM ||
        params.value === config.pmeitem.status.labels.REVIEW_REQUESTED_SELLING_PRICE_REJECTED_SR
      ? '#DC3545'
      : null
  }; display: ${params.value === null ? 'none' : ''} " > ${params.value} </div>`;
}

export function CellStyleDefineForPriority(params) {
  return `<div style="width: ${
    params.value === config.pmeitem.priority.labels.AUTO_EXTENDED ? '100%' : '50%'
  }; max-width:100px; margin: auto;border-radius: 10px; text-align: center; line-height: normal;padding: 2px; font-size: x-small;;margin-top: 3px; color: ${
    params.value === IPriceRecord.Priority.P1
      ? '#DC3545'
      : params.value === IPriceRecord.Priority.P2
      ? '#F7931E'
      : params.value === IPriceRecord.Priority.P3
      ? '#39B54A'
      : params.value === config.pmeitem.priority.labels.AUTO_EXTENDED
      ? '#F0AD4E'
      : null
  }; border: ${
    params.value === IPriceRecord.Priority.P1
      ? '1px solid #DC3545'
      : params.value === IPriceRecord.Priority.P2
      ? '1px solid #F7931E'
      : params.value === IPriceRecord.Priority.P3
      ? '1px solid #39B54A'
      : params.value === config.pmeitem.priority.labels.AUTO_EXTENDED
      ? '1px solid #F0AD4E'
      : null
  }; display: ${params.value === null ? 'none' : ''} " > ${params.value} </div>`;
}

export function ValueSetter(params) {
  let newValInt = parseFloat(params.newValue);
  // let valueChanged = params.data.requested_selling_price !== newValInt;

  if (params.colDef.field === 'requested_selling_price') {
    params.data.requested_selling_price = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'annualized_volume_commitment') {
    params.data.annualized_volume_commitment = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'pdm_rltv_strength_huntsman') {
    params.data.pdm_rltv_strength_huntsman =
      newValInt.toString() !== 'NaN' ? parseInt(newValInt.toString()) : params.oldValue;
  } else if (params.colDef.field === 'pdm_nba_price_per_kg') {
    params.data.pdm_nba_price_per_kg = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'pdm_adjusted_nba_price_per_kg') {
    params.data.pdm_adjusted_nba_price_per_kg = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'ai_freight_surcharge') {
    params.data.ai_freight_surcharge = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'ai_freight') {
    params.data.ai_freight = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'ai_duty_applied') {
    params.data.ai_duty_applied = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'ai_last_mile') {
    params.data.ai_last_mile = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'ai_commission') {
    params.data.ai_commission = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  } else if (params.colDef.field === 'ai_rebate') {
    params.data.ai_rebate = newValInt.toString() !== 'NaN' ? newValInt : params.oldValue;
  }
  return newValInt.toString() === 'NaN' ? false : true;
}

export function CellStyleDefineForQuotationStatus(params) {
  return `<div style="width: 80%; max-width:150px; margin: auto;border-radius: 10px; text-align: center; line-height: normal;padding: 2px; font-size: x-small; color: white;margin-top: 3px; background-color: ${
    params.value === 'Completed'
      ? '#39B54A'
      : params.value === 'Submitted'
      ? '#F7931E'
      : params.value === 'Failed'
      ? '#DC3545'
      : null
  }; display: ${params.value === null ? 'none' : ''} " > ${params.value} </div>`;
}

export function CellStyleDefineForQuotationFile(params) {
  // to do
  // add link to download file
  return params.value === null || params.value === '' ? 'none' : params.value;

}

export function generateCsvFilters(ccc) {
  let filtersForDownloadCSV = {
    item_id: null,
    product_type: null,
    record_type: null,
    priority_of_review: null,
    gi_status: null,
    customer_name: null,
    gi_product_name: null,
    gi_material_code: null,
    gi_material_name: null,
    gi_region: null,
    gi_sales_district: null,
    uom: null,
    invoice_currency: null,
    last_invoice_price: null,
    dvp_model_price: null,
    last_validated_price: null,
    requested_selling_price: null,
    annualized_volume_commitment: null,
    last_twelve_months_volume: null,
    price_valid_from: null,
    price_valid_to: null,
    current_sap_price_validity_date: null,
    gi_customer_code: null,
    gi_portfolio_strategy: null,
    gi_exworks_dvp_price: null,
    gi_dvp_model_price_in_invoice_currency: null,
    gi_vbp_price: null,
    gi_last_invoice_price_date: null,
    gi_last_invoice_price_currency: null,
    gi_last_invoice_price_in_local_currency: null,
    gi_last_validated_price_currency: null,
    pdm_business_type: null,
    pdm_nba_company_name: null,
    pdm_nba_product: null,
    pdm_rltv_strength_huntsman: null,
    pdm_rltv_strength_nba: null,
    pdm_nba_price_currency: null,
    pdm_nba_price_per_kg: null,
    pdm_source_of_nba_price: null,
    pdm_third_party: null,
    pdm_adjusted_nba_price_per_kg: null,
    pdm_product_differentiation: null,
    pdm_top_value_drivers_differentiation: null,
    pdm_other_value_drivers_differentiation: null,
    pdm_spot_deal: null,
    ai_product_site: null,
    ai_sales_organization: null,
    ai_freight: null,
    ai_duty_applied: null,
    ai_last_mile: null,
    ai_buffer: null,
    ai_commission: null,
    ai_rebate: null,
    ai_fx_rate: null,
    ai_party: null,
    ai_freight_surcharge: null,
    ai_profit_sharing: null,
    srep_justification_for_lower_rsp: null,
    srep_justification_for_lower_volume: null,
    gi_sales_rep_name: null,
    gi_sales_manager_name: null,
    gi_gmm_name: null,
    gi_commercial_director_name: null,
    ai_total_product_cost: null,
    sm_threshold_price: null,
    requested_selling_price_nm: null,
    last_transaction_nm: null,
    last_validated_price_nm: null,
    rsp_change_vs_last_transacted_price: null,
    rsp_change_vs_last_validated_price: null,
    rsp_vs_adjusted_nba_price: null,
    cd_threshold_price: null,
  };

  if (ccc) {
    if (ccc.item_id && ccc.item_id.values.length) {
      let value = [];
      ccc.item_id.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.item_id = value;
    }
    if (ccc.priority_of_review && ccc.priority_of_review.values.length) {
      let value = [];
      ccc.priority_of_review.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.priority_of_review = value;
    }
    if (ccc.product_type && ccc.product_type.values.length) {
      let value = [];
      ccc.product_type.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.product_type = value;
    }
    if (ccc.record_type && ccc.record_type.values.length) {
      let value = [];
      ccc.record_type.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.record_type = value;
    }
    if (ccc.gi_status && ccc.gi_status.values.length) {
      let value = [];
      ccc.gi_status.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_status = value;
    }
    if (ccc.customer_name && ccc.customer_name.values.length) {
      let value = [];
      ccc.customer_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.customer_name = value;
    }
    if (ccc.gi_product_name && ccc.gi_product_name.values.length) {
      let value = [];
      ccc.gi_product_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_product_name = value;
    }
    if (ccc.gi_material_code && ccc.gi_material_code.values.length) {
      let value = [];
      ccc.gi_material_code.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_material_code = value;
    }
    if (ccc.gi_material_name && ccc.gi_material_name.values.length) {
      let value = [];
      ccc.gi_material_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_material_name = value;
    }
    if (ccc.gi_region && ccc.gi_region.values.length) {
      let value = [];
      ccc.gi_region.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_region = value;
    }
    if (ccc.gi_sales_district && ccc.gi_sales_district.values.length) {
      let value = [];
      ccc.gi_sales_district.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_sales_district = value;
    }
    if (ccc.uom && ccc.uom.values.length) {
      let value = [];
      ccc.uom.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.uom = value;
    }
    if (ccc.invoice_currency && ccc.invoice_currency.values.length) {
      let value = [];
      ccc.invoice_currency.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.invoice_currency = value;
    }
    if (ccc.last_invoice_price && ccc.last_invoice_price.values.length) {
      let value = [];
      ccc.last_invoice_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.last_invoice_price = value;
    }
    if (ccc.dvp_model_price && ccc.dvp_model_price.values.length) {
      let value = [];
      ccc.dvp_model_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.dvp_model_price = value;
    }
    if (ccc.last_validated_price && ccc.last_validated_price.values.length) {
      let value = [];
      ccc.last_validated_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.last_validated_price = value;
    }
    if (ccc.requested_selling_price && ccc.requested_selling_price.values.length) {
      let value = [];
      ccc.requested_selling_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.requested_selling_price = value;
    }
    if (ccc.annualized_volume_commitment && ccc.annualized_volume_commitment.values.length) {
      let value = [];
      ccc.annualized_volume_commitment.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.annualized_volume_commitment = value;
    }
    if (ccc.last_twelve_months_volume && ccc.last_twelve_months_volume.values.length) {
      let value = [];
      ccc.last_twelve_months_volume.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.last_twelve_months_volume = value;
    }
    if (ccc.price_valid_from && ccc.price_valid_from.values.length) {
      let value = [];
      ccc.price_valid_from.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.price_valid_from = value;
    }
    if (ccc.price_valid_to && ccc.price_valid_to.values.length) {
      let value = [];
      ccc.price_valid_to.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.price_valid_to = value;
    }
    if (ccc.current_sap_price_validity_date && ccc.current_sap_price_validity_date.values.length) {
      let value = [];
      ccc.current_sap_price_validity_date.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.current_sap_price_validity_date = value;
    }
    if (ccc.gi_customer_code && ccc.gi_customer_code.values.length) {
      let value = [];
      ccc.gi_customer_code.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_customer_code = value;
    }
    if (ccc.gi_portfolio_strategy && ccc.gi_portfolio_strategy.values.length) {
      let value = [];
      ccc.gi_portfolio_strategy.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_portfolio_strategy = value;
    }
    if (ccc.gi_exworks_dvp_price && ccc.gi_exworks_dvp_price.values.length) {
      let value = [];
      ccc.gi_exworks_dvp_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_exworks_dvp_price = value;
    }
    if (ccc.gi_dvp_model_price_in_invoice_currency && ccc.gi_dvp_model_price_in_invoice_currency.values.length) {
      let value = [];
      ccc.gi_dvp_model_price_in_invoice_currency.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_dvp_model_price_in_invoice_currency = value;
    }
    if (ccc.gi_vbp_price && ccc.gi_vbp_price.values.length) {
      let value = [];
      ccc.gi_vbp_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_vbp_price = value;
    }
    if (ccc.gi_last_invoice_price_date && ccc.gi_last_invoice_price_date.values.length) {
      let value = [];
      ccc.gi_last_invoice_price_date.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_last_invoice_price_date = value;
    }
    if (ccc.gi_last_invoice_price_currency && ccc.gi_last_invoice_price_currency.values.length) {
      let value = [];
      ccc.gi_last_invoice_price_currency.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_last_invoice_price_currency = value;
    }
    if (ccc.gi_last_invoice_price_in_local_currency && ccc.gi_last_invoice_price_in_local_currency.values.length) {
      let value = [];
      ccc.gi_last_invoice_price_in_local_currency.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_last_invoice_price_in_local_currency = value;
    }
    if (ccc.gi_last_validated_price_currency && ccc.gi_last_validated_price_currency.values.length) {
      let value = [];
      ccc.gi_last_validated_price_currency.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_last_validated_price_currency = value;
    }
    if (ccc.pdm_business_type && ccc.pdm_business_type.values.length) {
      let value = [];
      ccc.pdm_business_type.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_business_type = value;
    }
    if (ccc.pdm_nba_company_name && ccc.pdm_nba_company_name.values.length) {
      let value = [];
      ccc.pdm_nba_company_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_nba_company_name = value;
    }
    if (ccc.pdm_nba_product && ccc.pdm_nba_product.values.length) {
      let value = [];
      ccc.pdm_nba_product.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_nba_product = value;
    }
    if (ccc.pdm_rltv_strength_huntsman && ccc.pdm_rltv_strength_huntsman.values.length) {
      let value = [];
      ccc.pdm_rltv_strength_huntsman.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_rltv_strength_huntsman = value;
    }
    if (ccc.pdm_rltv_strength_nba && ccc.pdm_rltv_strength_nba.values.length) {
      let value = [];
      ccc.pdm_rltv_strength_nba.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_rltv_strength_nba = value;
    }
    if (ccc.pdm_nba_price_currency && ccc.pdm_nba_price_currency.values.length) {
      let value = [];
      ccc.pdm_nba_price_currency.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_nba_price_currency = value;
    }
    if (ccc.pdm_nba_price_per_kg && ccc.pdm_nba_price_per_kg.values.length) {
      let value = [];
      ccc.pdm_nba_price_per_kg.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_nba_price_per_kg = value;
    }
    if (ccc.pdm_source_of_nba_price && ccc.pdm_source_of_nba_price.values.length) {
      let value = [];
      ccc.pdm_source_of_nba_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_source_of_nba_price = value;
    }
    if (ccc.pdm_third_party && ccc.pdm_third_party.values.length) {
      let value = [];
      ccc.pdm_third_party.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_third_party = value;
    }
    if (ccc.pdm_adjusted_nba_price_per_kg && ccc.pdm_adjusted_nba_price_per_kg.values.length) {
      let value = [];
      ccc.pdm_adjusted_nba_price_per_kg.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_adjusted_nba_price_per_kg = value;
    }
    if (ccc.pdm_product_differentiation && ccc.pdm_product_differentiation.values.length) {
      let value = [];
      ccc.pdm_product_differentiation.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_product_differentiation = value;
    }
    if (ccc.pdm_top_value_drivers_differentiation && ccc.pdm_top_value_drivers_differentiation.values.length) {
      let value = [];
      ccc.pdm_top_value_drivers_differentiation.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_top_value_drivers_differentiation = value;
    }
    if (ccc.pdm_other_value_drivers_differentiation && ccc.pdm_other_value_drivers_differentiation.values.length) {
      let value = [];
      ccc.pdm_other_value_drivers_differentiation.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_other_value_drivers_differentiation = value;
    }
    if (ccc.pdm_spot_deal && ccc.pdm_spot_deal.values.length) {
      let value = [];
      ccc.pdm_spot_deal.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.pdm_spot_deal = value;
    }
    if (ccc.ai_product_site && ccc.ai_product_site.values.length) {
      let value = [];
      ccc.ai_product_site.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_product_site = value;
    }
    if (ccc.ai_sales_organization && ccc.ai_sales_organization.values.length) {
      let value = [];
      ccc.ai_sales_organization.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_sales_organization = value;
    }
    if (ccc.ai_freight && ccc.ai_freight.values.length) {
      let value = [];
      ccc.ai_freight.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_freight = value;
    }
    if (ccc.ai_duty_applied && ccc.ai_duty_applied.values.length) {
      let value = [];
      ccc.ai_duty_applied.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_duty_applied = value;
    }
    if (ccc.ai_last_mile && ccc.ai_last_mile.values.length) {
      let value = [];
      ccc.ai_last_mile.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_last_mile = value;
    }
    if (ccc.ai_buffer && ccc.ai_buffer.values.length) {
      let value = [];
      ccc.ai_buffer.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_buffer = value;
    }
    if (ccc.ai_commission && ccc.ai_commission.values.length) {
      let value = [];
      ccc.ai_commission.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_commission = value;
    }
    if (ccc.ai_rebate && ccc.ai_rebate.values.length) {
      let value = [];
      ccc.ai_rebate.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_rebate = value;
    }
    if (ccc.ai_fx_rate && ccc.ai_fx_rate.values.length) {
      let value = [];
      ccc.ai_fx_rate.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_fx_rate = value;
    }
    if (ccc.ai_party && ccc.ai_party.values.length) {
      let value = [];
      ccc.ai_party.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_party = value;
    }
    if (ccc.ai_freight_surcharge && ccc.ai_freight_surcharge.values.length) {
      let value = [];
      ccc.ai_freight_surcharge.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_freight_surcharge = value;
    }
    if (ccc.ai_profit_sharing && ccc.ai_profit_sharing.values.length) {
      let value = [];
      ccc.ai_profit_sharing.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_profit_sharing = value;
    }
    if (ccc.srep_justification_for_lower_rsp && ccc.srep_justification_for_lower_rsp.values.length) {
      let value = [];
      ccc.srep_justification_for_lower_rsp.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.srep_justification_for_lower_rsp = value;
    }
    if (ccc.srep_justification_for_lower_volume && ccc.srep_justification_for_lower_volume.values.length) {
      let value = [];
      ccc.srep_justification_for_lower_volume.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.srep_justification_for_lower_volume = value;
    }
    if (ccc.gi_sales_rep_name && ccc.gi_sales_rep_name.values.length) {
      let value = [];
      ccc.gi_sales_rep_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_sales_rep_name = value;
    }
    if (ccc.gi_sales_manager_name && ccc.gi_sales_manager_name.values.length) {
      let value = [];
      ccc.gi_sales_manager_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_sales_manager_name = value;
    }
    if (ccc.gi_gmm_name && ccc.gi_gmm_name.values.length) {
      let value = [];
      ccc.gi_gmm_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_gmm_name = value;
    }
    if (ccc.gi_commercial_director_name && ccc.gi_commercial_director_name.values.length) {
      let value = [];
      ccc.gi_commercial_director_name.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.gi_commercial_director_name = value;
    }
    if (ccc.ai_total_product_cost && ccc.ai_total_product_cost.values.length) {
      let value = [];
      ccc.ai_total_product_cost.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.ai_total_product_cost = value;
    }
    if (ccc.sm_threshold_price && ccc.sm_threshold_price.values.length) {
      let value = [];
      ccc.sm_threshold_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.sm_threshold_price = value;
    }
    if (ccc.requested_selling_price_nm && ccc.requested_selling_price_nm.values.length) {
      let value = [];
      ccc.requested_selling_price_nm.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.requested_selling_price_nm = value;
    }
    if (ccc.last_transaction_nm && ccc.last_transaction_nm.values.length) {
      let value = [];
      ccc.last_transaction_nm.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.last_transaction_nm = value;
    }
    if (ccc.last_validated_price_nm && ccc.last_validated_price_nm.values.length) {
      let value = [];
      ccc.last_validated_price_nm.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.last_validated_price_nm = value;
    }
    if (ccc.rsp_change_vs_last_transacted_price && ccc.rsp_change_vs_last_transacted_price.values.length) {
      let value = [];
      ccc.rsp_change_vs_last_transacted_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.rsp_change_vs_last_transacted_price = value;
    }
    if (ccc.rsp_change_vs_last_validated_price && ccc.rsp_change_vs_last_validated_price.values.length) {
      let value = [];
      ccc.rsp_change_vs_last_validated_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.rsp_change_vs_last_validated_price = value;
    }
    if (ccc.rsp_vs_adjusted_nba_price && ccc.rsp_vs_adjusted_nba_price.values.length) {
      let value = [];
      ccc.rsp_vs_adjusted_nba_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.rsp_vs_adjusted_nba_price = value;
    }
    if (ccc.cd_threshold_price && ccc.cd_threshold_price.values.length) {
      let value = [];
      ccc.cd_threshold_price.values.map((data) => {
        value.push(data);
      });
      filtersForDownloadCSV.cd_threshold_price = value;
    }
  }
  return filtersForDownloadCSV;
}

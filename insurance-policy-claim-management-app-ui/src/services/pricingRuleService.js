import axiosInstance from "../api/axiosInstance";

/**
 * Create a new pricing rule for a plan.
 * @param {Object} payload 
 * @param {number} payload.planId
 * @param {number} payload.baseRiskRate
 * @param {number} payload.processingFee
 * @param {number} payload.gst
 * @param {string} payload.effectiveFrom
 * @param {string} payload.effectiveTo
 * @param {string} payload.remarks
 * @returns {Promise<Object>}
 */
export const createPricingRule = async (payload) => {
  const response = await axiosInstance.post(`/admin/pricing-rules`, payload);
  return response;
};

/**
 * Preview premium calculation for an inactive rule.
 */
export const previewPricingRule = async (payload) => {
  const response = await axiosInstance.post(`/admin/pricing-rules/preview`, payload);
  return response;
};

/**
 * Activate a pricing rule.
 */
export const activatePricingRule = async (ruleId) => {
  const response = await axiosInstance.patch(`/admin/pricing-rules/${ruleId}/activate`);
  return response;
};

/**
 * Deactivate a pricing rule.
 */
export const deactivatePricingRule = async (ruleId) => {
  const response = await axiosInstance.patch(`/admin/pricing-rules/${ruleId}/deactivate`);
  return response;
};

/**
 * Get all pricing rules for a specific plan
 */
export const getAllPricingRulesForPlan = async (planId) => {
  const response = await axiosInstance.get(`/admin/pricing-rules?planId=${planId}`);
  return response;
};

/**
 * Get active pricing rule for a specific plan
 */
export const getActivePricingRuleForPlan = async (planId) => {
  const response = await axiosInstance.get(`/admin/pricing-rules/plan/${planId}/active`);
  return response;
};

export const getPricingRuleHistory = async (ruleId) => {
  const response = await axiosInstance.get(`/admin/pricing-rules/${ruleId}/history`);
  return response;
};

/**
 * Delete a pricing rule (only INACTIVE rules can be deleted).
 */
export const deletePricingRule = async (ruleId) => {
  const response = await axiosInstance.delete(`/admin/pricing-rules/${ruleId}`);
  return response;
};

import axiosInstance from "../api/axiosInstance";


export const getAllPlansPaginated = async (params = {}) => {
  const response = await axiosInstance.get("/plans/page", { params });
  return response;
};

export const getPlanById = async (planId) => {
  const response = await axiosInstance.get(`/plans/${planId}`);
  return response;
};


export const getAllPlans = async () => {
  const response = await axiosInstance.get("/plans/active");
  return response;
};

export const createPlan = async (payload) => {
  const response = await axiosInstance.post('/plans/wizard', payload);
  return response;
};

export const updatePlan = async (planId, payload) => {
  const response = await axiosInstance.put(`/plans/${planId}`, payload);
  return response;
};

export const activatePlan = async (planId) => {
  const response = await axiosInstance.patch(`/plans/${planId}/activate`);
  return response;
};

export const deactivatePlan = async (planId) => {
  const response = await axiosInstance.patch(`/plans/${planId}/deactivate`);
  return response;
};

/**
 * Regenerate coverage options for a plan based on min/max/increment.
 * Creates new coverage tiers and replaces existing ones.
 */
export const regenerateCoverageOptions = async (planId, payload) => {
  const response = await axiosInstance.post(`/admin/policy-plans/${planId}/coverage-options/regenerate`, payload);
  return response;
};

/**
 * Update an existing pricing rule by rule ID.
 */
export const updatePricingRule = async (ruleId, payload) => {
  const response = await axiosInstance.put(`/admin/pricing-rules/${ruleId}`, payload);
  return response;
};



   export const getActivePlans = async () => {
  const response = await axiosInstance.get(
    `/plans/active`
  );

  return response;
};

 export const getPlansByProduct = async (productId) => {
  const response = await axiosInstance.get(
    `/plans/${productId}/active`
  );

  return response;
 };

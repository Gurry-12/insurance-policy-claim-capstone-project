import axiosInstance from "../api/axiosInstance";

/**
 * Create a single coverage option for a specific plan.
 */
export const createCoverageOption = async (planId, payload) => {
  const response = await axiosInstance.post(`/admin/policy-plans/${planId}/coverage-options`, payload);
  return response;
};

/**
 * Configure or bulk generate coverage options for a specific plan.
 */
export const configureCoverageOptions = async (planId, payload) => {
  const response = await axiosInstance.post(`/admin/policy-plans/${planId}/coverage-options`, payload);
  return response;
};

/**
 * Fetch all coverage options for a specific plan. (Admin)
 * Fixed: was incorrectly calling /policy-plans/ (missing /admin/)
 */
export const getCoverageOptions = async (planId) => {
  const response = await axiosInstance.get(`/admin/policy-plans/${planId}/coverage-options`);
  return response;
};

/**
 * Update a coverage option.
 */
export const updateCoverageOption = async (planId, optionId, payload) => {
  const response = await axiosInstance.put(`/admin/policy-plans/${planId}/coverage-options/${optionId}`, payload);
  return response;
};

/**
 * Activate a coverage option.
 */
export const activateCoverageOption = async (planId, optionId) => {
  const response = await axiosInstance.patch(`/admin/policy-plans/${planId}/coverage-options/${optionId}/activate`);
  return response;
};

/**
 * Deactivate a coverage option.
 */
export const deactivateCoverageOption = async (planId, optionId) => {
  const response = await axiosInstance.patch(`/admin/policy-plans/${planId}/coverage-options/${optionId}/deactivate`);
  return response;
};

/**
 * Permanently delete a coverage option.
 */
export const deleteCoverageOption = async (planId, optionId) => {
  const response = await axiosInstance.delete(`/admin/policy-plans/${planId}/coverage-options/${optionId}`);
  return response;
};

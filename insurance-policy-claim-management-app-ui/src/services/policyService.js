import axiosInstance from "../api/axiosInstance";


export const getMyPolicies = async (params = {}) => {
  const response = await axiosInstance.get("/policies/my-policies", { params });
  return response;
};

export const getAllPoliciesPaginated = async (params = {}) => {
  const response = await axiosInstance.get("/policies", { params });
  return response;
};

// export const getAllPolicies = async () => {
//   const response = await axiosInstance.get('/policies');
//   return safeExtractArray(response);
// };

export const getPolicyById = async (policyId) => {
  const response = await axiosInstance.get(`/policies/${policyId}`);
  return response;
};


export const getPoliciesByCustomerId = async (customerId) => {
  const response = await axiosInstance.get(`/policies/customer/${customerId}`);
  return response.data;
};


export const getClaimsByPolicy = async (policyId) => {
  const response = await axiosInstance.get(`/policies/${policyId}/claims`);
  return response;
};

export const issuePolicy = async (payload) => {
  const response = await axiosInstance.post("/policies/issue", payload);
  return response;
};

export const cancelPolicy = async (policyId) => {
  const response = await axiosInstance.patch(`/policies/${policyId}/cancel`);
  return response;
};

export const purchasePolicy = async (payload) => {
  const response = await axiosInstance.post("/policies/purchase", payload);
  return response;
};
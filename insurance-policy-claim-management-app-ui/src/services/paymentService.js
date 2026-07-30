
import axiosInstance from "../api/axiosInstance";


export const getAllPaymentsPaginated = async (params = {}) => {
  const response = await axiosInstance.get("/payments/page", { params });
  return response;
};


export const recordPayment = async (paymentData) => {
  const response = await axiosInstance.post(
    "/payments",
    paymentData
  );
  return response;
};

export const getMyPayments = async () => {
  const response = await axiosInstance.get(
    "/payments/my-payments"
  );
  return response;
};

export const getPaymentsByMyPolicy = async (policyId) => {
  const response = await axiosInstance.get(
    `/payments/my-policies/${policyId}`
  );
  return response;
};


export const getPaymentsByPolicyId = async (policyId) => {
  const response = await axiosInstance.get(`/payments/policy/${policyId}`);
  return response;
};


// removed duplicated pagination API

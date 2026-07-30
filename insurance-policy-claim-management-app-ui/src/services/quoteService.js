import axiosInstance from "../api/axiosInstance";

/**
 * Generate a premium quote (customer self-service).
 * The customer is derived from the logged-in user's JWT.
 */
export const generateQuote = async (payload) => {
  const response = await axiosInstance.post("/premium/calculate", payload);
  return response;
};

/**
 * Generate a premium quote as admin/staff.
 * Requires customerId in the body (for issuing policies to specific customers).
 */
export const generateQuoteAsAdmin = async (payload) => {
  const response = await axiosInstance.post("/premium/admin/calculate", payload);
  return response;
};

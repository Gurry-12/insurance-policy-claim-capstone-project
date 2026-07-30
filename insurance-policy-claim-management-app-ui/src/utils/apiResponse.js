/**
 * Centralized API Response Adapter
 * Abstracts the structure of the API response envelope (ApiResponseDTO)
 * so components don't tightly couple to .data, .message, etc.
 */

export const extractData = (response) => {
  if (!response) return null;
  if (response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const extractList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.content)) return response.data.content;
  if (Array.isArray(response.content)) return response.content;
  return [];
};

export const extractMessage = (response, fallback = "Operation successful") => {
  return response?.message || response?.data?.message || fallback;
};

export const extractSuccess = (response) => {
  if (response?.success !== undefined) return response.success;
  if (response?.data?.success !== undefined) return response.data.success;
  return true;
};

export const extractErrorMessage = (error, fallback = "An unexpected error occurred") => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.data?.message) return error.data.message;
  if (error?.message) return error.message;
  return fallback;
};

export const extractValidationErrors = (error) => {
  const responseData = error?.response?.data || error?.data;
  return responseData?.fieldErrors || responseData?.messages || null;
};

/**
 * Centralized API Adapter for Insurance Policy Claim Management System
 * 
 * This adapter ensures the frontend strictly complies with the Backend API Contract.
 * It standardizes the extraction of `data`, `message`, `success`, and `fieldErrors`
 * so individual services do not have to manually parse `response.data.data`.
 */

export const parseSuccessResponse = (response) => {
  const payload = response.data; // This is the ApiResponseDTO
  
  // If it's a paginated response (PageResponseDTO)
  if (payload?.data && typeof payload.data === 'object' && 'content' in payload.data && 'pageNumber' in payload.data) {
    return {
      success: payload.success,
      message: payload.message,
      data: payload.data.content, // Extract the actual array
      pagination: {
        pageNumber: payload.data.pageNumber,
        pageSize: payload.data.pageSize,
        totalRecords: payload.data.totalRecords || payload.data.totalElements,
        totalPages: payload.data.totalPages,
        lastPage: payload.data.lastPage,
        sortingType: payload.data.sortingType,
      },
      timeStamp: payload.timeStamp,
      // BACKWARD COMPATIBILITY: so components doing res.content still work
      content: payload.data.content,
      totalElements: payload.data.totalElements || payload.data.totalRecords,
      totalRecords: payload.data.totalRecords || payload.data.totalElements,
      totalPages: payload.data.totalPages,
      pageNumber: payload.data.pageNumber,
    };
  }

  // Standard ApiResponseDTO<T>
  const responseData = payload?.data ?? payload;
  
  if (Array.isArray(responseData)) {
    const arr = [...responseData];
    arr.success = payload?.success ?? true;
    arr.message = payload?.message || "Operation successful";
    arr.data = arr; // For new components using response.data
    arr.timeStamp = payload?.timeStamp || new Date().toISOString();
    return arr;
  }

  const result = {
    success: payload?.success ?? true,
    message: payload?.message || "Operation successful",
    data: responseData,
    timeStamp: payload?.timeStamp || new Date().toISOString()
  };

  // BACKWARD COMPATIBILITY: Attach properties of single object directly
  if (responseData && typeof responseData === 'object') {
    Object.assign(result, responseData);
  }

  return result;
};

export const parseErrorResponse = (error) => {
  const payload = error.response?.data; // ErrorResponseDTO or ValidationErrorResponseDTO
  
  if (payload) {
    return {
      success: payload.success || false,
      message: payload.message || "An unexpected error occurred",
      errorType: payload.errorType,
      statusCode: payload.statusCode || error.response?.status,
      fieldErrors: payload.fieldErrors || null,
      timeStamp: payload.timeStamp
    };
  }

  // Fallback for network errors or unhandled exceptions
  return {
    success: false,
    message: error.message || "Network Error",
    errorType: "NETWORK_ERROR",
    statusCode: error.response?.status || 500,
    fieldErrors: null,
    timeStamp: new Date().toISOString()
  };
};

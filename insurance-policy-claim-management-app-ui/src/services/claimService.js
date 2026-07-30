import axiosInstance from "../api/axiosInstance";


export const getAllClaimsPaginated = async (params = {}, config = {}) => {
  const response = await axiosInstance.get("/claims", { params, ...config });
  return response;
};


export const getClaimById = async (claimId) => {
  const response = await axiosInstance.get(`/claims/${claimId}`);
  return response;
};


export const approveClaim = async (claimId, payload) => {
  const response = await axiosInstance.patch(`/claims/${claimId}/final-decision`, {
    recommendedStatus: "APPROVED",
    remarks: payload.remarks
  });
  return response;
};

export const rejectClaim = async (claimId, remarks) => {
  const response = await axiosInstance.patch(`/claims/${claimId}/final-decision`, {
    recommendedStatus: "REJECTED",
    remarks: remarks
  });
  return response;
};

export const raiseClaim = async (formData) => {
  const response = await axiosInstance.post(
    "/claims/raise",
    formData
  );

  return response;
};

export const getMyClaims = async () => {
  const response = await axiosInstance.get(
    "/claims/my-claims"
  );

  return response;
};

export const getClaimHistory = async (claimId) => {
  const response = await axiosInstance.get(
    `/claims/${claimId}/history`
  );

  return response;
};

export const uploadDocuments = async (
  claimId,
  files
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosInstance.post(
    `/document/upload/${claimId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response;
};


export const reviewClaim = async (claimId, reviewData) => {
  const response = await axiosInstance.patch(
    `/claims/${claimId}/review`,
    reviewData
  );

  return response;
};

export const markUnderReview = async (claimId) => {
  const response = await axiosInstance.patch(`/claims/${claimId}/under-review`);
  return response;
};

export const assignClaim = async (claimId) => {
  const response = await axiosInstance.patch(`/claims/${claimId}/assign`);
  return response;
};

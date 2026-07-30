import axiosInstance from "../api/axiosInstance";

/**
 * Upload supporting documents for a claim.
 * @param {number} claimId - The claim ID to attach documents to
 * @param {File[]} files - Array of File objects to upload
 * @returns {Promise<Object>} - List of uploaded ClaimDocumentResponseDTO
 * @role CUSTOMER only
 */
export const uploadClaimDocuments = async (claimId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await axiosInstance.post(
    `/document/upload/${claimId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response;
};

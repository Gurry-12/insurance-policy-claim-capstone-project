package com.insurance.demo.service;

import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.ClaimDocumentResponseDTO;
import com.insurance.demo.model.ClaimDocument;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface ClaimDocumentService {

	 List<ClaimDocumentResponseDTO> addDocumentsToClaim(Long claimId, List<MultipartFile> files) throws IOException;
    
    ApiResponseDTO<List<ClaimDocumentResponseDTO>> uploadDocuments(
            Long claimId,
            List<MultipartFile> files)
            throws IOException;

}
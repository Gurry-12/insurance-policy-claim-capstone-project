package com.insurance.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.ClaimDocumentResponseDTO;
import com.insurance.demo.service.ClaimDocumentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/document")
@AllArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "9. Claim Document API", description = "Endpoints for handling supporting documents for insurance claims")
public class ClaimDocumentController {

	private final ClaimDocumentService claimDocumentService;

	@PreAuthorize("hasRole('CUSTOMER')")
	@PostMapping(value = "/upload/{claimId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "Upload Claim Documents", description = "Uploads multiple supporting document files (e.g., images, PDFs) for a specific claim.")
	public ApiResponseDTO<List<ClaimDocumentResponseDTO>> uploadDocument(@PathVariable("claimId") Long claimId,
			@RequestParam("files") List<MultipartFile> files) throws IOException {

		return claimDocumentService.uploadDocuments(claimId, files);

	}
}

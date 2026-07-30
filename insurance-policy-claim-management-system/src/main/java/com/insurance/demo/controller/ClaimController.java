package com.insurance.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.insurance.demo.dto.request.ClaimRequestDTO;
import com.insurance.demo.dto.request.ClaimReviewRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.ClaimHistoryResponseDTO;
import com.insurance.demo.dto.response.ClaimResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.service.ClaimDocumentService;
import com.insurance.demo.service.ClaimService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "8. Insurance Claim API", description = "Endpoints for filing claims, reviewing, and tracking claim status")
public class ClaimController {

	private final ClaimService claimService;

	@PostMapping(value = "/raise", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('CUSTOMER')")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Submit a New Claim", description = "Allows a customer to file a claim against one of their active policies.")
	public ApiResponseDTO<ClaimResponseDTO> raiseClaim(@Valid @RequestPart("claim") ClaimRequestDTO dto,
			@RequestPart("files") List<MultipartFile> files) throws IOException {
		return claimService.raiseClaim(dto, files);
	}

	@GetMapping("/my-claims")
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Get My Claims", description = "Retrieves all claims filed by the currently logged-in customer.")
	public ApiResponseDTO<List<ClaimResponseDTO>> getMyClaims() {
		return claimService.getMyClaims();
	}

	// INTERNAL STAFF & ADMIN ENDPOINTS

	@GetMapping
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get All Claims", description = "Retrieves a paginated list of all claims with filtering by policy, status, and dates.")
	public ApiResponseDTO<PageResponseDTO<ClaimResponseDTO>> getAllClaims(@RequestParam(defaultValue = "0") int pageNumber,
			@RequestParam(defaultValue = "10") int pageSize, @RequestParam(defaultValue = "createdDate") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection, @RequestParam(required = false) Long customerId,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) Double minClaimAmount,
			@RequestParam(required = false) Double maxClaimAmount) {

		return claimService.getAllClaimsWithPagination(pageNumber, pageSize, sortBy, sortDirection, customerId, status, minClaimAmount, maxClaimAmount);
	}

	@GetMapping("/{claimId}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "Get Claim by ID", description = "Retrieves the full details of a specific insurance claim.")
	public ApiResponseDTO<ClaimResponseDTO> getClaimById(@PathVariable Long claimId) {
		return claimService.getClaimById(claimId);
	}

	@GetMapping("/{claimId}/history")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "Get Claim Status History", description = "Retrieves the complete audit trail/history of status changes for a specific claim.")
	public ApiResponseDTO<PageResponseDTO<ClaimHistoryResponseDTO>> getClaimHistory(@PathVariable Long claimId,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy, @RequestParam(defaultValue = "desc") String sortDirection,
			@RequestParam(required = false) String updatedBy, @RequestParam(required = false) String status) {
		return claimService.getClaimHistory(claimId, pageNumber, pageSize, sortBy, sortDirection, updatedBy, status);
	}

	// INTERNAL STAFF ENDPOINTS

	@PatchMapping("/{claimId}/under-review")
	@PreAuthorize("hasRole('INTERNAL_STAFF')")
	@Operation(summary = "Move Claim to Under Review", description = "Updates a SUBMITTED claim's status to UNDER_REVIEW so it can be evaluated by an Internal Staff.")
	public ApiResponseDTO<ClaimResponseDTO> underReviewClaim(@PathVariable Long claimId) {
		return claimService.underReviewClaim(claimId);
	}

	@PatchMapping("/{claimId}/assign")
	@PreAuthorize("hasRole('INTERNAL_STAFF')")
	@Operation(summary = "Assign Claim to Self", description = "Allows an Internal Staff to assign an UNDER_REVIEW claim to themselves.")
	public ApiResponseDTO<ClaimResponseDTO> assignStaff(@PathVariable Long claimId) {
		return claimService.assignStaff(claimId);
	}

	@PatchMapping("/{claimId}/review")
	@PreAuthorize("hasRole('INTERNAL_STAFF')")

	@Operation(summary = "Recommend Claim Status (Internal Staff)", description = "Allows Internal Staff to review a claim and recommend it for Approval or Rejection.")
	public ApiResponseDTO<ClaimResponseDTO> reviewClaim(@PathVariable Long claimId,
			@Valid @RequestBody ClaimReviewRequestDTO dto) {

		return claimService.reviewClaim(claimId, dto);
	}

	// ADMIN ENDPOINTS

	@PreAuthorize("hasRole('ADMIN')")
	@PatchMapping("/{claimId}/final-decision")
	@Operation(summary = "Finalize Claim Decision (Admin)", description = "Allows an Admin to make the final decision (Approve/Reject) on a staff-recommended claim.")
	public ApiResponseDTO<ClaimResponseDTO> finalDecision(@PathVariable Long claimId,
			@Valid @RequestBody ClaimReviewRequestDTO dto) {

		return claimService.finalDecision(claimId, dto);
	}

}
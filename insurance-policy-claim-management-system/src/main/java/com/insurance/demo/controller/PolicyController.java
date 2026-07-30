package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.PolicyIssueRequestDTO;
import com.insurance.demo.dto.request.PolicyPurchaseRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.ClaimResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PolicyResponseDTO;
import com.insurance.demo.service.ClaimService;
import com.insurance.demo.service.PolicyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "6. Insurance Policy API", description = "Endpoints for purchasing, issuing, and managing customer policies")
public class PolicyController {

	private final PolicyService policyService;
	private final ClaimService claimService;

	@PostMapping("/purchase")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Purchase Policy", description = "Allows a customer to purchase an active policy plan using a Quote. The policy will be created in PENDING_PAYMENT status.")
	public ApiResponseDTO<PolicyResponseDTO> purchasePolicy(@Valid @RequestBody PolicyPurchaseRequestDTO requestDTO) {

		return policyService.purchasePolicy(requestDTO);
	}

	@PostMapping("/issue")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Issue Policy", description = "Manually issues a policy to a customer. Restricted to Admin/Internal Staff.")
	public ApiResponseDTO<PolicyResponseDTO> issuePolicy(@Valid @RequestBody PolicyIssueRequestDTO requestDTO) {

		return policyService.issuePolicy(requestDTO);
	}

	@GetMapping("/my-policies")
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Get Policy of loged in customer", description = "Retrieves the details of a loged in customer's purchased policy.")
	public ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getMyPolicies(Authentication authentication,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection) {

		return policyService.getCustomerPolicies(authentication.getName(), pageNumber, pageSize, sortBy, sortDirection);
	}

	@GetMapping("/customer/{customerId}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get Policy by customer ID", description = "Retrieves the details of a specific customer's purchased policy.")
	public ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getPoliciesByCustomer(@PathVariable Long customerId,
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection) {

		return policyService.getPoliciesByCustomer(customerId, pageNumber, pageSize, sortBy, sortDirection);
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get All Policies", description = "Retrieves a paginated list of all policies. Supports filtering by customer ID, plan ID, and status.")
	public ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getAllPolicies(@RequestParam(defaultValue = "0") int pageNumber,
			@RequestParam(defaultValue = "10") int pageSize, @RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "desc") String sortDirection,
			@RequestParam(required = false) Long customerId,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String policyNumber) {

		return policyService.getAllPolicies(pageNumber, pageSize, sortBy, sortDirection, customerId, status, policyNumber);
	}

	@GetMapping("/{policyId}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "Get Policy by ID", description = "Retrieves the details of a specific purchased policy.")
	public ApiResponseDTO<PolicyResponseDTO> getPolicyById(@PathVariable Long policyId) {
		return policyService.getPolicyById(policyId);
	}

	@GetMapping("/{policyId}/claims")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "Get claims by Policy ID", description = "Retrieves all claims associated with a specific policy.")
	public ApiResponseDTO<List<ClaimResponseDTO>> getClaimsByPolicy(@PathVariable Long policyId) {
		return claimService.getClaimsByPolicyId(policyId);
	}

	@PatchMapping("/{policyId}/cancel")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Cancel Policy", description = "Cancels an active or pending insurance policy.")
	public ApiResponseDTO<PolicyResponseDTO> cancelPolicy(@PathVariable Long policyId) {

		return policyService.cancelPolicy(policyId);
	}
}
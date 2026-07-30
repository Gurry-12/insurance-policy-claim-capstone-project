package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.PaymentRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PaymentResponseDTO;
import com.insurance.demo.service.PremiumPaymentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "7. Premium Payment API", description = "Endpoints for processing and tracking policy premium payments")
public class PremiumPaymentController {

	private final PremiumPaymentService paymentService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('CUSTOMER', 'INTERNAL_STAFF')")
	@Operation(summary = "Record Premium Payment", description = "Records a successful premium payment for an active policy. Automatically activates PENDING policies.")
	public ApiResponseDTO<PaymentResponseDTO> makePayment(@Valid @RequestBody PaymentRequestDTO dto) {
		return paymentService.recordPayment(dto);
	}

	@GetMapping("/policy/{id}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get Payments for Policy", description = "Retrieves all payment records associated with a specific policy.")
	public ApiResponseDTO<List<PaymentResponseDTO>> getPaymentsByPolicy(@PathVariable Long id) {
		return paymentService.getPaymentsByPolicy(id);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
	@Operation(summary = "Get Payment by ID", description = "Retrieves the details of a specific premium payment transaction.")
	public ApiResponseDTO<PaymentResponseDTO> getPaymentById(@PathVariable(name = "id") Long paymentId) {
		return paymentService.getPaymentById(paymentId);
	}

	@GetMapping("/page")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	@Operation(summary = "Get All Payments", description = "Retrieves a paginated list of all system payments with optional filtering by policy ID and payment status.")
	public ApiResponseDTO<PageResponseDTO<PaymentResponseDTO>> getAllPaymentsWithPagination(
			@RequestParam(defaultValue = "0") int pageNumber, @RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy, @RequestParam(defaultValue = "asc") String sortDirection,
			@RequestParam(required = false) Long policyId,
			@RequestParam(required = false) String paymentStatus,
			@RequestParam(required = false) String transactionId,
			@RequestParam(required = false) Double minAmount,
			@RequestParam(required = false) Double maxAmount) {
		return paymentService.getAllPaymentsWithPagination(pageNumber, pageSize, sortBy, sortDirection, policyId,
				paymentStatus, transactionId, minAmount, maxAmount);
	}

	@GetMapping("/my-payments")
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Get My Payment History", description = "Retrieves the payment history of the logged-in customer.")
	public ApiResponseDTO<List<PaymentResponseDTO>> getMyPayments() {
		return paymentService.getMyPayments();
	}

	@GetMapping("/my-policies/{policyId}")
	@PreAuthorize("hasRole('CUSTOMER')")
	@Operation(summary = "Get Payments for Policy", description = "Retrieves all payment records associated with a specific policy.")
	public ApiResponseDTO<List<PaymentResponseDTO>> getPaymentsByMyPolicy(@PathVariable Long policyId) {
		return paymentService.getPaymentsByMyPolicy(policyId);
	}
}

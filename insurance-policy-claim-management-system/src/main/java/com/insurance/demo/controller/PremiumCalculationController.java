package com.insurance.demo.controller;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.AdminPremiumCalculationRequest;
import com.insurance.demo.dto.PremiumCalculationRequest;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.service.PremiumCalculationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/premium")
public class PremiumCalculationController {

	@Autowired
	private PremiumCalculationService calculationService;

	@PostMapping("/calculate")
	@PreAuthorize("hasRole('CUSTOMER')")
	public ResponseEntity<ApiResponseDTO<PremiumQuote>> generateQuote(@Valid @RequestBody PremiumCalculationRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String username = auth.getName();
		
		PremiumQuote quote = calculationService.generateQuote(request, username);
		
		ApiResponseDTO<PremiumQuote> response = new ApiResponseDTO<>(
				"Quote generated successfully",
				true,
				quote,
				LocalDateTime.now()
		);
		
		return ResponseEntity.ok(response);
	}

	@PostMapping("/admin/calculate")
	@PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
	public ResponseEntity<ApiResponseDTO<PremiumQuote>> generateQuoteAsAdmin(
			@Valid @RequestBody AdminPremiumCalculationRequest request) {

		PremiumQuote quote = calculationService.generateQuoteForCustomer(
				request.getCustomerId(),
				request.getPlanId(),
				request.getCoverageAmount(),
				request.getDuration(),
				request.getPremiumType());

		ApiResponseDTO<PremiumQuote> response = new ApiResponseDTO<>(
				"Quote generated successfully",
				true,
				quote,
				LocalDateTime.now());

		return ResponseEntity.ok(response);
	}
}

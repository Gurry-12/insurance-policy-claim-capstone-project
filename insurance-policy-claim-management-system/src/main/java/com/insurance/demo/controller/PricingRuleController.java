package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.PricingPreviewRequestDTO;
import com.insurance.demo.dto.request.PricingRuleRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PricingRuleResponseDTO;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.model.PricingAuditLog;
import com.insurance.demo.service.PricingRuleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/pricing-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PricingRuleController {

	private final PricingRuleService pricingRuleService;

	@PostMapping
	public ResponseEntity<ApiResponseDTO<PricingRuleResponseDTO>> createPricingRule(
			@Valid @RequestBody PricingRuleRequestDTO dto) {
		ApiResponseDTO<PricingRuleResponseDTO> response = pricingRuleService.createPricingRule(dto);
		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@PutMapping("/{ruleId}")
	public ResponseEntity<ApiResponseDTO<PricingRuleResponseDTO>> updatePricingRule(
			@PathVariable Long ruleId,
			@Valid @RequestBody PricingRuleRequestDTO dto) {
		ApiResponseDTO<PricingRuleResponseDTO> response = pricingRuleService.updatePricingRule(ruleId, dto);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{ruleId}")
	public ResponseEntity<ApiResponseDTO<PricingRuleResponseDTO>> getPricingRule(@PathVariable Long ruleId) {
		ApiResponseDTO<PricingRuleResponseDTO> response = pricingRuleService.getPricingRule(ruleId);
		return ResponseEntity.ok(response);
	}

	@GetMapping
	public ResponseEntity<ApiResponseDTO<PageResponseDTO<PricingRuleResponseDTO>>> listPricingRules(
			@RequestParam(required = false) Long planId,
			@RequestParam(required = false) String status,
			@RequestParam(defaultValue = "0") int pageNumber,
			@RequestParam(defaultValue = "10") int pageSize,
			@RequestParam(defaultValue = "id") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection) {

		ApiResponseDTO<PageResponseDTO<PricingRuleResponseDTO>> response = pricingRuleService.listPricingRules(
				planId, status, pageNumber, pageSize, sortBy, sortDirection);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/{ruleId}/activate")
	public ResponseEntity<ApiResponseDTO<PricingRuleResponseDTO>> activatePricingRule(@PathVariable Long ruleId) {
		ApiResponseDTO<PricingRuleResponseDTO> response = pricingRuleService.activatePricingRule(ruleId);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/{ruleId}/deactivate")
	public ResponseEntity<ApiResponseDTO<PricingRuleResponseDTO>> deactivatePricingRule(@PathVariable Long ruleId) {
		ApiResponseDTO<PricingRuleResponseDTO> response = pricingRuleService.deactivatePricingRule(ruleId);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/{ruleId}")
	public ResponseEntity<ApiResponseDTO<Void>> deletePricingRule(@PathVariable Long ruleId) {
		ApiResponseDTO<Void> response = pricingRuleService.deletePricingRule(ruleId);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{ruleId}/history")
	public ResponseEntity<ApiResponseDTO<List<PricingAuditLog>>> getPricingRuleHistory(@PathVariable Long ruleId) {
		ApiResponseDTO<List<PricingAuditLog>> response = pricingRuleService.getPricingRuleHistory(ruleId);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/plan/{planId}/active")
	public ResponseEntity<ApiResponseDTO<PricingRuleResponseDTO>> getActiveRuleForPlan(@PathVariable Long planId) {
		ApiResponseDTO<PricingRuleResponseDTO> response = pricingRuleService.getActiveRuleForPlan(planId);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/preview")
	public ResponseEntity<ApiResponseDTO<PremiumQuote>> previewPremium(
			@Valid @RequestBody PricingPreviewRequestDTO dto) {
		ApiResponseDTO<PremiumQuote> response = pricingRuleService.previewPremium(dto);
		return ResponseEntity.ok(response);
	}
}

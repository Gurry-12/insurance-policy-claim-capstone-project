package com.insurance.demo.service;

import java.util.List;

import com.insurance.demo.dto.request.PricingPreviewRequestDTO;
import com.insurance.demo.dto.request.PricingRuleRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PricingRuleResponseDTO;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.model.PricingAuditLog;

public interface PricingRuleService {

	ApiResponseDTO<PricingRuleResponseDTO> createPricingRule(PricingRuleRequestDTO dto);

	ApiResponseDTO<PricingRuleResponseDTO> updatePricingRule(Long ruleId, PricingRuleRequestDTO dto);

	ApiResponseDTO<PricingRuleResponseDTO> getPricingRule(Long ruleId);

	ApiResponseDTO<PageResponseDTO<PricingRuleResponseDTO>> listPricingRules(Long planId, String status,
			int pageNumber, int pageSize, String sortBy, String sortDirection);

	ApiResponseDTO<PricingRuleResponseDTO> activatePricingRule(Long ruleId);

	ApiResponseDTO<PricingRuleResponseDTO> deactivatePricingRule(Long ruleId);

	ApiResponseDTO<Void> deletePricingRule(Long ruleId);

	ApiResponseDTO<List<PricingAuditLog>> getPricingRuleHistory(Long ruleId);

	ApiResponseDTO<PricingRuleResponseDTO> getActiveRuleForPlan(Long planId);

	ApiResponseDTO<PremiumQuote> previewPremium(PricingPreviewRequestDTO dto);
}


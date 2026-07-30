package com.insurance.demo.service;

import java.util.List;

import com.insurance.demo.dto.request.PlanRequestDTO;
import com.insurance.demo.dto.request.PlanWizardRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PlanResponseDTO;
import com.insurance.demo.dto.response.PlanWizardResponseDTO;

public interface PolicyPlanService {

    ApiResponseDTO<PlanWizardResponseDTO> createPolicyPlan(PlanWizardRequestDTO planRequestDTO);

    ApiResponseDTO<PlanResponseDTO> updatePolicyPlan(Long planId, PlanRequestDTO planRequestDTO);

    ApiResponseDTO<PlanResponseDTO> deactivatePolicyPlan(Long planId);

    ApiResponseDTO<PlanResponseDTO> activatePolicyPlan(Long planId);

    ApiResponseDTO<List<PlanResponseDTO>> viewActivePlans();

    ApiResponseDTO<List<PlanResponseDTO>> viewActivePlansUnderInsuranceProduct(Long productId);

    ApiResponseDTO<PageResponseDTO<PlanResponseDTO>> getAllPlansWithPagination(int pageNumber, int pageSize, String sortBy, String sortDirection, Long productId, Boolean isActive, String planName, Double minCoverageAmount, Double maxCoverageAmount, Double minPremiumAmount, Double maxPremiumAmount);

	ApiResponseDTO<PlanResponseDTO> getPlanById(Long planId);
}
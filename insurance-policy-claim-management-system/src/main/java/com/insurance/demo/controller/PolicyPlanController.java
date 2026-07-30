package com.insurance.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.dto.request.PlanRequestDTO;
import com.insurance.demo.dto.request.PlanWizardRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PlanResponseDTO;
import com.insurance.demo.dto.response.PlanWizardResponseDTO;
import com.insurance.demo.service.PolicyPlanService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "5. Policy Plan API", description = "Endpoints for managing specific insurance plans linked to products")
public class PolicyPlanController {

    private final PolicyPlanService policyPlanService;

    //  ADMIN ONLY 

    @PostMapping("/wizard")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create Policy Plan", description = "Creates a new plan with defined premiums and coverage under an insurance product. Restricted to Admin.")
    public ApiResponseDTO<PlanWizardResponseDTO> createPolicyPlan(@Valid @RequestBody PlanWizardRequestDTO dto) {
        return policyPlanService.createPolicyPlan(dto);
    }

    @PutMapping("/{planId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Policy Plan", description = "Updates an existing policy plan's details.")
    public ApiResponseDTO<PlanResponseDTO> updatePolicyPlan(
            @PathVariable Long planId,
            @Valid @RequestBody PlanRequestDTO dto) {
        return policyPlanService.updatePolicyPlan(planId, dto);
    }

    @PatchMapping("/{planId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate Plan", description = "Marks a policy plan as inactive so it cannot be purchased.")
    public ApiResponseDTO<PlanResponseDTO> deactivatePolicyPlan(@PathVariable Long planId) {
        return policyPlanService.deactivatePolicyPlan(planId);
    }

    @PatchMapping("/{planId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate Plan", description = "Reactivates an inactive policy plan.")
    public ApiResponseDTO<PlanResponseDTO> activatePolicyPlan(@PathVariable Long planId) {
        return policyPlanService.activatePolicyPlan(planId);
    }

    //  PUBLIC / ALL ROLES 

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
    @Operation(summary = "View All Active Plans", description = "Retrieves all currently active policy plans.")
    public ApiResponseDTO<List<PlanResponseDTO>> getAllActivePlans() {
        return policyPlanService.viewActivePlans();
    }

    @GetMapping("/{productId}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
    @Operation(summary = "View Active Plans by Product", description = "Retrieves all active plans associated with a specific insurance product.")
    public ApiResponseDTO<List<PlanResponseDTO>> getActivePlansByProduct(@PathVariable Long productId) {
        return policyPlanService.viewActivePlansUnderInsuranceProduct(productId);
    }

    // PAGINATION (Admin/Internal Staff) 

    @GetMapping("/page")
    @PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF')")
    @Operation(summary = "Get All Plans (Paginated)", description = "Retrieves a paginated list of plans with optional filtering by product ID and active status.")
    public ApiResponseDTO<PageResponseDTO<PlanResponseDTO>> getAllPlansWithPagination(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String planName,
            @RequestParam(required = false) Double minCoverageAmount,
            @RequestParam(required = false) Double maxCoverageAmount,
            @RequestParam(required = false) Double minPremiumAmount,
            @RequestParam(required = false) Double maxPremiumAmount) {

        return policyPlanService.getAllPlansWithPagination(pageNumber, pageSize, sortBy, sortDirection, productId, isActive, planName, minCoverageAmount, maxCoverageAmount, minPremiumAmount, maxPremiumAmount);
    }

    @GetMapping("/{planId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INTERNAL_STAFF', 'CUSTOMER')")
    @Operation(summary = "Get Plan by ID", description = "Retrieves the details of a specific policy plan by its ID.")
    public ApiResponseDTO<PlanResponseDTO> getPlanById(@PathVariable Long planId) {
        return policyPlanService.getPlanById(planId); 
    }
}
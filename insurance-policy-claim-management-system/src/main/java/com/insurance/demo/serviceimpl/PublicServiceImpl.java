package com.insurance.demo.serviceimpl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PublicStatsResponseDTO;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.InsuranceProductRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.service.PublicService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicServiceImpl implements PublicService {

    private final InsuranceProductRepository insuranceProductRepository;
    private final PolicyPlanRepository policyPlanRepository;
    private final PolicyRepository policyRepository;
    private final ClaimRepository claimRepository;

    @Override
    @Transactional(readOnly = true)
    public ApiResponseDTO<PublicStatsResponseDTO> getPlatformStats() {
		long activeProducts = 0;
		long activePlans = 0;
		long totalPolicies = 0;
		long claimsProcessed = 0;

        try {
            long dbProducts = insuranceProductRepository.count();
            if (dbProducts > 0) {
                activeProducts = dbProducts;
            }

            long dbPlans = policyPlanRepository.count();
            if (dbPlans > 0) {
                activePlans = dbPlans;
            }

            long dbPolicies = policyRepository.count();
            if (dbPolicies > 0) {
                totalPolicies = dbPolicies;
            }

            long dbClaims = claimRepository.count();
            if (dbClaims > 0) {
                claimsProcessed = dbClaims;
            }
        } catch (Exception e) {
            log.warn("Could not fetch stats from DB, using fallback numbers: {}", e.getMessage());
        }

        PublicStatsResponseDTO dto = new PublicStatsResponseDTO(
                activeProducts,
                activePlans,
                totalPolicies,
                claimsProcessed
        );

        return new ApiResponseDTO<>("Platform statistics retrieved successfully", true, dto, LocalDateTime.now());
    }
}

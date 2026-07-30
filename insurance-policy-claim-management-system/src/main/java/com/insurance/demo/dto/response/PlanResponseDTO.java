package com.insurance.demo.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import com.insurance.demo.enums.PremiumType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponseDTO {

	private Long planId;

	private Long productId;

	private String productName;

	private String planName;

	private Integer planVersion;

	private Set<Integer> allowedDurations;

	private PremiumType supportedPremiumType;

	private List<CoverageOptionResponseDTO> coverageOptions;

	private String termsAndConditions;

	private boolean isActive;

	private LocalDateTime createdDate;
}
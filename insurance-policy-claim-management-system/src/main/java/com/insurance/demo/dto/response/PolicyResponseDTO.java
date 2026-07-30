package com.insurance.demo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PolicyResponseDTO {

	private Long policyId;

	private String policyNumber;

	private Long customerId;

	private String customerName;

	private Long planId;

	private String planName;

	private LocalDate startDate;

	private LocalDate endDate;

	private String policyStatus;

	private BigDecimal totalPremiumPaid;

	private String productType;

	private BigDecimal selectedCoverage;

	private String premiumType;

	private Integer policyDuration;

	private BigDecimal premiumRateUsed;

	private BigDecimal processingFeeUsed;

	private BigDecimal gstUsed;

	private BigDecimal calculatedPremium;

	private Integer planVersion;

	private Long pricingRuleId;

	private Long quoteId;

	private LocalDateTime purchaseDate;

	private LocalDateTime createdDate;

	private BigDecimal remainingClaimAmount;
}
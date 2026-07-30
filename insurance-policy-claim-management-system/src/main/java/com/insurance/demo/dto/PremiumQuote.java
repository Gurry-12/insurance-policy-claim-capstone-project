package com.insurance.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.QuoteStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PremiumQuote {

	private Long quoteId;
	private BigDecimal selectedCoverage;
	private Integer duration;
	private PremiumType premiumType;

	private BigDecimal basePremium;
	private BigDecimal annualPremium;
	private BigDecimal processingFee;

	private BigDecimal gst;
	private BigDecimal totalCommitment;
	private BigDecimal discountPercentage;
	private BigDecimal discountAmount;
	private BigDecimal oneTimeDiscount;
	private BigDecimal totalPremium;

	private LocalDateTime expiresAt;
	private QuoteStatus status;
}

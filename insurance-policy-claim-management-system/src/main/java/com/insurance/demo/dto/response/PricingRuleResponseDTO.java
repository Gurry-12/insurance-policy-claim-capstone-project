package com.insurance.demo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PricingRuleResponseDTO {

	private Long id;
	private Long planId;
	private BigDecimal baseRiskRate;
	private BigDecimal processingFee;
	private BigDecimal gst;
	private LocalDateTime effectiveFrom;
	private LocalDateTime effectiveTo;
	private String status;
	private LocalDateTime createdDate;
	private LocalDateTime updatedDate;
}


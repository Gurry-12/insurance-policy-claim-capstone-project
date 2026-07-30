package com.insurance.demo.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PricingRuleRequestDTO {

	private Long planId;

	@PositiveOrZero(message = "Base risk rate must be positive or zero")
	private BigDecimal baseRiskRate;

	@PositiveOrZero(message = "Processing fee must be positive or zero")
	private BigDecimal processingFee;

	@PositiveOrZero(message = "GST percentage must be positive or zero")
	private BigDecimal gst;

	private LocalDateTime effectiveFrom;

	private LocalDateTime effectiveTo;

	private String remarks;
}


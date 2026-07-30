package com.insurance.demo.dto;

import java.math.BigDecimal;

import com.insurance.demo.enums.PremiumType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPremiumCalculationRequest {

	@NotNull(message = "Customer ID is required")
	private Long customerId;

	@NotNull(message = "Plan ID is required")
	private Long planId;

	@NotNull(message = "Coverage amount is required")
	@Positive(message = "Coverage amount must be positive")
	private BigDecimal coverageAmount;

	@NotNull(message = "Duration is required")
	@Positive(message = "Duration must be positive")
	private Integer duration;

	@NotNull(message = "Premium type is required")
	private PremiumType premiumType;
}

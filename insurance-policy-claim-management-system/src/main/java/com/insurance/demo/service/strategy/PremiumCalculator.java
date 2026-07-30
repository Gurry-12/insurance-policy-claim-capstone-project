package com.insurance.demo.service.strategy;

import java.math.BigDecimal;

import com.insurance.demo.dto.PremiumCalculationRequest;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.model.PricingRule;

public interface PremiumCalculator {
	PremiumQuote calculatePremium(PremiumCalculationRequest request, PricingRule rule, BigDecimal coverageAmount);
}

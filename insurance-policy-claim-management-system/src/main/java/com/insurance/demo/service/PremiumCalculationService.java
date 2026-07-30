package com.insurance.demo.service;

import java.math.BigDecimal;

import com.insurance.demo.dto.PremiumCalculationRequest;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.enums.PremiumType;

public interface PremiumCalculationService {
	PremiumQuote generateQuote(PremiumCalculationRequest request, String username);

	PremiumQuote generateQuoteForCustomer(Long customerId, Long planId, BigDecimal coverageAmount,
			Integer duration, PremiumType premiumType);
}

package com.insurance.demo.service.strategy;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.insurance.demo.enums.PremiumType;

@Component
public class PremiumCalculatorFactory {

	private final Map<String, PremiumCalculator> calculators;

	@Autowired
	public PremiumCalculatorFactory(Map<String, PremiumCalculator> calculators) {
		this.calculators = calculators;
	}

	public PremiumCalculator getCalculator(PremiumType premiumType) {
		String beanName = premiumType.name() + "_CALCULATOR";
		return Optional.ofNullable(calculators.get(beanName))
				.orElseThrow(() -> new IllegalStateException(
						"No premium calculator found for type: " + premiumType));
	}
}

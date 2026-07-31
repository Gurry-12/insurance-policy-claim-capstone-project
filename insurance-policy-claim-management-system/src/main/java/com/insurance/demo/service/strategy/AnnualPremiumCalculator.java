package com.insurance.demo.service.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.insurance.demo.dto.PremiumCalculationRequest;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.model.PricingRule;

@Component("ANNUAL_CALCULATOR")
public class AnnualPremiumCalculator implements PremiumCalculator {

	@Override
	public PremiumQuote calculatePremium(PremiumCalculationRequest request, PricingRule rule, BigDecimal coverageAmount) {
		int duration = request.getDuration() != null ? request.getDuration() : 1;

		// 1. Base Annual Risk Premium
		BigDecimal riskRate = rule.getBaseRiskRate();
		BigDecimal basePremium = coverageAmount.multiply(riskRate).setScale(0, RoundingMode.HALF_UP);

		// 2. Processing Fee
		BigDecimal processingFee = rule.getProcessingFee().setScale(0, RoundingMode.HALF_UP);

		// 3. Taxable Amount (per year)
		BigDecimal taxableAmount = basePremium.add(processingFee);

		// 4. GST (per year)
		BigDecimal gstPercentage = rule.getGst();
		BigDecimal gstAmount = taxableAmount.multiply(gstPercentage).divide(new BigDecimal("100.00"), 0, RoundingMode.HALF_UP);

		// 5. Annual Premium (cost per year)
		BigDecimal annualPremium = taxableAmount.add(gstAmount);

		// 6. Total Commitment over full duration
		BigDecimal totalCommitment = annualPremium.multiply(BigDecimal.valueOf(duration)).setScale(0, RoundingMode.HALF_UP);

		// 7. For ANNUAL: customer pays annualPremium each year, no lump-sum discount
		BigDecimal totalPremium = annualPremium;

		return PremiumQuote.builder()
				.selectedCoverage(coverageAmount)
				.duration(duration)
				.premiumType(PremiumType.ANNUAL)
				.basePremium(basePremium)
				.annualPremium(annualPremium)
				.processingFee(processingFee)
				.gst(gstAmount)
				.totalCommitment(totalCommitment)
				.discountPercentage(BigDecimal.ZERO)
				.discountAmount(BigDecimal.ZERO)
				.oneTimeDiscount(BigDecimal.ZERO)
				.totalPremium(totalPremium)
				.build();
	}
}

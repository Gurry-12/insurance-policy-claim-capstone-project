package com.insurance.demo.service.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.insurance.demo.dto.PremiumCalculationRequest;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.model.PricingRule;

@Component("ONE_TIME_CALCULATOR")
public class OneTimePremiumCalculator implements PremiumCalculator {

	@Override
	public PremiumQuote calculatePremium(PremiumCalculationRequest request, PricingRule rule, BigDecimal coverageAmount) {
		int duration = request.getDuration() != null ? request.getDuration() : 1;

		// 1. Base Annual Risk Premium
		BigDecimal riskRate = rule.getBaseRiskRate();
		BigDecimal basePremium = coverageAmount.multiply(riskRate).setScale(2, RoundingMode.HALF_UP);

		// 2. Processing Fee
		BigDecimal processingFee = rule.getProcessingFee();

		// 3. Taxable Amount (per year)
		BigDecimal taxableAmount = basePremium.add(processingFee);

		// 4. GST (per year)
		BigDecimal gstPercentage = rule.getGst();
		BigDecimal gstAmount = taxableAmount.multiply(gstPercentage).divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);

		// 5. Annual Premium (cost per year, used for total commitment calculation)
		BigDecimal annualPremium = taxableAmount.add(gstAmount);

		// 6. Total Commitment over full duration (before discount)
		BigDecimal totalCommitment = annualPremium.multiply(BigDecimal.valueOf(duration)).setScale(2, RoundingMode.HALF_UP);

		// 7. Duration-based discount for upfront one-time payment
		BigDecimal discountRate = getDurationDiscountRate(duration);
		BigDecimal discountAmount = totalCommitment.multiply(discountRate).setScale(2, RoundingMode.HALF_UP);

		// 8. Final one-time premium after discount
		BigDecimal totalPremium = totalCommitment.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

		return PremiumQuote.builder()
				.selectedCoverage(coverageAmount)
				.duration(duration)
				.premiumType(PremiumType.ONE_TIME)
				.basePremium(basePremium)
				.annualPremium(annualPremium)
				.processingFee(processingFee)
				.gst(gstAmount)
				.totalCommitment(totalCommitment)
				.discountPercentage(discountRate.multiply(new BigDecimal("100")).setScale(0, RoundingMode.HALF_UP))
				.discountAmount(discountAmount)
				.oneTimeDiscount(discountAmount)
				.totalPremium(totalPremium)
				.build();
	}

	private BigDecimal getDurationDiscountRate(int duration) {
		if (duration <= 1) return BigDecimal.ZERO;
		if (duration == 2) return new BigDecimal("0.02");
		if (duration == 3) return new BigDecimal("0.05");
		if (duration == 5) return new BigDecimal("0.08");
		if (duration == 7) return new BigDecimal("0.10");
		if (duration == 10) return new BigDecimal("0.12");
		if (duration == 15) return new BigDecimal("0.15");
		if (duration == 20) return new BigDecimal("0.18");
		return new BigDecimal("0.20");
	}
}

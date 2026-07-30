package com.insurance.demo.serviceimpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.insurance.demo.dto.PremiumCalculationRequest;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.enums.PricingRuleStatus;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.QuoteStatus;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.CoverageOption;
import com.insurance.demo.model.Customer;
import com.insurance.demo.model.PolicyPlan;
import com.insurance.demo.model.PricingRule;
import com.insurance.demo.model.Quote;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PricingRuleRepository;
import com.insurance.demo.repository.QuoteRepository;
import com.insurance.demo.service.PremiumCalculationService;
import com.insurance.demo.service.strategy.PremiumCalculator;
import com.insurance.demo.service.strategy.PremiumCalculatorFactory;
import com.insurance.demo.util.MessageConstants;

@Service
public class PremiumCalculationServiceImpl implements PremiumCalculationService {

	@Autowired
	private PolicyPlanRepository planRepository;
	
	@Autowired
	private PricingRuleRepository pricingRuleRepository;
	
	@Autowired
	private QuoteRepository quoteRepository;
	
	@Autowired
	private CustomerRepository customerRepository;
	
	@Autowired
	private PremiumCalculatorFactory calculatorFactory;

	@Override
	public PremiumQuote generateQuote(PremiumCalculationRequest request, String username) {
		
		Customer customer = customerRepository.findByUserEmail(username)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Customer.PROFILE_NOT_FOUND));

		return generateQuoteInternal(customer, request.getPlanId(), request.getCoverageAmount(),
				request.getDuration(), request.getPremiumType());
	}

	@Override
	public PremiumQuote generateQuoteForCustomer(Long customerId, Long planId, BigDecimal coverageAmount,
			Integer duration, PremiumType premiumType) {

		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

		return generateQuoteInternal(customer, planId, coverageAmount, duration, premiumType);
	}

	private PremiumQuote generateQuoteInternal(Customer customer, Long planId, BigDecimal coverageAmount,
			Integer duration, PremiumType premiumType) {

		PolicyPlan plan = planRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
				
		if (!plan.getIsActive()) {
			throw new IllegalArgumentException("Selected plan is not active");
		}
		
		if (!plan.getInsuranceProduct().getIsActive()) {
			throw new IllegalArgumentException("Insurance product is not active");
		}

		if (!plan.getAllowedDurations().contains(duration)) {
			throw new IllegalArgumentException("Invalid duration for this plan");
		}
		
		if (!plan.getSupportedPremiumType().equals(premiumType)) {
			throw new IllegalArgumentException("Invalid premium type for this plan");
		}

		CoverageOption selectedOption = plan.getCoverageOptions().stream()
				.filter(opt -> opt.getCoverageAmount().compareTo(coverageAmount) == 0)
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Invalid coverage amount selected"));
				
		if (!selectedOption.getIsActive()) {
			throw new IllegalArgumentException("Selected coverage option is not active");
		}

		List<PricingRule> rules = pricingRuleRepository.findByPolicyPlanIdAndStatusOrderByIdDesc(
				plan.getId(), PricingRuleStatus.ACTIVE);
				
		if (rules.isEmpty()) {
			throw new com.insurance.demo.exception.BadRequestException("No active pricing rule found for this plan");
		}
		
		PricingRule activeRule = rules.get(0);

		PremiumCalculator calculator = calculatorFactory.getCalculator(premiumType);
		PremiumQuote quoteDto = calculator.calculatePremium(
				new PremiumCalculationRequest(planId, coverageAmount, duration, premiumType),
				activeRule, coverageAmount);

		Quote quote = new Quote();
		quote.setCustomer(customer);
		quote.setPolicyPlan(plan);
		quote.setPlanVersion(plan.getPlanVersion());
		quote.setPricingRuleId(activeRule.getId());
		quote.setCoverage(coverageAmount);
		quote.setDuration(duration);
		quote.setPremiumType(premiumType);
		quote.setRiskRate(activeRule.getBaseRiskRate());
		quote.setProcessingFee(quoteDto.getProcessingFee());
		quote.setGst(quoteDto.getGst());
		quote.setPremium(quoteDto.getAnnualPremium());
		quote.setTotal(quoteDto.getTotalPremium());
		quote.setStatus(QuoteStatus.CREATED);
		quote.setExpiresAt(LocalDateTime.now().plusMinutes(30));
		
		Quote savedQuote = quoteRepository.save(quote);
		
		quoteDto.setQuoteId(savedQuote.getId());
		quoteDto.setExpiresAt(savedQuote.getExpiresAt());
		quoteDto.setStatus(QuoteStatus.CREATED);
		
		return quoteDto;
	}
}

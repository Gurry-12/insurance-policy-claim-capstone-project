package com.insurance.demo.serviceimpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.request.PricingPreviewRequestDTO;
import com.insurance.demo.dto.request.PricingRuleRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PricingRuleResponseDTO;
import com.insurance.demo.dto.PremiumQuote;
import com.insurance.demo.enums.PricingRuleStatus;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.PolicyPlan;
import com.insurance.demo.model.PricingAuditLog;
import com.insurance.demo.model.PricingRule;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PricingAuditLogRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.repository.PricingRuleRepository;
import com.insurance.demo.repository.QuoteRepository;
import com.insurance.demo.service.PricingRuleService;
import com.insurance.demo.util.MessageConstants;
import com.insurance.demo.util.PaginationValidator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingRuleServiceImpl implements PricingRuleService {

	private final PricingRuleRepository pricingRuleRepository;
	private final PolicyPlanRepository planRepository;
	private final PricingAuditLogRepository auditLogRepository;
	private final QuoteRepository quoteRepository;
	private final PolicyRepository policyRepository;
	private final ModelMapper modelMapper;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private void applyDefaults(PricingRule rule, ProductType productType) {
		switch (productType) {
			case HEALTH:
				rule.setBaseRiskRate(new BigDecimal("0.025"));
				rule.setProcessingFee(new BigDecimal("100.00"));
				rule.setGst(new BigDecimal("0.00"));
				break;
			case MOTOR:
				rule.setBaseRiskRate(new BigDecimal("0.030"));
				rule.setProcessingFee(new BigDecimal("150.00"));
				rule.setGst(new BigDecimal("18.00"));
				break;
			case TRAVEL:
				rule.setBaseRiskRate(new BigDecimal("0.015"));
				rule.setProcessingFee(new BigDecimal("50.00"));
				rule.setGst(new BigDecimal("18.00"));
				break;
			case LIFE:
				rule.setBaseRiskRate(new BigDecimal("0.008"));
				rule.setProcessingFee(new BigDecimal("200.00"));
				rule.setGst(new BigDecimal("0.00"));
				break;
			default:
				rule.setBaseRiskRate(new BigDecimal("0.020"));
				rule.setProcessingFee(new BigDecimal("100.00"));
				rule.setGst(new BigDecimal("18.00"));
		}
	}

	@Override
	@Transactional
	public ApiResponseDTO<PricingRuleResponseDTO> createPricingRule(PricingRuleRequestDTO dto) {
		log.info("Creating pricing rule for plan: {}", dto.getPlanId());

		PolicyPlan plan = planRepository.findById(dto.getPlanId())
				.orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + dto.getPlanId()));

		PricingRule rule = new PricingRule();
		rule.setPolicyPlan(plan);
		
		if (dto.getBaseRiskRate() != null && dto.getProcessingFee() != null && dto.getGst() != null) {
			rule.setBaseRiskRate(dto.getBaseRiskRate());
			rule.setProcessingFee(dto.getProcessingFee());
			rule.setGst(dto.getGst());
		} else {
			applyDefaults(rule, plan.getInsuranceProduct().getProductType());
		}

		rule.setEffectiveFrom(dto.getEffectiveFrom() != null ? dto.getEffectiveFrom() : LocalDateTime.now());
		rule.setEffectiveTo(dto.getEffectiveTo());
		rule.setRemarks(dto.getRemarks());
		
		// If there is no active rule for this plan, activate this rule immediately
		List<PricingRule> activeRules = pricingRuleRepository.findByPolicyPlanIdAndStatusOrderByIdDesc(
				plan.getId(), PricingRuleStatus.ACTIVE);
		if (activeRules.isEmpty()) {
			rule.setStatus(PricingRuleStatus.ACTIVE);
		} else {
			rule.setStatus(PricingRuleStatus.INACTIVE);
		}

		PricingRule savedRule = pricingRuleRepository.save(rule);

		recordAuditLog(savedRule, dto.getRemarks(), SecurityContextHolder.getContext().getAuthentication().getName());

		PricingRuleResponseDTO responseDTO = modelMapper.map(savedRule, PricingRuleResponseDTO.class);
		responseDTO.setPlanId(plan.getId());
		return new ApiResponseDTO<>("Pricing rule created successfully", true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PricingRuleResponseDTO> updatePricingRule(Long ruleId, PricingRuleRequestDTO dto) {
		log.info("Updating pricing rule with id: {}", ruleId);

		PricingRule rule = pricingRuleRepository.findById(ruleId)
				.orElseThrow(() -> new ResourceNotFoundException("Pricing rule not found with id: " + ruleId));

		PolicyPlan plan = planRepository.findById(dto.getPlanId())
				.orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + dto.getPlanId()));

		if (!rule.getPolicyPlan().getId().equals(plan.getId())) {
			throw new BadRequestException("Cannot change plan of existing pricing rule.");
		}

		rule.setBaseRiskRate(dto.getBaseRiskRate());
		rule.setProcessingFee(dto.getProcessingFee());
		rule.setGst(dto.getGst());
		rule.setEffectiveFrom(dto.getEffectiveFrom());
		rule.setEffectiveTo(dto.getEffectiveTo());
		rule.setRemarks(dto.getRemarks());

		PricingRule updatedRule = pricingRuleRepository.save(rule);

		recordAuditLog(updatedRule, dto.getRemarks(), SecurityContextHolder.getContext().getAuthentication().getName());

		PricingRuleResponseDTO responseDTO = modelMapper.map(updatedRule, PricingRuleResponseDTO.class);
		responseDTO.setPlanId(plan.getId());
		return new ApiResponseDTO<>("Pricing rule updated successfully", true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PricingRuleResponseDTO> getPricingRule(Long ruleId) {
		PricingRule rule = pricingRuleRepository.findById(ruleId)
				.orElseThrow(() -> new ResourceNotFoundException("Pricing rule not found with id: " + ruleId));

		PricingRuleResponseDTO responseDTO = modelMapper.map(rule, PricingRuleResponseDTO.class);
		responseDTO.setPlanId(rule.getPolicyPlan().getId());
		return new ApiResponseDTO<>("Pricing rule fetched successfully", true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<PricingRuleResponseDTO>> listPricingRules(Long planId, String status,
			int pageNumber, int pageSize, String sortBy, String sortDirection) {

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "createdDate", "status"));

		Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, sortBy));

		Specification<PricingRule> spec = (root, query, cb) -> cb.conjunction();

		if (planId != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("policyPlan").get("id"), planId));
		}

		if (status != null && !status.trim().isEmpty()) {
			try {
				PricingRuleStatus ruleStatus = PricingRuleStatus.valueOf(status.trim().toUpperCase());
				spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), ruleStatus));
			} catch (IllegalArgumentException e) {
				throw new BadRequestException("Invalid status: " + status);
			}
		}

		Page<PricingRule> page = pricingRuleRepository.findAll(spec, pageable);

		List<PricingRuleResponseDTO> content = page.getContent().stream()
				.map(rule -> {
					PricingRuleResponseDTO dto = modelMapper.map(rule, PricingRuleResponseDTO.class);
					dto.setPlanId(rule.getPolicyPlan().getId());
					return dto;
				}).toList();

		PageResponseDTO<PricingRuleResponseDTO> pageResponse = new PageResponseDTO<>(content, page.getNumber(),
				page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast(), sortDirection);

		return new ApiResponseDTO<>("Pricing rules fetched successfully", true, pageResponse, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PricingRuleResponseDTO> activatePricingRule(Long ruleId) {
		PricingRule rule = pricingRuleRepository.findById(ruleId)
				.orElseThrow(() -> new ResourceNotFoundException("Pricing rule not found with id: " + ruleId));

		if (rule.getStatus() == PricingRuleStatus.ACTIVE) {
			throw new BadRequestException("Pricing rule is already active.");
		}

		// Enforce only one active rule per plan: require deactivating existing active rule first
		List<PricingRule> activeRules = pricingRuleRepository.findByPolicyPlanIdAndStatusOrderByIdDesc(
				rule.getPolicyPlan().getId(), PricingRuleStatus.ACTIVE);
		if (!activeRules.isEmpty()) {
			throw new BadRequestException("An active pricing rule already exists for this plan. Please deactivate the existing active rule first before activating a new one.");
		}

		rule.setStatus(PricingRuleStatus.ACTIVE);
		PricingRule updatedRule = pricingRuleRepository.save(rule);

		recordAuditLog(updatedRule, "Activated", SecurityContextHolder.getContext().getAuthentication().getName());

		PricingRuleResponseDTO responseDTO = modelMapper.map(updatedRule, PricingRuleResponseDTO.class);
		responseDTO.setPlanId(updatedRule.getPolicyPlan().getId());
		return new ApiResponseDTO<>("Pricing rule activated successfully", true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PricingRuleResponseDTO> deactivatePricingRule(Long ruleId) {
		PricingRule rule = pricingRuleRepository.findById(ruleId)
				.orElseThrow(() -> new ResourceNotFoundException("Pricing rule not found with id: " + ruleId));

		if (rule.getStatus() == PricingRuleStatus.INACTIVE) {
			throw new BadRequestException("Pricing rule is already inactive.");
		}

		rule.setStatus(PricingRuleStatus.INACTIVE);
		PricingRule updatedRule = pricingRuleRepository.save(rule);

		recordAuditLog(updatedRule, "Deactivated", SecurityContextHolder.getContext().getAuthentication().getName());

		PricingRuleResponseDTO responseDTO = modelMapper.map(updatedRule, PricingRuleResponseDTO.class);
		responseDTO.setPlanId(updatedRule.getPolicyPlan().getId());
		return new ApiResponseDTO<>("Pricing rule deactivated successfully", true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<Void> deletePricingRule(Long ruleId) {
		PricingRule rule = pricingRuleRepository.findById(ruleId)
				.orElseThrow(() -> new ResourceNotFoundException("Pricing rule not found with id: " + ruleId));

		boolean isUsedInQuote = quoteRepository.existsByPricingRuleId(rule.getId());
		boolean isUsedInPolicy = policyRepository.existsByPricingRuleId(rule.getId());
		
		if (isUsedInQuote || isUsedInPolicy) {
			throw new BadRequestException("Pricing rule is already used in quotes or policies and cannot be deleted.");
		}
		
		pricingRuleRepository.delete(rule);

		return new ApiResponseDTO<>("Pricing rule deleted successfully", true, null, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<PricingAuditLog>> getPricingRuleHistory(Long ruleId) {
		List<PricingAuditLog> logs = auditLogRepository.findByPricingRuleIdOrderByChangedAtDesc(ruleId);
		return new ApiResponseDTO<>("Pricing rule history fetched successfully", true, logs, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PricingRuleResponseDTO> getActiveRuleForPlan(Long planId) {
		PolicyPlan plan = planRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException("Plan not found with id: " + planId));

		List<PricingRule> activeRules = pricingRuleRepository
				.findByPolicyPlanIdAndStatusOrderByIdDesc(plan.getId(), PricingRuleStatus.ACTIVE);

		if (activeRules.isEmpty()) {
			throw new ResourceNotFoundException("No active pricing rule found for plan id: " + planId);
		}

		PricingRule activeRule = activeRules.get(0);
		PricingRuleResponseDTO responseDTO = modelMapper.map(activeRule, PricingRuleResponseDTO.class);
		responseDTO.setPlanId(plan.getId());
		return new ApiResponseDTO<>("Active pricing rule fetched successfully", true, responseDTO, LocalDateTime.now());
	}

	@Override
	public ApiResponseDTO<PremiumQuote> previewPremium(PricingPreviewRequestDTO dto) {
		// Mock preview for admin - simple lookup
		throw new UnsupportedOperationException("Not implemented - preview should call quote service directly.");
	}

	private void recordAuditLog(PricingRule rule, String remarks, String changedBy) {
		PricingAuditLog log = new PricingAuditLog();
		log.setPricingRuleId(rule.getId());
		log.setRemarks(remarks);
		log.setChangedBy(changedBy);
		log.setChangedAt(LocalDateTime.now());
		
		try {
			PricingRuleResponseDTO dto = modelMapper.map(rule, PricingRuleResponseDTO.class);
			dto.setPlanId(rule.getPolicyPlan().getId());
			log.setNewConfiguration(objectMapper.writeValueAsString(dto));
		} catch (JsonProcessingException e) {
			log.setNewConfiguration("Error serializing configuration: " + e.getMessage());
		}
		
		auditLogRepository.save(log);
	}
}


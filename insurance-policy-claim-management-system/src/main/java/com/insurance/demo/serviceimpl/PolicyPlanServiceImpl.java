package com.insurance.demo.serviceimpl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.request.CoverageOptionRequestDTO;
import com.insurance.demo.dto.request.PlanRequestDTO;
import com.insurance.demo.dto.request.PlanWizardRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PlanResponseDTO;
import com.insurance.demo.dto.response.PlanWizardResponseDTO;
import com.insurance.demo.dto.response.PricingRuleResponseDTO;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.CoverageOption;
import com.insurance.demo.model.InsuranceProduct;
import com.insurance.demo.model.PolicyPlan;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.InsuranceProductRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.service.CoverageOptionService;
import com.insurance.demo.service.PolicyPlanService;
import com.insurance.demo.service.PricingRuleService;
import com.insurance.demo.util.MessageConstants;
import com.insurance.demo.util.PaginationValidator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyPlanServiceImpl implements PolicyPlanService {

	private final PolicyPlanRepository policyPlanRepository;
	private final InsuranceProductRepository productRepository;
	private final AppUserRepository userRepository;
	private final ModelMapper modelMapper;
	private final CoverageOptionService coverageOptionService;
	private final PricingRuleService pricingRuleService;
	private final PolicyRepository policyRepository;

	@Override
	@Transactional
	public ApiResponseDTO<PlanWizardResponseDTO> createPolicyPlan(PlanWizardRequestDTO requestDTO) {

		PlanRequestDTO dto = requestDTO.getPlanDetails();
		log.info("Creating comprehensive policy plan: {}", dto.getPlanName());

		// Validate Product exists and is active
		InsuranceProduct product = productRepository.findById(dto.getProductId())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + dto.getProductId()));

		if (!Boolean.TRUE.equals(product.getIsActive())) {
			throw new BadRequestException(MessageConstants.PolicyPlan.UNDER_INACTIVE_PRODUCT);
		}

		// Check duplicate plan name
		if (policyPlanRepository.existsByPlanNameIgnoreCase(dto.getPlanName())) {
			throw new DuplicateResourceException(MessageConstants.PolicyPlan.ALREADY_EXISTS + dto.getPlanName());
		}

		PolicyPlan plan = new PolicyPlan();
		plan.setPlanName(dto.getPlanName().toLowerCase());
		plan.setAllowedDurations(dto.getAllowedDurations());
		plan.setSupportedPremiumType(dto.getSupportedPremiumType());
		plan.setTermsAndConditions(dto.getTermsAndConditions());
		plan.setInsuranceProduct(product);
		plan.setIsActive(dto.getActiveStatus() != null ? dto.getActiveStatus() : true);
		plan.setPlanVersion(1);

		plan.setCoverageOptions(new ArrayList<>());

		PolicyPlan savedPlan = policyPlanRepository.save(plan);
		log.info("Plan ID after save: {}", savedPlan.getId());
		Long planId = savedPlan.getId();

		// 2. Create Coverage Options
		List<Long> coverageOptionIds = new ArrayList<>();
		for (CoverageOptionRequestDTO coverageDto : requestDTO.getCoverageOptions()) {
			ApiResponseDTO<CoverageOption> coverageResponse = coverageOptionService.createCoverageOption(planId, coverageDto);
			coverageOptionIds.add(coverageResponse.getData().getId());
		}

		// 3. Create Pricing Rule
		if (requestDTO.getPricingRule() == null) {
			requestDTO.setPricingRule(new com.insurance.demo.dto.request.PricingRuleRequestDTO());
		}
		requestDTO.getPricingRule().setPlanId(planId);
		ApiResponseDTO<PricingRuleResponseDTO> pricingResponse = pricingRuleService.createPricingRule(requestDTO.getPricingRule());

		PlanWizardResponseDTO wizardResponse = new PlanWizardResponseDTO(
				planId,
				savedPlan.getPlanName(),
				coverageOptionIds,
				pricingResponse.getData().getId()
		);

		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.CREATED_SUCCESS, true, wizardResponse, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PlanResponseDTO> updatePolicyPlan(Long planId, PlanRequestDTO dto) {

		log.info("Updating policy plan with id: {}", planId);

		PolicyPlan existingPlan = policyPlanRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + planId));

		if (!Boolean.TRUE.equals(existingPlan.getIsActive())) {
			throw new BadRequestException(MessageConstants.PolicyPlan.INACTIVE_UPDATE_RESTRICTED);
		}

		// Validate product if changed
		if (!existingPlan.getInsuranceProduct().getId().equals(dto.getProductId())) {
			InsuranceProduct newProduct = productRepository.findById(dto.getProductId()).orElseThrow(
					() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + dto.getProductId()));

			if (!Boolean.TRUE.equals(newProduct.getIsActive())) {
				throw new BadRequestException(MessageConstants.PolicyPlan.LINK_INACTIVE_PRODUCT);
			}
			existingPlan.setInsuranceProduct(newProduct);
		}

		// Check duplicate name (excluding self)
		if (!existingPlan.getPlanName().equalsIgnoreCase(dto.getPlanName())
				&& policyPlanRepository.existsByPlanNameIgnoreCase(dto.getPlanName())) {
			throw new DuplicateResourceException(MessageConstants.PolicyPlan.PLAN_NAME_DUPLICATE + dto.getPlanName());
		}

		// Verify that if a duration was already used in an existing policy, it cannot be removed from allowedDurations
		if (existingPlan.getAllowedDurations() != null && dto.getAllowedDurations() != null) {
			for (Integer oldDuration : existingPlan.getAllowedDurations()) {
				if (!dto.getAllowedDurations().contains(oldDuration)) {
					if (policyRepository.existsByPolicyPlanIdAndPolicyDuration(planId, oldDuration)) {
						throw new BadRequestException("Cannot remove duration (" + oldDuration + " Year(s)) because policies have already been issued under this duration.");
					}
				}
			}
		}

		// Update fields
		existingPlan.setPlanName(dto.getPlanName().toLowerCase());
		existingPlan.setAllowedDurations(dto.getAllowedDurations());
		existingPlan.setSupportedPremiumType(dto.getSupportedPremiumType());
		existingPlan.setTermsAndConditions(dto.getTermsAndConditions());
		if (dto.getActiveStatus() != null) {
			existingPlan.setIsActive(dto.getActiveStatus());
		}
		
		existingPlan.setPlanVersion(existingPlan.getPlanVersion() + 1);



		PolicyPlan updatedPlan = policyPlanRepository.save(existingPlan);

		PlanResponseDTO responseDTO = modelMapper.map(updatedPlan, PlanResponseDTO.class);
		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.UPDATED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PlanResponseDTO> deactivatePolicyPlan(Long planId) {
		log.info("Deactivating policy plan id: {}", planId);

		PolicyPlan plan = policyPlanRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + planId));

		if (Boolean.FALSE.equals(plan.getIsActive())) {
			PlanResponseDTO dto = modelMapper.map(plan, PlanResponseDTO.class);
			return new ApiResponseDTO<>(MessageConstants.PolicyPlan.ALREADY_INACTIVE, false, dto, LocalDateTime.now());
		}

		plan.setIsActive(false);
		PolicyPlan deactivatedPlan = policyPlanRepository.save(plan);

		PlanResponseDTO responseDTO = modelMapper.map(deactivatedPlan, PlanResponseDTO.class);
		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.DEACTIVATED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<PlanResponseDTO> activatePolicyPlan(Long planId) {
		log.info("Activating policy plan id: {}", planId);

		PolicyPlan plan = policyPlanRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + planId));

		if (Boolean.TRUE.equals(plan.getIsActive())) {
			PlanResponseDTO dto = modelMapper.map(plan, PlanResponseDTO.class);
			return new ApiResponseDTO<>(MessageConstants.PolicyPlan.ALREADY_ACTIVE, false, dto, LocalDateTime.now());
		}

		plan.setIsActive(true);
		PolicyPlan activatedPlan = policyPlanRepository.save(plan);

		PlanResponseDTO responseDTO = modelMapper.map(activatedPlan, PlanResponseDTO.class);
		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.ACTIVATED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<PlanResponseDTO>> viewActivePlans() {

		List<PolicyPlan> plans = policyPlanRepository.findByIsActiveTrue();

		org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			
			if (staffSpeciality == null) {
				plans = List.of();
			} else {
				plans = plans.stream()
						.filter(p -> p.getInsuranceProduct() != null && staffSpeciality.equals(p.getInsuranceProduct().getProductType()))
						.toList();
			}
		}
		List<PlanResponseDTO> responseList = plans.stream().map(plan -> modelMapper.map(plan, PlanResponseDTO.class))
				.toList();

		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.ACTIVE_FETCHED, true, responseList,
				LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<PlanResponseDTO>> viewActivePlansUnderInsuranceProduct(Long productId) {

		List<PolicyPlan> plans = policyPlanRepository.findByInsuranceProductIdAndIsActiveTrue(productId);

		org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;

			if (staffSpeciality == null) {
				plans = List.of();
			} else {
				plans = plans.stream()
						.filter(p -> p.getInsuranceProduct() != null && staffSpeciality.equals(p.getInsuranceProduct().getProductType()))
						.toList();
			}
		}

		List<PlanResponseDTO> responseList = plans.stream().map(plan -> modelMapper.map(plan, PlanResponseDTO.class))
				.toList();

		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.ACTIVE_UNDER_PRODUCT_FETCHED, true, responseList,
				LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<PlanResponseDTO>> getAllPlansWithPagination(int pageNumber, int pageSize, String sortBy,
			String sortDirection, Long productId, Boolean isActive, String planName, Double minCoverageAmount,
			Double maxCoverageAmount, Double minPremiumAmount, Double maxPremiumAmount) {

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy,
				Set.of("id", "planName", "createdDate"));

		Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, sortBy));

		Specification<PolicyPlan> spec = (root, query, cb) -> cb.conjunction();

		if (productId != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("insuranceProduct").get("id"), productId));
		}
		if (isActive != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), isActive));
			if (Boolean.TRUE.equals(isActive)) {
				spec = spec.and((root, query, cb) -> cb.equal(root.get("insuranceProduct").get("isActive"), true));
			}
		}
		if (planName != null && !planName.trim().isEmpty()) {
			spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("planName")),
					"%" + planName.trim().toLowerCase() + "%"));
		}

		Page<PolicyPlan> planPage = policyPlanRepository.findAll(spec, pageable);

		List<PlanResponseDTO> content = planPage.getContent().stream()
				.map(plan -> modelMapper.map(plan, PlanResponseDTO.class)).toList();

		PageResponseDTO<PlanResponseDTO> pageResponse = new PageResponseDTO<>(content, planPage.getNumber(), planPage.getSize(), planPage.getTotalElements(),
				planPage.getTotalPages(), planPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	public ApiResponseDTO<PlanResponseDTO> getPlanById(Long planId) {

		PolicyPlan plan = policyPlanRepository.findById(planId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + planId));

		org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isCustomer = auth != null
				&& auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));

		if (isCustomer && (!Boolean.TRUE.equals(plan.getIsActive()) || !Boolean.TRUE.equals(plan.getInsuranceProduct().getIsActive()))) {
			throw new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + planId);
		}

		return new ApiResponseDTO<>(MessageConstants.PolicyPlan.DETAILS_RETRIEVED, true,
				modelMapper.map(plan, PlanResponseDTO.class), LocalDateTime.now());

	}
}
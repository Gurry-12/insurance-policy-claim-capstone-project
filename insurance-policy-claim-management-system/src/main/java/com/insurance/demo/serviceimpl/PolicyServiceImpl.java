package com.insurance.demo.serviceimpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.request.PolicyIssueRequestDTO;
import com.insurance.demo.dto.request.PolicyPurchaseRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PolicyResponseDTO;
import com.insurance.demo.enums.ClaimStatus;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.enums.QuoteStatus;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.PolicyNotFoundException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Customer;
import com.insurance.demo.model.Policy;
import com.insurance.demo.model.PolicyPlan;
import com.insurance.demo.model.Quote;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.repository.QuoteRepository;
import com.insurance.demo.service.PolicyService;
import com.insurance.demo.util.MessageConstants;
import com.insurance.demo.util.PaginationValidator;
import com.insurance.demo.util.PolicyNumberGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyServiceImpl implements PolicyService {

	private final PolicyRepository policyRepository;
	private final ClaimRepository claimRepository;
	private final PolicyPlanRepository policyPlanRepository;
	private final CustomerRepository customerRepository;
	private final AppUserRepository userRepository;
	private final QuoteRepository quoteRepository;
	private final ModelMapper modelMapper;

	@Override
	@Transactional(rollbackFor = Exception.class)
	public ApiResponseDTO<PolicyResponseDTO> purchasePolicy(PolicyPurchaseRequestDTO requestDTO) {

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		String customerEmail = authentication.getName();
		Customer customer = customerRepository.findByUserEmail(customerEmail)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Customer.PROFILE_NOT_FOUND));

		if (!isCustomerProfileComplete(customer)) {
			throw new BadRequestException(MessageConstants.Policy.COMPLETE_PROFILE_FIRST);
		}

		Quote quote = quoteRepository.findById(requestDTO.getQuoteId())
				.orElseThrow(() -> new ResourceNotFoundException("Quote not found"));
				
		validateQuoteForPurchase(quote, customer.getId());

		PolicyPlan plan = quote.getPolicyPlan();
		ProductType productType = plan.getInsuranceProduct().getProductType();

		if (productType == ProductType.HEALTH) {
			boolean exists = policyRepository.existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(customer.getId(),
					plan.getId(), List.of(PolicyStatus.ACTIVE, PolicyStatus.PENDING_PAYMENT));

			if (exists) {
				throw new DuplicateResourceException(MessageConstants.Policy.HEALTH_POLICY_EXISTS);
			}
		} else {
			boolean pendingExists = policyRepository.existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(
					customer.getId(), plan.getId(), List.of(PolicyStatus.PENDING_PAYMENT));

			if (pendingExists) {
				throw new DuplicateResourceException(MessageConstants.Policy.POLICY_EXISTS);
			}
		}

		Policy policy = buildPolicyFromQuote(quote, customer, plan, LocalDateTime.now().toLocalDate());

		Policy savedPolicy = policyRepository.save(policy);
		
		quote.setStatus(QuoteStatus.USED);
		quoteRepository.save(quote);

		PolicyResponseDTO responseDTO = convertToResponseDTO(savedPolicy);

		return new ApiResponseDTO<>(MessageConstants.Policy.PURCHASED_SUCCESS, true, responseDTO,
				LocalDateTime.now());
	}

	@Override
	@Transactional(rollbackFor = Exception.class)
	public ApiResponseDTO<PolicyResponseDTO> issuePolicy(PolicyIssueRequestDTO requestDTO) {

		Customer customer = customerRepository.findById(requestDTO.getCustomerId())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Customer.PROFILE_NOT_FOUND));

		if (!isCustomerProfileComplete(customer)) {
			throw new BadRequestException(MessageConstants.Policy.COMPLETE_PROFILE_FIRST);
		}

		Quote quote = quoteRepository.findById(requestDTO.getQuoteId())
				.orElseThrow(() -> new ResourceNotFoundException("Quote not found"));
				
		validateQuoteForPurchase(quote, customer.getId());

		// Start date can be today or up to 90 days in the future (for forward-dated issuance).
		// It must not be more than 90 days ahead to prevent data-entry errors.
		java.time.LocalDate today = java.time.LocalDate.now();
		if (requestDTO.getStartDate().isBefore(today.minusDays(1))) {
			throw new BadRequestException("Policy start date cannot be more than 1 day in the past.");
		}
		if (requestDTO.getStartDate().isAfter(today.plusDays(90))) {
			throw new BadRequestException("Policy start date cannot be more than 90 days in the future.");
		}

		PolicyPlan plan = quote.getPolicyPlan();
		ProductType productType = plan.getInsuranceProduct().getProductType();

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));
		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			if (staffSpeciality == null || !staffSpeciality.equals(productType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_ISSUE_DENIED);
			}
		}

		if (productType == ProductType.HEALTH) {
			boolean exists = policyRepository.existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(customer.getId(),
					plan.getId(), List.of(PolicyStatus.ACTIVE, PolicyStatus.PENDING_PAYMENT));

			if (exists) {
				throw new DuplicateResourceException(MessageConstants.Policy.HEALTH_POLICY_EXISTS);
			}
		} else {
			boolean pendingExists = policyRepository.existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(
					customer.getId(), plan.getId(), List.of(PolicyStatus.PENDING_PAYMENT));

			if (pendingExists) {
				throw new DuplicateResourceException(MessageConstants.Policy.POLICY_EXISTS);
			}
		}

		Policy policy = buildPolicyFromQuote(quote, customer, plan, requestDTO.getStartDate());

		Policy savedPolicy = policyRepository.save(policy);
		
		quote.setStatus(QuoteStatus.USED);
		quoteRepository.save(quote);

		PolicyResponseDTO responseDTO = convertToResponseDTO(savedPolicy);

		return new ApiResponseDTO<>(MessageConstants.Policy.ISSUED_SUCCESS, true, responseDTO,
				LocalDateTime.now());
	}
	
	private void validateQuoteForPurchase(Quote quote, Long customerId) {
		if (!quote.getCustomer().getId().equals(customerId)) {
			throw new BadRequestException("Quote does not belong to the authenticated customer");
		}
		
		if (quote.getStatus() != QuoteStatus.CREATED) {
			throw new BadRequestException("Quote status is not CREATED. It might be already USED, EXPIRED, or CANCELLED.");
		}
		
		if (quote.getExpiresAt().isBefore(LocalDateTime.now())) {
			quote.setStatus(QuoteStatus.EXPIRED);
			quoteRepository.save(quote);
			throw new BadRequestException("Quote has expired");
		}
		
		if (!quote.getPolicyPlan().getIsActive()) {
			throw new BadRequestException("The selected Policy Plan is no longer active");
		}
		
		if (!quote.getPolicyPlan().getInsuranceProduct().getIsActive()) {
			throw new BadRequestException("The Insurance Product is no longer active");
		}
	}
	
	private Policy buildPolicyFromQuote(Quote quote, Customer customer, PolicyPlan plan, java.time.LocalDate startDate) {
		Policy policy = new Policy();
		policy.setCustomer(customer);
		policy.setPolicyPlan(plan);
		policy.setPolicyNumber(PolicyNumberGenerator.generatePolicyNumber());
		policy.setStartDate(startDate);
		policy.setEndDate(startDate.plusYears(quote.getDuration()));
		policy.setPolicyStatus(PolicyStatus.PENDING_PAYMENT);
		policy.setTotalPremiumPaid(BigDecimal.ZERO);
		
		// Pricing Snapshots
		policy.setSelectedCoverage(quote.getCoverage());
		policy.setPremiumType(quote.getPremiumType());
		policy.setPolicyDuration(quote.getDuration());
		policy.setPremiumRateUsed(quote.getRiskRate());
		policy.setProcessingFeeUsed(quote.getProcessingFee());

		policy.setGstUsed(quote.getGst());
		policy.setCalculatedPremium(quote.getTotal());
		
		policy.setPlanVersion(quote.getPlanVersion());
		policy.setPricingRuleId(quote.getPricingRuleId());
		policy.setQuoteId(quote.getId());
		policy.setPurchaseDate(LocalDateTime.now());
		
		return policy;
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PolicyResponseDTO> getPolicyById(Long policyId) {
		log.info("Fetching policy by id: {}", policyId);
		Policy policy = policyRepository.findById(policyId).orElseThrow(() -> new PolicyNotFoundException(policyId));

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String email = auth.getName();
		boolean isCustomer = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isCustomer && !policy.getCustomer().getUser().getEmail().equals(email)) {
			throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_POLICY);
		}

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(email)
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			ProductType policyProductType = (policy.getPolicyPlan() != null && policy.getPolicyPlan().getInsuranceProduct() != null)
					? policy.getPolicyPlan().getInsuranceProduct().getProductType() : null;

			if (staffSpeciality == null || !staffSpeciality.equals(policyProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_VIEW_DENIED);
			}
		}

		PolicyResponseDTO responseDTO = convertToResponseDTO(policy);
		return new ApiResponseDTO<>(MessageConstants.Policy.DETAILS_RETRIEVED, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getAllPolicies(int pageNumber, int pageSize, String sortBy,
			String sortDirection, Long customerId, String status, String policyNumber) {

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "policyNumber", "policyStatus", "totalPremiumPaid"));

		Sort sort = sortDirection.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
		Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		Specification<Policy> spec = (root, query, cb) -> cb.conjunction();

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			if (staffSpeciality == null) {
				spec = spec.and((root, query, cb) -> cb.disjunction());
			} else {
				spec = spec.and((root, query, cb) -> cb.equal(root.get("policyPlan").get("insuranceProduct").get("productType"), staffSpeciality));
			}
		}
		
		if (customerId != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId));
		}
		
		if (status != null && !status.trim().isEmpty()) {
			try {
				PolicyStatus statusEnum = PolicyStatus.valueOf(status.trim().toUpperCase());
				spec = spec.and((root, query, cb) -> cb.equal(root.get("policyStatus"), statusEnum));
			} catch (IllegalArgumentException e) {
				throw new BadRequestException(MessageConstants.Policy.INVALID_STATUS_FILTER + status);
			}
		}

		if (policyNumber != null && !policyNumber.trim().isEmpty()) {
			spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("policyNumber")), "%" + policyNumber.trim().toLowerCase() + "%"));
		}


		Page<Policy> policyPage = policyRepository.findAll(spec, pageable);

		List<PolicyResponseDTO> content = policyPage.getContent().stream().map(this::convertToResponseDTO).toList();

		PageResponseDTO<PolicyResponseDTO> pageResponse = new PageResponseDTO<>(content, policyPage.getNumber(), policyPage.getSize(),
				policyPage.getTotalElements(), policyPage.getTotalPages(), policyPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Policy.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getCustomerPolicies(String email, int pageNumber, int pageSize, String sortBy,
			String sortDirection) {

		Customer customer = customerRepository.findByUserEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Customer.PROFILE_NOT_FOUND));

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "policyNumber", "policyStatus", "totalPremiumPaid"));

		Sort sort = sortDirection.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

		Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

		Page<Policy> policyPage = policyRepository.findByCustomerId(customer.getId(), pageable);

		List<PolicyResponseDTO> content = policyPage.getContent().stream().map(this::convertToResponseDTO).toList();

		PageResponseDTO<PolicyResponseDTO> pageResponse = new PageResponseDTO<>(content, policyPage.getNumber(), policyPage.getSize(),
				policyPage.getTotalElements(), policyPage.getTotalPages(), policyPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Policy.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<PolicyResponseDTO>> getPoliciesByCustomer(Long customerId, int pageNumber, int pageSize, String sortBy,
			String sortDirection) {

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "policyNumber", "policyStatus", "totalPremiumPaid"));

		Sort sort = sortDirection.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

		Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		Specification<Policy> spec = (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			if (staffSpeciality == null) {
				spec = spec.and((root, query, cb) -> cb.disjunction());
			} else {
				spec = spec.and((root, query, cb) -> cb.equal(root.get("policyPlan").get("insuranceProduct").get("productType"), staffSpeciality));
			}
		}

		Page<Policy> policyPage = policyRepository.findAll(spec, pageable);

		List<PolicyResponseDTO> content = policyPage.getContent().stream().map(this::convertToResponseDTO).toList();

		PageResponseDTO<PolicyResponseDTO> pageResponse = new PageResponseDTO<>(content, policyPage.getNumber(), policyPage.getSize(),
				policyPage.getTotalElements(), policyPage.getTotalPages(), policyPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Policy.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	@Transactional(rollbackFor = Exception.class)
	public ApiResponseDTO<PolicyResponseDTO> cancelPolicy(Long policyId) {

		Policy policy = policyRepository.findById(policyId).orElseThrow(() -> new PolicyNotFoundException(policyId));

		if (policy.getPolicyStatus() == PolicyStatus.CANCELLED || policy.getPolicyStatus() == PolicyStatus.EXPIRED) {
			throw new BadRequestException(MessageConstants.Policy.CANCEL_INACTIVE_RESTRICTED + policy.getPolicyStatus().name());
		}

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));
		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			ProductType policyProductType = (policy.getPolicyPlan() != null && policy.getPolicyPlan().getInsuranceProduct() != null)
					? policy.getPolicyPlan().getInsuranceProduct().getProductType() : null;
			if (staffSpeciality == null || !staffSpeciality.equals(policyProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_CANCEL_DENIED);
			}
		}

		// Block cancellation if any claim is still open
		List<ClaimStatus> openStatuses = List.of(ClaimStatus.SUBMITTED, ClaimStatus.UNDER_REVIEW, ClaimStatus.RECOMMENDED_FOR_APPROVAL, ClaimStatus.RECOMMENDED_FOR_REJECTION);
		boolean hasOpenClaims = policy.getClaims().stream()
				.anyMatch(c -> openStatuses.contains(c.getClaimStatus()));
		if (hasOpenClaims) {
			throw new BadRequestException(MessageConstants.Policy.CANCEL_WITH_OPEN_CLAIMS);
		}

		policy.setPolicyStatus(PolicyStatus.CANCELLED);

		Policy updatedPolicy = policyRepository.save(policy);

		PolicyResponseDTO responseDTO = convertToResponseDTO(updatedPolicy);

		return new ApiResponseDTO<>(MessageConstants.Policy.CANCELLED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	private PolicyResponseDTO convertToResponseDTO(Policy policy) {

		PolicyResponseDTO dto = modelMapper.map(policy, PolicyResponseDTO.class);

		dto.setPolicyId(policy.getId());

		dto.setCustomerId(policy.getCustomer().getId());

		BigDecimal activeClaimsSum = claimRepository.sumActiveClaimsByPolicyId(policy.getId(), ClaimStatus.REJECTED);
		// Remaining is now calculated from selectedCoverage
		BigDecimal remaining = policy.getSelectedCoverage().subtract(activeClaimsSum != null ? activeClaimsSum : BigDecimal.ZERO);
		dto.setRemainingClaimAmount(remaining);

		dto.setCustomerName(policy.getCustomer().getUser().getFullName());

		dto.setPlanId(policy.getPolicyPlan().getId());

		dto.setPlanName(policy.getPolicyPlan().getPlanName());

		dto.setPolicyStatus(policy.getPolicyStatus().name());

		dto.setProductType(policy.getPolicyPlan().getInsuranceProduct().getProductType().name());
		
		// Map the new fields explicitely
		dto.setSelectedCoverage(policy.getSelectedCoverage());
		dto.setCalculatedPremium(policy.getCalculatedPremium());
		dto.setPremiumType(policy.getPremiumType().name());

		return dto;
	}

	private boolean isCustomerProfileComplete(Customer customer) {
		if (customer == null) return false;
		if (customer.getDateOfBirth() == null) return false;
		if (customer.getAddress() == null || customer.getAddress().trim().isEmpty()) return false;
		if (customer.getCity() == null || customer.getCity().trim().isEmpty()) return false;
		if (customer.getState() == null || customer.getState().trim().isEmpty()) return false;
		if (customer.getPinCode() == null || customer.getPinCode().trim().isEmpty()) return false;
		if (customer.getNomineeName() == null || customer.getNomineeName().trim().isEmpty()) return false;
		if (customer.getNomineeRelation() == null || customer.getNomineeRelation().trim().isEmpty()) return false;
		return true;
	}

}

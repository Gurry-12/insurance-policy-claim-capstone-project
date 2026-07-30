package com.insurance.demo.serviceimpl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.request.PaymentRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.PaymentResponseDTO;
import com.insurance.demo.enums.PaymentStatus;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Policy;
import com.insurance.demo.model.PremiumPayment;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.repository.PremiumPaymentRepository;
import com.insurance.demo.service.PremiumPaymentService;
import com.insurance.demo.util.MessageConstants;
import com.insurance.demo.util.PaginationValidator;
import com.insurance.demo.util.TransactionReferenceGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PremiumPaymentServiceImpl implements PremiumPaymentService {

	private final PremiumPaymentRepository paymentRepository;
	private final PolicyRepository policyRepository;
	private final ModelMapper modelMapper;
	private final AppUserRepository userRepository;

	@Override
	@Transactional
	public ApiResponseDTO<PaymentResponseDTO> recordPayment(PaymentRequestDTO dto) {

		log.info("Recording payment for policy id: {}", dto.getPolicyId());

		Policy policy = policyRepository.findById(dto.getPolicyId())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + dto.getPolicyId()));

		String email = SecurityContextHolder.getContext().getAuthentication().getName();

		boolean isCustomer = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));

		if (isCustomer && !policy.getCustomer().getUser().getEmail().equals(email)) {
			throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_POLICY_PAYMENT);
		}

		boolean isStaff = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(email)
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			com.insurance.demo.enums.ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			com.insurance.demo.enums.ProductType policyProductType = (policy.getPolicyPlan() != null && policy.getPolicyPlan().getInsuranceProduct() != null)
					? policy.getPolicyPlan().getInsuranceProduct().getProductType() : null;

			if (staffSpeciality == null || !staffSpeciality.equals(policyProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_RECORD_PAYMENT_DENIED);
			}
		}

		if (policy.getCalculatedPremium().compareTo(dto.getAmount()) != 0) {
			throw new BadRequestException(MessageConstants.Payment.AMOUNT_MISMATCH);
		}

		if (PolicyStatus.CANCELLED.equals(policy.getPolicyStatus())) {
			throw new BadRequestException(MessageConstants.Payment.CANCELLED_POLICY_RESTRICTED);
		}

		if (PolicyStatus.EXPIRED.equals(policy.getPolicyStatus())) {
			throw new BadRequestException(MessageConstants.Payment.EXPIRED_POLICY_RESTRICTED);
		}

		// one time payment
		if (policy.getPremiumType().equals(PremiumType.ONE_TIME)) {
			// verify any existing payment for this policy -
			if (paymentRepository.existsByPolicyIdAndPaymentStatus(policy.getId(), PaymentStatus.SUCCESS)) {

				throw new BadRequestException(MessageConstants.Payment.ONE_TIME_ALREADY_PAID);
			}

		}

		// annual payment
		if (policy.getPremiumType().equals(PremiumType.ANNUAL)) {

			Optional<PremiumPayment> payment = paymentRepository
					.findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc(policy.getId(), PaymentStatus.SUCCESS);

			if (payment.isPresent()) {

				PremiumPayment latestPayment = payment.get();

				LocalDateTime nextEligibleDate = latestPayment.getPaymentDate().plusYears(1);
				LocalDateTime paymentWindowStart = nextEligibleDate.minusDays(15);

				if (LocalDateTime.now().isBefore(paymentWindowStart)) {
					throw new BadRequestException(
							MessageConstants.Payment.EARLY_PAYMENT_RESTRICTION + paymentWindowStart.toLocalDate() + " (includes 15-day early payment window)");
				}
			}

			long successfulPayments = paymentRepository.countByPolicyIdAndPaymentStatus(policy.getId(),
					PaymentStatus.SUCCESS);

			if (successfulPayments >= policy.getPolicyDuration()) {
				throw new BadRequestException(MessageConstants.Payment.ALL_PREMIUMS_PAID);
			}
		}

		String transactionReferance = TransactionReferenceGenerator.generateTransactionReference();

		if (paymentRepository.existsByTransactionReference(transactionReferance)) {
			throw new DuplicateResourceException(MessageConstants.Payment.DUPLICATE_REFERENCE);
		}

		// Fix: compare against total required premium (premiumAmount * duration), not coverage amount
		BigDecimal totalRequiredPremium = policy.getCalculatedPremium()
				.multiply(BigDecimal.valueOf(policy.getPolicyDuration()));
		if (policy.getTotalPremiumPaid().add(dto.getAmount()).compareTo(totalRequiredPremium) > 0) {
			throw new BadRequestException(MessageConstants.Payment.PREMIUM_LIMIT_EXCEEDED);
		}

		PremiumPayment payment = new PremiumPayment();
		payment.setAmount(dto.getAmount());
		payment.setPaymentMode(dto.getPaymentMode());
		payment.setTransactionReference(transactionReferance);
		payment.setPolicy(policy);
		payment.setPaymentDate(LocalDateTime.now());

		if (PaymentStatus.SUCCESS.equals(dto.getPaymentStatus())) {
			payment.setPaymentStatus(PaymentStatus.SUCCESS);
		}

		if (PaymentStatus.FAILED.equals(dto.getPaymentStatus())) {
			payment.setPaymentStatus(PaymentStatus.FAILED);
		}

		PremiumPayment savedPayment = paymentRepository.save(payment);

		if (PaymentStatus.SUCCESS.equals(dto.getPaymentStatus())) {
			policy.setTotalPremiumPaid(policy.getTotalPremiumPaid().add(dto.getAmount()));
			policy.setPolicyStatus(PolicyStatus.ACTIVE);
		}

		policyRepository.save(policy);

		PaymentResponseDTO responseDTO = modelMapper.map(savedPayment, PaymentResponseDTO.class);
		responseDTO.setPolicyNumber(policy.getPolicyNumber());

		return new ApiResponseDTO<>(MessageConstants.Payment.RECORDED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<PaymentResponseDTO>> getPaymentsByPolicy(Long id) {
		log.info("Fetching payments by policy: {}", id);

		Policy policy = policyRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + id));

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			com.insurance.demo.enums.ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			com.insurance.demo.enums.ProductType policyProductType = (policy.getPolicyPlan() != null && policy.getPolicyPlan().getInsuranceProduct() != null)
					? policy.getPolicyPlan().getInsuranceProduct().getProductType() : null;

			if (staffSpeciality == null || !staffSpeciality.equals(policyProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_VIEW_PAYMENT_DENIED);
			}
		}

		List<PremiumPayment> list = paymentRepository.findByPolicyId(id);

		List<PaymentResponseDTO> responseList = list.stream()
				.map(payment -> {
					PaymentResponseDTO dto = modelMapper.map(payment, PaymentResponseDTO.class);
					dto.setPolicyNumber(payment.getPolicy().getPolicyNumber());
					return dto;
				}).toList();

		return new ApiResponseDTO<>(MessageConstants.Payment.FETCHED_SUCCESS, true, responseList, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PaymentResponseDTO> getPaymentById(Long paymentId) {
		log.info("Fetching payments by paymentid: {}", paymentId);

		PremiumPayment payment = paymentRepository.findById(paymentId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + paymentId));

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String email = authentication.getName();
		boolean isCustomer = authentication.getAuthorities()
				.stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));

		if (isCustomer && (payment.getPolicy() == null || payment.getPolicy().getCustomer() == null ||
				payment.getPolicy().getCustomer().getUser() == null ||
				!payment.getPolicy().getCustomer().getUser().getEmail().equals(email))) {
			throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_PAYMENT);
		}

		boolean isStaff = authentication.getAuthorities()
				.stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(email)
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			com.insurance.demo.enums.ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			com.insurance.demo.enums.ProductType policyProductType = (payment.getPolicy() != null && payment.getPolicy().getPolicyPlan() != null && payment.getPolicy().getPolicyPlan().getInsuranceProduct() != null)
					? payment.getPolicy().getPolicyPlan().getInsuranceProduct().getProductType() : null;

			if (staffSpeciality == null || !staffSpeciality.equals(policyProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_VIEW_PAYMENT_DENIED);
			}
		}

		PaymentResponseDTO responseDTO = modelMapper.map(payment, PaymentResponseDTO.class);
		responseDTO.setPolicyNumber(payment.getPolicy().getPolicyNumber());

		return new ApiResponseDTO<>(MessageConstants.Payment.FETCHED_SUCCESS, true, responseDTO, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<PaymentResponseDTO>> getAllPaymentsWithPagination(int pageNumber, int pageSize, String sortBy,
			String sortDirection, Long policyId, String paymentStatus, String transactionId, Double minAmount, Double maxAmount) {

		log.info("Fetching Payments with pagination. pageNumber: {}, pageSize: {}, sortBy: {}, sortDirection: {}, policyId: {}, status: {}",
				pageNumber, pageSize, sortBy, sortDirection, policyId, paymentStatus);
		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "amount", "paymentDate", "paymentMode", "paymentStatus"));

		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(getSortDirection(sortDirection), sortBy));

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		Specification<PremiumPayment> spec = (root, query, cb) -> cb.conjunction();

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			com.insurance.demo.enums.ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			if (staffSpeciality == null) {
				spec = spec.and((root, query, cb) -> cb.disjunction());
			} else {
				spec = spec.and((root, query, cb) -> cb.equal(root.get("policy").get("policyPlan").get("insuranceProduct").get("productType"), staffSpeciality));
			}
		}
		
		if (policyId != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("policy").get("id"), policyId));
		}
		
		if (paymentStatus != null && !paymentStatus.trim().isEmpty()) {
			try {
				com.insurance.demo.enums.PaymentStatus statusEnum = com.insurance.demo.enums.PaymentStatus.valueOf(paymentStatus.trim().toUpperCase());
				spec = spec.and((root, query, cb) -> cb.equal(root.get("paymentStatus"), statusEnum));
			} catch (IllegalArgumentException e) {
				throw new BadRequestException(MessageConstants.Payment.INVALID_STATUS_FILTER + paymentStatus);
			}
		}

		if (transactionId != null && !transactionId.trim().isEmpty()) {
			spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("transactionReference")), "%" + transactionId.trim().toLowerCase() + "%"));
		}

		if (minAmount != null) {
			spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
		}
		if (maxAmount != null) {
			spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
		}

		Page<PremiumPayment> paymentPage = paymentRepository.findAll(spec, pageable);

		List<PaymentResponseDTO> content = paymentPage.getContent().stream()
				.map(payment -> {
					PaymentResponseDTO dto = modelMapper.map(payment, PaymentResponseDTO.class);
					dto.setPolicyNumber(payment.getPolicy().getPolicyNumber());
					return dto;
				}).toList();
		PageResponseDTO<PaymentResponseDTO> pageResponse = new PageResponseDTO<>(content, paymentPage.getNumber(), paymentPage.getSize(),
				paymentPage.getTotalElements(), paymentPage.getTotalPages(), paymentPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Payment.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}


	private Direction getSortDirection(String sortDirection) {
		if (sortDirection == null || sortDirection.equalsIgnoreCase("asc"))
			return Sort.Direction.ASC;
		if (sortDirection.equalsIgnoreCase("desc"))
			return Sort.Direction.DESC;
		throw new BadRequestException(MessageConstants.Common.SORT_DIRECTION_INVALID);
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<PaymentResponseDTO>> getMyPayments() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String email = authentication.getName();
		AppUser user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		log.info("Fetching payment history for customer email: {}", email);
		List<PremiumPayment> payments = paymentRepository.findByPolicyCustomerUserId(user.getId());

		List<PaymentResponseDTO> responseList = payments.stream()
				.map(payment -> {
					PaymentResponseDTO dto = modelMapper.map(payment, PaymentResponseDTO.class);
					dto.setPolicyNumber(payment.getPolicy().getPolicyNumber());
					return dto;
				}).toList();

		return new ApiResponseDTO<>(MessageConstants.Payment.HISTORY_FETCHED, true, responseList, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<PaymentResponseDTO>> getPaymentsByMyPolicy(Long policyId) {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String email = authentication.getName();
		AppUser user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		log.info("Fetching payments for policy ID: {} by customer email: {}", policyId, email);
		List<PremiumPayment> payments = paymentRepository.findByPolicyIdAndPolicyCustomerUserId(policyId, user.getId());

		List<PaymentResponseDTO> responseList = payments.stream()
				.map(payment -> {
					PaymentResponseDTO dto = modelMapper.map(payment, PaymentResponseDTO.class);
					dto.setPolicyNumber(payment.getPolicy().getPolicyNumber());
					return dto;
				}).toList();

		return new ApiResponseDTO<>(MessageConstants.Payment.POLICY_PAYMENTS_FETCHED, true, responseList, LocalDateTime.now());
	}

}

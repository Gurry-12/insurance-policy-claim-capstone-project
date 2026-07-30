package com.insurance.demo.serviceimpl;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.insurance.demo.dto.request.ClaimRequestDTO;
import com.insurance.demo.dto.request.ClaimReviewRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.ClaimDocumentResponseDTO;
import com.insurance.demo.dto.response.ClaimHistoryResponseDTO;
import com.insurance.demo.dto.response.ClaimResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.enums.ClaimStatus;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.exception.BadRequestException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Claim;
import com.insurance.demo.model.ClaimStatusHistory;
import com.insurance.demo.model.Policy;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.ClaimDocumentRepository;
import com.insurance.demo.repository.ClaimRepository;
import com.insurance.demo.repository.ClaimStatusHistoryRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.service.ClaimDocumentService;
import com.insurance.demo.service.ClaimService;
import com.insurance.demo.util.ClaimNumberGenerator;
import com.insurance.demo.util.MessageConstants;
import com.insurance.demo.util.PaginationValidator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

	private final ClaimRepository claimRepository;
	private final PolicyRepository policyRepository;
	private final ClaimStatusHistoryRepository historyRepository;
	private final AppUserRepository userRepository;
	private final ClaimDocumentService claimDocumentService;
	private final ClaimDocumentRepository claimDocumentRepository;
	private final ModelMapper modelMapper;

	@Override
	@Transactional
	public ApiResponseDTO<ClaimResponseDTO> raiseClaim(ClaimRequestDTO dto, List<MultipartFile> files)
			throws IOException {// Customer only

		if (files == null || files.isEmpty()) {
			throw new ResourceNotFoundException(MessageConstants.Document.AT_LEAST_ONE_REQUIRED);
		}

		for (MultipartFile file : files) {

			if (file == null || file.isEmpty()) {
				throw new BadRequestException(MessageConstants.Document.CANNOT_BE_EMPTY);
			}

			if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
				throw new BadRequestException(MessageConstants.Document.INVALID_FILE_NAME);
			}

			String contentType = file.getContentType();
			if (contentType == null || !(contentType.equals("application/pdf") || contentType.startsWith("image/"))) {
				throw new BadRequestException(MessageConstants.Document.INVALID_FILE_TYPE_PDF_IMAGE);
			}

			if (file.getSize() > 5 * 1024 * 1024) { // 5MB limit
				throw new BadRequestException(MessageConstants.Document.EXCEEDS_SIZE_5MB);
			}
		}

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String email = auth.getName();

		if (dto.getClaimAmount() == null || dto.getClaimAmount().compareTo(BigDecimal.ZERO) <= 0) {
			throw new BadRequestException(MessageConstants.Claim.AMOUNT_MUST_BE_POSITIVE);
		}

		// Find Policy
		Policy policy = policyRepository.findById(dto.getPolicyId())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.PolicyPlan.NOT_FOUND + dto.getPolicyId()));

		// SRS Business Rules
		if (!policy.getCustomer().getUser().getEmail().equals(email)) {
			throw new BadRequestException(MessageConstants.Claim.POLICY_NOT_OWNED);
		}

		if (!List.of(PolicyStatus.ACTIVE).contains(policy.getPolicyStatus())) {
			throw new BadRequestException(MessageConstants.Claim.POLICY_NOT_ACTIVE);
		}

		BigDecimal activeClaimsSum = claimRepository.sumActiveClaimsByPolicyId(policy.getId(), ClaimStatus.REJECTED);
		BigDecimal remainingCoverage = policy.getSelectedCoverage().subtract(activeClaimsSum);

		if (dto.getClaimAmount().compareTo(remainingCoverage) > 0) {
			throw new BadRequestException(
					MessageConstants.Claim.EXCEEDS_LIMIT + remainingCoverage);
		}

		if (dto.getIncidentDate().isAfter(LocalDate.now())) {
			throw new BadRequestException(MessageConstants.Claim.FUTURE_INCIDENT_DATE);
		}

		if (dto.getIncidentDate().isBefore(policy.getStartDate())
				|| dto.getIncidentDate().isAfter(policy.getEndDate())) {
			throw new BadRequestException(MessageConstants.Claim.INCIDENT_DATE_OUT_OF_BOUNDS);
		}

		// Create Claim
		Claim claim = new Claim();
		claim.setPolicy(policy);
		claim.setClaimAmount(dto.getClaimAmount());
		claim.setClaimReason(dto.getClaimReason());
		claim.setIncidentDate(dto.getIncidentDate().atStartOfDay());
		claim.setClaimStatus(ClaimStatus.SUBMITTED);
		claim.setClaimNumber(ClaimNumberGenerator.generateClaimNumber());

		Claim savedClaim = claimRepository.save(claim);

		List<ClaimDocumentResponseDTO> response = claimDocumentService.addDocumentsToClaim(savedClaim.getId(), files);

		// Record History
		recordClaimHistory(savedClaim, null, ClaimStatus.SUBMITTED, "Claim submitted by customer with documents",
				email);

		ClaimResponseDTO responseDto = convertToResponseDTO(savedClaim);

		responseDto.setDocuments(response);

		return new ApiResponseDTO<>(MessageConstants.Claim.SUBMITTED_SUCCESS, true, responseDto,
				LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<ClaimResponseDTO> reviewClaim(Long claimId, ClaimReviewRequestDTO dto) {

		if (dto.getRecommendedStatus() != ClaimStatus.RECOMMENDED_FOR_APPROVAL
				&& dto.getRecommendedStatus() != ClaimStatus.RECOMMENDED_FOR_REJECTION) {

			throw new BadRequestException(MessageConstants.ClaimReview.STAFF_RECOMMENDATION_ONLY);
		}

		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + claimId));

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		AppUser currentUser = userRepository.findByEmail(auth.getName())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
		ProductType claimProductType = (claim.getPolicy() != null && claim.getPolicy().getPolicyPlan() != null && claim.getPolicy().getPolicyPlan().getInsuranceProduct() != null)
				? claim.getPolicy().getPolicyPlan().getInsuranceProduct().getProductType() : null;

		if (staffSpeciality == null || !staffSpeciality.equals(claimProductType)) {
			throw new AccessDeniedException(MessageConstants.Security.STAFF_SPECIALITY_ACCESS_DENIED);
		}

		if (claim.getAssignedStaff() == null || !claim.getAssignedStaff().getId().equals(currentUser.getId())) {
			throw new AccessDeniedException(MessageConstants.Security.REVIEW_ASSIGNED_TO_OTHER);
		}

		if (claim.getClaimStatus() == ClaimStatus.APPROVED || claim.getClaimStatus() == ClaimStatus.REJECTED) {
			throw new BadRequestException(MessageConstants.ClaimReview.ALREADY_FINALIZED);
		}

		if (claim.getClaimStatus() != ClaimStatus.UNDER_REVIEW) {
			throw new BadRequestException(MessageConstants.ClaimReview.MUST_BE_UNDER_REVIEW);
		}

		ClaimStatus previous = claim.getClaimStatus();

		claim.setAssignedStaff(currentUser);

		claim.setClaimStatus(dto.getRecommendedStatus());
		claim.setStaffRemarks(dto.getRemarks());

		Claim updated = claimRepository.save(claim);

		recordClaimHistory(updated, previous, claim.getClaimStatus(), dto.getRemarks(),
				SecurityContextHolder.getContext().getAuthentication().getName());

		ClaimResponseDTO response = convertToResponseDTO(updated);
		return new ApiResponseDTO<>(MessageConstants.ClaimReview.RECOMMENDATION_SUBMITTED, true, response,
				LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<ClaimResponseDTO> finalDecision(Long claimId, ClaimReviewRequestDTO dto) {

		if (dto.getRecommendedStatus() != ClaimStatus.APPROVED && dto.getRecommendedStatus() != ClaimStatus.REJECTED) {

			throw new BadRequestException(MessageConstants.ClaimReview.ADMIN_DECISION_ONLY);
		}

		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + claimId));

		if (claim.getClaimStatus() == ClaimStatus.APPROVED || claim.getClaimStatus() == ClaimStatus.REJECTED) {
			throw new BadRequestException(MessageConstants.ClaimReview.DECISION_ALREADY_MADE);
		}

		if (claim.getClaimStatus() != ClaimStatus.RECOMMENDED_FOR_APPROVAL
				&& claim.getClaimStatus() != ClaimStatus.RECOMMENDED_FOR_REJECTION) {

			throw new BadRequestException(MessageConstants.ClaimReview.MUST_BE_REVIEWED_FIRST);
		}

		ClaimStatus previous = claim.getClaimStatus();

		claim.setClaimStatus(dto.getRecommendedStatus()); // ADMIN final decision
		claim.setAdminRemarks(dto.getRemarks());

		Claim updated = claimRepository.save(claim);

		recordClaimHistory(updated, previous, claim.getClaimStatus(), dto.getRemarks(),
				SecurityContextHolder.getContext().getAuthentication().getName());

		ClaimResponseDTO response = convertToResponseDTO(updated);
		return new ApiResponseDTO<>(MessageConstants.ClaimReview.FINAL_DECISION_RECORDED, true, response,
				LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<ClaimResponseDTO> getClaimById(Long claimId) {
		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + claimId));

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String loggedInEmail = authentication.getName();
		boolean isCustomer = authentication.getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
		boolean isStaff = authentication.getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isCustomer && (claim.getPolicy() == null || claim.getPolicy().getCustomer() == null
				|| claim.getPolicy().getCustomer().getUser() == null
				|| !claim.getPolicy().getCustomer().getUser().getEmail().equals(loggedInEmail))) {
			throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_CLAIM);
		}

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(loggedInEmail)
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			ProductType claimProductType = (claim.getPolicy() != null && claim.getPolicy().getPolicyPlan() != null && claim.getPolicy().getPolicyPlan().getInsuranceProduct() != null)
					? claim.getPolicy().getPolicyPlan().getInsuranceProduct().getProductType() : null;

			if (staffSpeciality == null || !staffSpeciality.equals(claimProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_VIEW_CLAIM_DENIED);
			}
		}

		List<ClaimDocumentResponseDTO> documents = claimDocumentRepository.findByClaimId(claim.getId()).stream()
				.map(document -> modelMapper.map(document, ClaimDocumentResponseDTO.class)).toList();

		ClaimResponseDTO response = convertToResponseDTO(claim);
		response.setDocuments(documents);
		return new ApiResponseDTO<>(MessageConstants.Claim.DETAILS_RETRIEVED, true, response, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<ClaimResponseDTO>> getClaimsByPolicyId(Long policyId) {
		List<Claim> claims = claimRepository.findByPolicyId(policyId);
		List<ClaimResponseDTO> responseList = new java.util.ArrayList<>();
		for (Claim claim : claims) {
			List<com.insurance.demo.dto.response.ClaimDocumentResponseDTO> documents = claimDocumentRepository
					.findByClaimId(claim.getId()).stream().map(document -> modelMapper.map(document,
							com.insurance.demo.dto.response.ClaimDocumentResponseDTO.class))
					.toList();
			ClaimResponseDTO response = convertToResponseDTO(claim);
			response.setDocuments(documents);
			responseList.add(response);
		}
		return new ApiResponseDTO<>(MessageConstants.Claim.CLAIMS_RETRIEVED, true, responseList, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<ClaimResponseDTO>> getMyClaims() {

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String email = auth.getName();

		AppUser user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		List<Claim> claims = claimRepository.findByPolicyCustomerUserId(user.getId());

		List<ClaimResponseDTO> responseList = new ArrayList<>();

		for (Claim claim : claims) {
			List<ClaimDocumentResponseDTO> documents = claimDocumentRepository.findByClaimId(claim.getId()).stream()
					.map(document -> modelMapper.map(document, ClaimDocumentResponseDTO.class)).toList();
			ClaimResponseDTO responseDTO = convertToResponseDTO(claim);
			responseDTO.setDocuments(documents);
			responseList.add(responseDTO);
		}

		return new ApiResponseDTO<>(MessageConstants.Claim.CUSTOMER_CLAIMS_RETRIEVED, true, responseList, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<ClaimResponseDTO>> getAllClaimsWithPagination(int pageNumber, int pageSize, String sortBy,
			String sortDirection, Long customerId, String status, Double minClaimAmount, Double maxClaimAmount) {

		log.info("Fetching claims with pagination: page={}, size={}, sortBy={}, customerId={}, status={}, minAmt={}, maxAmt={}", pageNumber,
				pageSize, sortBy, customerId, status, minClaimAmount, maxClaimAmount);

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "claimNumber", "claimAmount", "createdDate",
				"claimStatus", "policyNumber", "policy.policyNumber"));

		String mappedSortBy = "policyNumber".equals(sortBy) ? "policy.policyNumber" : sortBy;
		Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, mappedSortBy));

		Specification<Claim> spec = (root, query, cb) -> cb.conjunction();
		
		if (customerId != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("policy").get("customer").get("id"), customerId));
		}
		
		if (status != null && !status.trim().isEmpty()) {
			try {
				ClaimStatus claimStatus = ClaimStatus.valueOf(status.toUpperCase());
				spec = spec.and((root, query, cb) -> cb.equal(root.get("claimStatus"), claimStatus));
			} catch (IllegalArgumentException e) {
				throw new BadRequestException(MessageConstants.Claim.INVALID_STATUS_FILTER + status);
			}
		}

		if (minClaimAmount != null) {
			spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("claimAmount"), minClaimAmount));
		}
		
		if (maxClaimAmount != null) {
			spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("claimAmount"), maxClaimAmount));
		}

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String email = auth.getName();
		AppUser currentUser = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
		boolean isInternalStaff = auth.getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isInternalStaff) {
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			if (staffSpeciality == null) {
				// Staff without a speciality should see no claims
				spec = spec.and((root, query, cb) -> cb.disjunction()); // false condition
			} else {
				spec = spec.and((root, query, cb) -> cb.equal(root.get("policy").get("policyPlan").get("insuranceProduct").get("productType"), staffSpeciality));
			}
		}

		Page<Claim> claimPage = claimRepository.findAll(spec, pageable);

		List<ClaimResponseDTO> content = claimPage.getContent().stream().map(this::convertToResponseDTO).toList();

		PageResponseDTO<ClaimResponseDTO> pageResponse = new PageResponseDTO<>(content, claimPage.getNumber(), claimPage.getSize(), claimPage.getTotalElements(),
				claimPage.getTotalPages(), claimPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Claim.ALL_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<ClaimHistoryResponseDTO>> getClaimHistory(Long claimId, int pageNumber, int pageSize,
			String sortBy, String sortDirection, String updatedBy, String status) {

		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + claimId));

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String loggedInEmail = authentication.getName();
		boolean isCustomer = authentication.getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
		boolean isStaff = authentication.getAuthorities().stream()
				.anyMatch(a -> a.getAuthority().equals("ROLE_INTERNAL_STAFF"));

		if (isCustomer && (claim.getPolicy() == null || claim.getPolicy().getCustomer() == null
				|| claim.getPolicy().getCustomer().getUser() == null
				|| !claim.getPolicy().getCustomer().getUser().getEmail().equals(loggedInEmail))) {
			throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_CLAIM_HISTORY);
		}

		if (isStaff) {
			AppUser currentUser = userRepository.findByEmail(loggedInEmail)
					.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
			ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
			ProductType claimProductType = (claim.getPolicy() != null && claim.getPolicy().getPolicyPlan() != null && claim.getPolicy().getPolicyPlan().getInsuranceProduct() != null)
					? claim.getPolicy().getPolicyPlan().getInsuranceProduct().getProductType() : null;

			if (staffSpeciality == null || !staffSpeciality.equals(claimProductType)) {
				throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_CLAIM_HISTORY_DENIED);
			}
		}

		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy, Set.of("id", "updatedDate", "newStatus", "updatedBy"));

		Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(direction, sortBy));

		Page<ClaimStatusHistory> historyPage;
		boolean hasUpdatedBy = updatedBy != null && !updatedBy.trim().isEmpty();
		boolean hasStatus = status != null && !status.trim().isEmpty();

		if (hasUpdatedBy && hasStatus) {
			historyPage = historyRepository.findByClaimIdAndUpdatedByContainingIgnoreCaseAndNewStatus(claimId,
					updatedBy.trim(), status.trim(), pageable);
		} else if (hasUpdatedBy) {
			historyPage = historyRepository.findByClaimIdAndUpdatedByContainingIgnoreCase(claimId, updatedBy.trim(),
					pageable);
		} else if (hasStatus) {
			historyPage = historyRepository.findByClaimIdAndNewStatus(claimId, status.trim(), pageable);
		} else {
			historyPage = historyRepository.findByClaimId(claimId, pageable);
		}

		List<ClaimHistoryResponseDTO> content = historyPage.getContent().stream().map(this::convertToHistoryResponseDTO)
				.toList();

		PageResponseDTO<ClaimHistoryResponseDTO> pageResponse = new PageResponseDTO<>(content, historyPage.getNumber(), historyPage.getSize(),
				historyPage.getTotalElements(), historyPage.getTotalPages(), historyPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Claim.HISTORY_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<ClaimResponseDTO> underReviewClaim(Long claimId) {

		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + claimId));

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		AppUser currentUser = userRepository.findByEmail(auth.getName())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
		ProductType claimProductType = (claim.getPolicy() != null && claim.getPolicy().getPolicyPlan() != null && claim.getPolicy().getPolicyPlan().getInsuranceProduct() != null)
				? claim.getPolicy().getPolicyPlan().getInsuranceProduct().getProductType() : null;

		if (staffSpeciality == null || !staffSpeciality.equals(claimProductType)) {
			throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_TRANSITION_DENIED);
		}

		if (claim.getClaimStatus() == ClaimStatus.APPROVED || claim.getClaimStatus() == ClaimStatus.REJECTED) {
			throw new BadRequestException(MessageConstants.ClaimReview.ALREADY_FINALIZED);
		}

		if (claim.getClaimStatus() != ClaimStatus.SUBMITTED) {
			throw new BadRequestException(MessageConstants.ClaimReview.MOVE_TO_UNDER_REVIEW_RESTRICTED);
		}

		ClaimStatus previous = claim.getClaimStatus();

		// Staff recommends
		claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
		claim.setStaffRemarks("Claim under review");

		Claim updated = claimRepository.save(claim);

		recordClaimHistory(updated, previous, claim.getClaimStatus(), updated.getStaffRemarks(),
				SecurityContextHolder.getContext().getAuthentication().getName());

		ClaimResponseDTO response = convertToResponseDTO(updated);
		return new ApiResponseDTO<>(MessageConstants.Claim.STATUS_UPDATED_REVIEW, true, response, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<ClaimResponseDTO> assignStaff(Long claimId) {

		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Product.NOT_FOUND + claimId));

		if (claim.getClaimStatus() != ClaimStatus.SUBMITTED) {
			throw new BadRequestException(MessageConstants.ClaimReview.ASSIGN_MUST_BE_SUBMITTED);
		}

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		AppUser currentUser = userRepository.findByEmail(auth.getName())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		ProductType staffSpeciality = (currentUser.getStaffSpeciality() != null) ? currentUser.getStaffSpeciality().getProductSpeciality() : null;
		ProductType claimProductType = (claim.getPolicy() != null && claim.getPolicy().getPolicyPlan() != null && claim.getPolicy().getPolicyPlan().getInsuranceProduct() != null)
				? claim.getPolicy().getPolicyPlan().getInsuranceProduct().getProductType() : null;

		if (staffSpeciality == null || !staffSpeciality.equals(claimProductType)) {
			throw new AccessDeniedException(MessageConstants.Security.SPECIALITY_ASSIGN_DENIED);
		}

		if (claim.getAssignedStaff() != null && !claim.getAssignedStaff().getId().equals(currentUser.getId())) {
			throw new BadRequestException(MessageConstants.ClaimReview.ALREADY_ASSIGNED);
		}

		claim.setAssignedStaff(currentUser);
		Claim updated = claimRepository.save(claim);

		recordClaimHistory(updated, claim.getClaimStatus(), claim.getClaimStatus(), "Staff member assigned",
				auth.getName());

		ClaimResponseDTO response = convertToResponseDTO(updated);
		return new ApiResponseDTO<>(MessageConstants.Claim.ASSIGNED_SUCCESS, true, response, LocalDateTime.now());
	}

	// Helper Methods

	private ClaimResponseDTO convertToResponseDTO(Claim claim) {
		ClaimResponseDTO response = new ClaimResponseDTO();
		response.setClaimId(claim.getId());
		response.setClaimNumber(claim.getClaimNumber());
		if (claim.getPolicy() != null) {
			response.setPolicyId(claim.getPolicy().getId());
			response.setPolicyNumber(claim.getPolicy().getPolicyNumber());
			if (claim.getPolicy().getCustomer() != null && claim.getPolicy().getCustomer().getUser() != null) {
				response.setCustomerName(claim.getPolicy().getCustomer().getUser().getFullName());
			}
		}
		if (claim.getAssignedStaff() != null) {
			response.setAssignedStaffId(claim.getAssignedStaff().getId());
			response.setAssignedStaffName(claim.getAssignedStaff().getFullName());
		}
		response.setClaimAmount(claim.getClaimAmount());
		response.setClaimReason(claim.getClaimReason());
		if (claim.getIncidentDate() != null) {
			response.setIncidentDate(claim.getIncidentDate().toLocalDate());
		}
		if (claim.getClaimStatus() != null) {
			response.setClaimStatus(claim.getClaimStatus().name());
		}
		response.setStaffRemarks(claim.getStaffRemarks());
		response.setAdminRemarks(claim.getAdminRemarks());
		response.setCreatedDate(claim.getCreatedDate());
		response.setUpdatedDate(claim.getUpdatedDate());
		return response;
	}

	private ClaimHistoryResponseDTO convertToHistoryResponseDTO(ClaimStatusHistory history) {
		ClaimHistoryResponseDTO response = new ClaimHistoryResponseDTO();
		response.setHistoryId(history.getId());
		response.setPreviousStatus(history.getPreviousStatus());
		response.setNewStatus(history.getNewStatus());
		response.setRemarks(history.getRemarks());
		response.setUpdatedBy(history.getUpdatedBy());
		response.setUpdatedDate(history.getUpdatedDate());
		return response;
	}

	private void recordClaimHistory(Claim claim, ClaimStatus previous, ClaimStatus newStatus, String remarks,
			String updatedBy) {

		ClaimStatusHistory history = new ClaimStatusHistory();
		history.setClaim(claim);
		history.setPreviousStatus(previous != null ? previous.name() : null);
		history.setNewStatus(newStatus.name());
		history.setRemarks(remarks);
		history.setUpdatedBy(updatedBy);
		history.setUpdatedDate(LocalDateTime.now());

		historyRepository.save(history);
	}

}
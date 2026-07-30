package com.insurance.demo.serviceimpl;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.dto.request.CreateStaffRequestDTO;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.PageResponseDTO;
import com.insurance.demo.dto.response.UserResponseDTO;
import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.BadRequestException;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.StaffSpeciality;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.service.UserService;
import com.insurance.demo.util.PaginationValidator;
import com.insurance.demo.verification.OtpService;
import com.insurance.demo.util.MessageConstants;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final AppUserRepository userRepository;
	private final ModelMapper modelMapper;
	private final PasswordEncoder passwordEncoder;
	private final OtpService otpService;

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<List<UserResponseDTO>> viewAllUsers() {

		log.info("fatching all users");
		List<AppUser> users = userRepository.findAll();

		List<UserResponseDTO> userResponseDTOs = users.stream().map(user -> mapToUserResponseDTO(user)).toList();

		ApiResponseDTO<List<UserResponseDTO>> apiResponseDTO = new ApiResponseDTO<>();

		apiResponseDTO.setData(userResponseDTOs);
		apiResponseDTO.setMessage(MessageConstants.Auth.USERS_RETRIEVED);
		apiResponseDTO.setSuccess(true);
		apiResponseDTO.setTimeStamp(LocalDateTime.now());
		return apiResponseDTO;
	}

	@Override
	@Transactional
	public ApiResponseDTO<UserResponseDTO> activateUser(Long userId) {

		log.info("Activating user by id: {}", userId);

		if (userId.equals(currentUserId()))
			throw new AccessDeniedException(MessageConstants.Security.OWN_ACCOUNT_ACTIVATION_RESTRICTED);

		AppUser user = getById(userId);

		if (Boolean.FALSE.equals(user.getEmailVerified())) {
			UserResponseDTO responseDto = mapToUserResponseDTO(user);
			log.info("User is not verified by id: {}", userId);
			return new ApiResponseDTO<>(MessageConstants.Auth.EMAIL_NOT_VERIFIED, false, responseDto, LocalDateTime.now());
		}

		if (Boolean.TRUE.equals(user.getIsActive())) {
			UserResponseDTO responseDto = mapToUserResponseDTO(user);
			log.info("user already active with id {} ", userId);
			return new ApiResponseDTO<>(MessageConstants.Auth.ACCOUNT_ACTIVATED, false, responseDto, LocalDateTime.now());
		}

		user.setIsActive(true);

		AppUser retrivedUser = userRepository.save(user);

		UserResponseDTO responseDto = mapToUserResponseDTO(retrivedUser);
		return new ApiResponseDTO<>(MessageConstants.Auth.ACCOUNT_ACTIVATED, true, responseDto, LocalDateTime.now());
	}

	private Long currentUserId() {

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		String email = authentication.getName();

		return findByEmail(email).getId();
	}

	@Override
	@Transactional
	public ApiResponseDTO<UserResponseDTO> deactivateUser(Long userId) {

		log.info("Deactivating user by id: {}", userId);

		if (userId.equals(currentUserId()))
			throw new AccessDeniedException(MessageConstants.Security.OWN_ACCOUNT_DEACTIVATION_RESTRICTED);

		AppUser user = getById(userId);

		if (Boolean.FALSE.equals(user.getEmailVerified())) {
			UserResponseDTO responseDto = mapToUserResponseDTO(user);
			log.info("User is not verified by id: {}", userId);
			return new ApiResponseDTO<>(MessageConstants.Auth.EMAIL_NOT_VERIFIED, false, responseDto, LocalDateTime.now());
		}

		if (Boolean.FALSE.equals(user.getIsActive())) {
			UserResponseDTO responseDto = mapToUserResponseDTO(user);
			log.info("Already deactivated user by id: {}", userId);
			return new ApiResponseDTO<>(MessageConstants.Auth.ACCOUNT_DEACTIVATED, false, responseDto, LocalDateTime.now());
		}

		user.setIsActive(false);

		AppUser retrivedUser = userRepository.save(user);

		UserResponseDTO responseDto = mapToUserResponseDTO(retrivedUser);
		return new ApiResponseDTO<>(MessageConstants.Auth.ACCOUNT_DEACTIVATED, true, responseDto, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<UserResponseDTO> createInternalStaffUser(CreateStaffRequestDTO staffRequestDTO) {

		log.info("creating staff by email: {}", staffRequestDTO.getEmail());

		if (userRepository.existsByEmail(staffRequestDTO.getEmail())) {
			throw new DuplicateResourceException(MessageConstants.Auth.EMAIL_ALREADY_REGISTERED);
		}

		if (userRepository.existsByMobileNumber(staffRequestDTO.getMobileNumber())) {
			throw new DuplicateResourceException(
					MessageConstants.Auth.MOBILE_ALREADY_REGISTERED + staffRequestDTO.getMobileNumber());
		}

		AppUser user = modelMapper.map(staffRequestDTO, AppUser.class);
		user.setEmail(staffRequestDTO.getEmail().toLowerCase());
		user.setPassword(passwordEncoder.encode(staffRequestDTO.getPassword().trim()));
		user.setRole(Role.ROLE_INTERNAL_STAFF);
		StaffSpeciality staffSpeciality = new StaffSpeciality();
		staffSpeciality.setProductSpeciality(staffRequestDTO.getProductSpeciality());
		staffSpeciality.setStaff(user);
		user.setStaffSpeciality(staffSpeciality);
		user.setIsActive(false);
		user.setEmailVerified(false);
		user.setPhoneVerified(false);
		AppUser retrivedUser = userRepository.save(user);

		otpService.createAndSendOtp(retrivedUser);

		UserResponseDTO dto = mapToUserResponseDTO(retrivedUser);
		return new ApiResponseDTO<>(MessageConstants.Auth.REGISTRATION_SUCCESS,
				true, dto, LocalDateTime.now());
	}

	@Override
	@Transactional(readOnly = true)
	public ApiResponseDTO<PageResponseDTO<UserResponseDTO>> getAllUsersWithPagination(int pageNumber, int pageSize, String sortBy,
			String sortDirection, String role, Boolean isActive, String fullName, String email) {
		log.info(
				"Fetching Users with pagination. pageNumber: {}, pageSize: {}, sortBy: {}, sortDirection: {}, role: {}, isActive: {}",
				pageNumber, pageSize, sortBy, sortDirection, role, isActive);
		PaginationValidator.validate(pageNumber, pageSize);
		PaginationValidator.validateSortField(sortBy,
				Set.of("id", "fullName", "email", "mobileNumber", "role", "isActive"));

		Role roleEnum = null;
		if (role != null && !role.trim().isEmpty()) {
			try {
				roleEnum = Role.valueOf(role.trim().toUpperCase());
			} catch (IllegalArgumentException e) {
				throw new BadRequestException(MessageConstants.Security.PERMISSION_DENIED);
			}
		}

		Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(getSortDirection(sortDirection), sortBy));

		Specification<AppUser> spec = (root, query, cb) -> cb.conjunction();

		if (roleEnum != null) {
			Role finalRoleEnum = roleEnum;
			spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), finalRoleEnum));
		}
		if (isActive != null) {
			spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), isActive));
		}
		if (fullName != null && !fullName.trim().isEmpty()) {
			spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("fullName")),
					"%" + fullName.trim().toLowerCase() + "%"));
		}
		if (email != null && !email.trim().isEmpty()) {
			spec = spec.and(
					(root, query, cb) -> cb.like(cb.lower(root.get("email")), "%" + email.trim().toLowerCase() + "%"));
		}

		Page<AppUser> userPage = userRepository.findAll(spec, pageable);

		List<UserResponseDTO> content = userPage.getContent().stream().map(user -> mapToUserResponseDTO(user)).toList();
		PageResponseDTO<UserResponseDTO> pageResponse = new PageResponseDTO<>(content, userPage.getNumber(), userPage.getSize(), userPage.getTotalElements(),
				userPage.getTotalPages(), userPage.isLast(), sortDirection);
				
		return new ApiResponseDTO<>(MessageConstants.Auth.USERS_RETRIEVED, true, pageResponse, LocalDateTime.now());
	}

	@Override
	public UserResponseDTO findByEmail(String username) {

		AppUser user = userRepository.findByEmail(username)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		return mapToUserResponseDTO(user);
	}

	@Override
	public ApiResponseDTO<UserResponseDTO> findUserById(Long id) {

		log.info("Fetching User with id - {} ", id);
		AppUser appUser = getById(id);

		UserResponseDTO dto = mapToUserResponseDTO(appUser);

		return new ApiResponseDTO<>(MessageConstants.Auth.USER_RETRIEVED, true, dto, LocalDateTime.now());
	}

	private AppUser getById(Long id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));
	}

	private Sort.Direction getSortDirection(String sortDirection) {
		if (sortDirection == null || sortDirection.equalsIgnoreCase("asc"))
			return Sort.Direction.ASC;
		if (sortDirection.equalsIgnoreCase("desc"))
			return Sort.Direction.DESC;
		throw new BadRequestException(MessageConstants.Common.SORT_DIRECTION_INVALID);
	}

	private UserResponseDTO mapToUserResponseDTO(AppUser user) {
		UserResponseDTO dto = modelMapper.map(user, UserResponseDTO.class);
		if (user.getStaffSpeciality() != null) {
			dto.setProductSpeciality(user.getStaffSpeciality().getProductSpeciality());
		}
		return dto;
	}
}
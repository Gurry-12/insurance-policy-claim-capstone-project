package com.insurance.demo.serviceimpl;

import java.time.LocalDateTime;
import java.util.Optional;

import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.config.SecurityAuditLogger;
import com.insurance.demo.dto.request.ForgotPasswordRequestDTO;
import com.insurance.demo.dto.request.LoginRequestDTO;
import com.insurance.demo.dto.request.ResendOtpRequestDTO;
import com.insurance.demo.dto.request.ResetPasswordRequestDTO;
import com.insurance.demo.dto.request.UserRequestDTO;
import com.insurance.demo.dto.request.VerifyOtpRequest;
import com.insurance.demo.dto.response.ApiResponseDTO;
import com.insurance.demo.dto.response.LoginResponseDTO;
import com.insurance.demo.dto.response.RefreshResponseDTO;
import com.insurance.demo.dto.response.ResendOtpResponseDTO;
import com.insurance.demo.dto.response.UserResponseDTO;
import com.insurance.demo.enums.Role;
import com.insurance.demo.exception.BadRequestException;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import com.insurance.demo.exception.DuplicateResourceException;
import com.insurance.demo.exception.ResourceNotFoundException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Customer;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.security.AppUserDetails;
import com.insurance.demo.security.JwtService;
import com.insurance.demo.security.RefreshTokenService;
import com.insurance.demo.security.cache.RedisTokenCacheService;
import com.insurance.demo.service.AuthService;
import com.insurance.demo.service.UserService;
import com.insurance.demo.verification.OtpService;
import com.insurance.demo.util.MessageConstants;
import io.jsonwebtoken.Claims;
import java.time.Duration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final AuthenticationManager authenticationManager;
	private final AppUserRepository userRepository;
	private final CustomerRepository customerRepository;
	private final ModelMapper modelMapper;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final UserService userService;
	private final OtpService otpService;
	private final SecurityAuditLogger auditLogger;
	private final RefreshTokenService refreshTokenService;
	private final RedisTokenCacheService redisTokenCacheService;

	@Override
	public ApiResponseDTO<LoginResponseDTO> login(LoginRequestDTO requestDto) {

		log.info("Login attempt received. Email={}", requestDto.getEmail());
		String email = requestDto.getEmail().toLowerCase();

		AppUser appUser = userRepository.findByEmail(email).orElse(null);

		if (appUser == null) {
			auditLogger.logEvent(SecurityAuditLogger.LOGIN_FAILED, "Reason=USER_NOT_FOUND, email=" + email);
			throw new BadCredentialsException(MessageConstants.Auth.INVALID_CREDENTIALS);
		}

		if (Boolean.FALSE.equals(appUser.getEmailVerified())) {
			auditLogger.logEvent(SecurityAuditLogger.LOGIN_FAILED, "Reason=EMAIL_NOT_VERIFIED, userId=" + appUser.getId());
			throw new BadCredentialsException(MessageConstants.Auth.INVALID_CREDENTIALS);
		}

		if (Boolean.FALSE.equals(appUser.getPhoneVerified())) {
			auditLogger.logEvent(SecurityAuditLogger.LOGIN_FAILED, "Reason=PHONE_NOT_VERIFIED, userId=" + appUser.getId());
			throw new BadCredentialsException(MessageConstants.Auth.INVALID_CREDENTIALS);
		}

		if (Boolean.FALSE.equals(appUser.getIsActive())) {
			auditLogger.logEvent(SecurityAuditLogger.ACCOUNT_DISABLED, "userId=" + appUser.getId());
			auditLogger.logEvent(SecurityAuditLogger.LOGIN_FAILED, "Reason=ACCOUNT_DEACTIVATED, userId=" + appUser.getId());
			throw new BadCredentialsException(MessageConstants.Auth.INVALID_CREDENTIALS);
		}

		Authentication authentication;
		try {
			authentication = authenticationManager
					.authenticate(new UsernamePasswordAuthenticationToken(email, requestDto.getPassword().trim()));
		} catch (BadCredentialsException ex) {
			auditLogger.logEvent(SecurityAuditLogger.LOGIN_FAILED, "Reason=BAD_PASSWORD, userId=" + appUser.getId());
			throw ex;
		}

		UserDetails userDetails = (UserDetails) authentication.getPrincipal();

		String token = jwtService.generateToken(userDetails, appUser.getTokenVersion());

		UserResponseDTO dto = userService.findByEmail(userDetails.getUsername());

		auditLogger.logEvent(SecurityAuditLogger.LOGIN_SUCCESS,
				"userId=" + appUser.getId() + ", role=" + appUser.getRole());

		String refreshToken = refreshTokenService.createRefreshToken(appUser);

		LoginResponseDTO loginResponseDTO = new LoginResponseDTO(dto.getId(), dto.getFullName(), dto.getEmail(), dto.getRole(), token, "Bearer", refreshToken);
		return new ApiResponseDTO<>(MessageConstants.Auth.LOGIN_SUCCESS, true, loginResponseDTO, LocalDateTime.now());
	}

	@Override
	public RefreshResponseDTO refresh(String rawRefreshToken, String oldAccessToken) {
		AppUser user = refreshTokenService.validateRefreshToken(rawRefreshToken);

		String newAccessToken = jwtService.generateToken(
				new AppUserDetails(user), user.getTokenVersion());

		// Proactively blacklist the old access token so it cannot be used anymore
		blacklistAccessToken(oldAccessToken);

		RefreshResponseDTO dto = new RefreshResponseDTO(newAccessToken, "Bearer");
		return dto;
	}

	@Override
	public void logout(String rawRefreshToken, String accessToken) {
		refreshTokenService.revoke(rawRefreshToken);
		blacklistAccessToken(accessToken);
	}

	/**
	 * Best-effort blacklisting of the current access token so it cannot be used
	 * for the remaining lifetime after logout. Silently ignored when the token
	 * is null, already expired, or Redis is unavailable — the primary logout
	 * mechanism is refresh-token revocation.
	 */
	private void blacklistAccessToken(String accessToken) {
		if (accessToken == null || accessToken.isBlank()) {
			return;
		}
		try {
			Claims claims = jwtService.parseClaims(accessToken);
			String jti = claims.getId();
			if (jti != null) {
				long remainingMs = claims.getExpiration().getTime() - System.currentTimeMillis();
				if (remainingMs > 0) {
					redisTokenCacheService.blacklistJwt(jti, Duration.ofMillis(remainingMs));
				}
			}
		} catch (Exception ex) {
			// Token already expired or malformed — nothing to blacklist.
			log.debug("Access token blacklisting skipped on logout: {}", ex.getMessage());
		}
	}

	@Override
	public void logoutAll(Long userId) {
		if (userId != null) {
			refreshTokenService.revokeAllForUser(userId);
			auditLogger.logEvent(SecurityAuditLogger.LOGOUT, "Logout all sessions for userId=" + userId);
		}
	}

	@Override
	@Transactional
	public ApiResponseDTO<UserResponseDTO> registerUser(UserRequestDTO dto) {

		String email = dto.getEmail().toLowerCase();

		if (userRepository.existsByEmail(email) || userRepository.existsByMobileNumber(dto.getMobileNumber())) {
			log.warn("Registration failed. Email or mobile number already in use. Email={}", email);
			throw new DuplicateResourceException(MessageConstants.Auth.ACCOUNT_ALREADY_EXISTS);
		}

		AppUser user = modelMapper.map(dto, AppUser.class);
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(dto.getPassword().trim()));
		user.setRole(Role.ROLE_CUSTOMER);
		user.setIsActive(false);
		user.setEmailVerified(false);
		user.setPhoneVerified(false);
		user.setTokenVersion(0L);

		AppUser savedUser = userRepository.save(user);

		// Automatically create an empty Customer profile
		Customer emptyCustomer = new Customer();
		emptyCustomer.setUser(savedUser);
		customerRepository.save(emptyCustomer);

		otpService.createAndSendOtp(savedUser);

		UserResponseDTO responseDTO = modelMapper.map(savedUser, UserResponseDTO.class);
		log.info("Customer registration successful. UserId={}, Email={}", user.getId(), user.getEmail());
		return new ApiResponseDTO<>(MessageConstants.Auth.REGISTRATION_SUCCESS, true, responseDTO,
				LocalDateTime.now());

	}

	@Override
	public ApiResponseDTO<UserResponseDTO> verifyOtp( VerifyOtpRequest request) {
		AppUser user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		otpService.verifyOtp(user, request.getEmailOtp(), request.getPhoneOtp());

		user.setEmailVerified(Boolean.TRUE);
		user.setPhoneVerified(Boolean.TRUE);
		user.setIsActive(Boolean.TRUE);

		AppUser saved = userRepository.save(user);

		return new ApiResponseDTO<>(MessageConstants.Auth.ACCOUNT_ACTIVATED, true,
				modelMapper.map(saved, UserResponseDTO.class), LocalDateTime.now());
	}

	@Override
	public ApiResponseDTO<ResendOtpResponseDTO> resendOtp(ResendOtpRequestDTO request) {

		AppUser user = userRepository.findByEmailAndMobileNumber(request.getEmail(), request.getPhone())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		if (Boolean.TRUE.equals(user.getIsActive())) {
			throw new BadRequestException(MessageConstants.Auth.OTP_EXPIRED);
		}

		otpService.sendOrResendOtp(user);

		ResendOtpResponseDTO dto = new ResendOtpResponseDTO(request.getEmail(), request.getPhone());

		return new ApiResponseDTO<>(MessageConstants.Auth.OTP_RESENT, true, dto, LocalDateTime.now());

	}
	
	@Override
	public ApiResponseDTO<String> forgotPassword(ForgotPasswordRequestDTO request) {
		String email = request.getEmail().toLowerCase();
		Optional<AppUser> existingUser = userRepository.findByEmail(email);

		if (existingUser.isEmpty()) {
			log.info("Forgot password requested for unknown email: {}", email);
		} else {
			otpService.sendOrResendOtp(existingUser.get());
		}

		return new ApiResponseDTO<>(MessageConstants.Auth.FORGOT_PASSWORD_OTP, true, null, LocalDateTime.now());
	}

	@Override
	@Transactional
	public ApiResponseDTO<String> resetPassword(ResetPasswordRequestDTO request) {
		AppUser user = userRepository.findByEmail(request.getEmail().toLowerCase())
				.orElseThrow(() -> new ResourceNotFoundException(MessageConstants.Auth.OTP_NOT_FOUND));

		otpService.verifyOtp(user, request.getEmailOtp(), request.getPhoneOtp());

		// Only re-activate accounts that were deactivated because they hadn't
		// completed initial email/phone verification. Admin-deactivated accounts
		// (emailVerified = true but isActive = false) must NOT be re-activated here.
		if (Boolean.FALSE.equals(user.getIsActive()) && !Boolean.TRUE.equals(user.getEmailVerified())) {
			user.setEmailVerified(Boolean.TRUE);
			user.setPhoneVerified(Boolean.TRUE);
			user.setIsActive(Boolean.TRUE);
		}

		user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
		user.setTokenVersion(incrementTokenVersion(user.getTokenVersion()));
		userRepository.save(user);

		refreshTokenService.revokeAllForUser(user.getId());

		auditLogger.logEvent(SecurityAuditLogger.PASSWORD_RESET, "userId=" + user.getId());
		log.info("Password reset completed for userId={}", user.getId());

		return new ApiResponseDTO<>(MessageConstants.Auth.PASSWORD_RESET_SUCCESS, true, null, LocalDateTime.now());
	}

	private Long incrementTokenVersion(Long current) {
		return (current == null ? 0L : current) + 1L;
	}

}

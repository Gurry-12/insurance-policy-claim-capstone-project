package com.insurance.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.insurance.demo.config.RefreshTokenCookieManager;
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
import com.insurance.demo.exception.RefreshTokenException;
import com.insurance.demo.service.AuthService;
import com.insurance.demo.util.MessageConstants;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
@Tag(name = "1. Authentication API", description = "Endpoints for user registration, login, and OTP verification")
public class AuthController {

	private final AuthService authService;
	private final RefreshTokenCookieManager refreshTokenCookieManager;

	@PostMapping("/login")
	@ResponseStatus(HttpStatus.OK)

	@Operation(summary = "User Login", description = "Authenticates a user using email and password, and returns a JWT token.")
	public ApiResponseDTO<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO requestDto,
			HttpServletResponse response) {

		log.info("Login request received for email: {}", requestDto.getEmail());

		ApiResponseDTO<LoginResponseDTO> apiResponse = authService.login(requestDto);

		refreshTokenCookieManager.addCookie(response, apiResponse.getData().getRefreshToken());

		return apiResponse;

	}

	@PostMapping("/refresh")
	@Operation(summary = "Refresh Access Token", description = "Rotates the HttpOnly refresh token and returns a fresh access token.")
	public ApiResponseDTO<RefreshResponseDTO> refresh(
			@CookieValue(name = RefreshTokenCookieManager.COOKIE_NAME, required = false) String refreshToken,
			HttpServletResponse response) {

		if (refreshToken == null || refreshToken.isBlank()) {
			throw new RefreshTokenException(MessageConstants.Auth.SESSION_EXPIRED);
		}

		RefreshResponseDTO dto = authService.refresh(refreshToken);

		refreshTokenCookieManager.addCookie(response, dto.getRefreshToken());

		return new ApiResponseDTO<>(MessageConstants.Auth.TOKEN_REFRESHED, true, dto, java.time.LocalDateTime.now());
	}

	@PostMapping("/logout")
	@Operation(summary = "Logout", description = "Revokes the refresh token and clears the refresh cookie.")
	public ApiResponseDTO<String> logout(
			@CookieValue(name = RefreshTokenCookieManager.COOKIE_NAME, required = false) String refreshToken,
			HttpServletResponse response) {

		if (refreshToken != null && !refreshToken.isBlank()) {
			authService.logout(refreshToken);
		}

		refreshTokenCookieManager.clearCookie(response);

		return new ApiResponseDTO<>(MessageConstants.Auth.LOGOUT_SUCCESS, true, null, java.time.LocalDateTime.now());
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Register a New Customer", description = "Registers a new customer and sends an OTP to their email for verification.")
	public ApiResponseDTO<UserResponseDTO> registerUser(@Valid @RequestBody UserRequestDTO dto) {

		return authService.registerUser(dto);
	}

	@PostMapping("/verify-otp")
	@Operation(summary = "Verify OTP", description = "Verifies the OTP sent to the user's email and phone to activate their account.")
	public ApiResponseDTO<UserResponseDTO> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
		return authService.verifyOtp(request);
	}

	@PostMapping("/resend-otp")
	@Operation(summary = "Resend OTP", description = "Resend the OTP to user email and phone  to activate")
	public ApiResponseDTO<ResendOtpResponseDTO> resendOtp(@Valid @RequestBody ResendOtpRequestDTO request) {
		return authService.resendOtp(request);
	}

	@PostMapping("/forgot-password")
	@Operation(summary = "Forgot Password", description = "Sends an OTP to the user's registered email and phone number for password reset.")
	public ApiResponseDTO<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
		return authService.forgotPassword(request);
	}

	@PostMapping("/reset-password")
	@Operation(summary = "Reset Password", description = "Resets the user's password using the OTPs sent to their email and phone.")
	public ApiResponseDTO<String> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
		return authService.resetPassword(request);
	}

}

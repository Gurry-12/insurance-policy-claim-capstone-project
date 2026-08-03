package com.insurance.demo.service;

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

public interface AuthService {

	ApiResponseDTO<LoginResponseDTO> login(LoginRequestDTO requestDto);

	ApiResponseDTO<UserResponseDTO> registerUser(UserRequestDTO dto);

	ApiResponseDTO<UserResponseDTO> verifyOtp(VerifyOtpRequest request);
	
	ApiResponseDTO<ResendOtpResponseDTO> resendOtp(ResendOtpRequestDTO request);

	ApiResponseDTO<String> forgotPassword(ForgotPasswordRequestDTO request);

	ApiResponseDTO<String> resetPassword(ResetPasswordRequestDTO request);

	RefreshResponseDTO refresh(String rawRefreshToken);

	void logout(String rawRefreshToken);
}

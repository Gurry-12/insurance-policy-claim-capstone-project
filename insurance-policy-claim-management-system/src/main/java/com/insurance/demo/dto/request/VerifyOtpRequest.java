package com.insurance.demo.dto.request;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyOtpRequest {

	@NotBlank(message = MessageConstants.Validation.EMAIL_REQUIRED)
	@Email(message = MessageConstants.Validation.VALID_EMAIL)
	private String email;

	@NotBlank(message = MessageConstants.Validation.EMAIL_OTP_REQUIRED)
	private String emailOtp;
	
	@NotBlank(message = MessageConstants.Validation.PHONE_OTP_REQUIRED)
	private String phoneOtp;
}


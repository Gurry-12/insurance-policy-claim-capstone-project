package com.insurance.demo.dto.request;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequestDTO {

	@Email(message = MessageConstants.Validation.VALID_EMAIL)
	@NotBlank(message = MessageConstants.Validation.EMAIL_REQUIRED)
	private String email;

	@NotBlank(message = MessageConstants.Validation.EMAIL_OTP_REQUIRED)
	private String emailOtp;

	@NotBlank(message = MessageConstants.Validation.PHONE_OTP_REQUIRED)
	private String phoneOtp;

	@NotBlank(message = MessageConstants.Validation.NEW_PASSWORD_REQUIRED)
	@Size(min = 8, message = MessageConstants.Validation.PASSWORD_MIN_SIZE)
	private String newPassword;

}
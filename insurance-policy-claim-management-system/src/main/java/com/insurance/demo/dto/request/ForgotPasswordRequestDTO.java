package com.insurance.demo.dto.request;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequestDTO {

	@Email(message = MessageConstants.Validation.VALID_EMAIL)
	@NotBlank(message = MessageConstants.Validation.EMAIL_REQUIRED)
	private String email;

}
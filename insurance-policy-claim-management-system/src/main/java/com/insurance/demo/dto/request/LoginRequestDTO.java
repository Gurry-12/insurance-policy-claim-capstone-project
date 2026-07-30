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
public class LoginRequestDTO {

	@Email(message = MessageConstants.Validation.VALID_EMAIL)
	@NotBlank(message = MessageConstants.Validation.EMAIL_REQUIRED)
	private String email;

	@NotBlank(message = MessageConstants.Validation.PASSWORD_REQUIRED)
	private String password;

}

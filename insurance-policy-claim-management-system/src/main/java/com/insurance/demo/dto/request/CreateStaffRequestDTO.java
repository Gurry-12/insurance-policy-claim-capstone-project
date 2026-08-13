package com.insurance.demo.dto.request;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.insurance.demo.enums.ProductType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequestDTO {

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.FULL_NAME_REQUIRED)
	@Size(min = 2, max = 100, message = MessageConstants.Validation.NAME_SIZE)
	private String fullName;

	@Email(message = MessageConstants.Validation.VALID_EMAIL)
	@NotBlank(message = MessageConstants.Validation.EMAIL_REQUIRED)
	private String email;

	@NotBlank(message = MessageConstants.Validation.PASSWORD_REQUIRED)
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$", message = MessageConstants.Validation.PASSWORD_PATTERN)
	private String password;

	@NotBlank(message = MessageConstants.Validation.MOBILE_REQUIRED)
	@Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = MessageConstants.Validation.MOBILE_PATTERN)
	private String mobileNumber;

	@NotNull(message = MessageConstants.Validation.SPECIALITY_REQUIRED)
	private ProductType productSpeciality;
}
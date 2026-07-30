package com.insurance.demo.dto.request;

import java.time.LocalDate;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequestDTO {

	@Past(message = MessageConstants.Validation.DOB_PAST)
	private LocalDate dateOfBirth;

	@NotBlank(message = MessageConstants.Validation.ADDRESS_REQUIRED)
	private String address;

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.CITY_REQUIRED)
	private String city;

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.STATE_REQUIRED)
	private String state;

	@Pattern(regexp = "^[1-9][0-9]{5}$", message = MessageConstants.Validation.PIN_CODE_VALID)
	private String pinCode;

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.NOMINEE_NAME_REQUIRED)
	private String nomineeName;

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.NOMINEE_RELATION_REQUIRED)
	private String nomineeRelation;
}
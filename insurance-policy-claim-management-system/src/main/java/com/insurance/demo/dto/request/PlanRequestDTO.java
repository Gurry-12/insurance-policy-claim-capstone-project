package com.insurance.demo.dto.request;

import java.util.Set;

import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.util.MessageConstants;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanRequestDTO {

	@NotNull(message = MessageConstants.Validation.PRODUCT_ID_REQUIRED)
	private Long productId;

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.PLAN_NAME_REQUIRED)
	private String planName;

	@NotNull(message = "Allowed durations cannot be empty")
	private Set<Integer> allowedDurations;

	@NotNull(message = "Premium type is required")
	private PremiumType supportedPremiumType;



	@NotBlank(message = MessageConstants.Validation.TERMS_REQUIRED)
	@Size(min = 15, message = MessageConstants.Validation.TERMS_MIN_LENGTH)
	private String termsAndConditions;

	@NotNull(message = MessageConstants.Validation.ACTIVE_STATUS_REQUIRED)
	private Boolean activeStatus;
}
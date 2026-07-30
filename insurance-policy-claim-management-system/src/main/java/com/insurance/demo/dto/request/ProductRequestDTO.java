package com.insurance.demo.dto.request;

import com.insurance.demo.enums.ProductType;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDTO {

	@Pattern(regexp = "^[a-zA-Z\\s]*$", message = MessageConstants.Validation.LETTERS_SPACES_ONLY)
	@NotBlank(message = MessageConstants.Validation.PRODUCT_NAME_REQUIRED)
	private String productName;

	@NotNull(message = MessageConstants.Validation.PRODUCT_TYPE_REQUIRED)
	private ProductType productType;

	@NotBlank(message = MessageConstants.Validation.DESCRIPTION_REQUIRED)
	private String description;

	@NotNull(message = MessageConstants.Validation.ACTIVE_STATUS_REQUIRED)
	private Boolean activeStatus;
}
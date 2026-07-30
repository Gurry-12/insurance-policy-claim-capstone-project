package com.insurance.demo.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoverageOptionRequestDTO {

	@Positive(message = "Coverage amount must be positive")
	@NotNull(message = "Coverage amount is required")
	private BigDecimal coverageAmount;

	@NotBlank(message = "Label is required")
	private String label;

	@NotNull(message = "Display order is required")
	private Integer displayOrder;

	@NotNull(message = "Active status is required")
	private Boolean activeStatus;
}

package com.insurance.demo.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoverageOptionResponseDTO {
	private Long id;
	private BigDecimal coverageAmount;
	private String label;
	private Integer displayOrder;
	private Boolean isActive;
}

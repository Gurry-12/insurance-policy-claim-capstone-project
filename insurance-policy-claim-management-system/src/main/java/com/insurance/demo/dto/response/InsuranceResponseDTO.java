package com.insurance.demo.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceResponseDTO {

	private Long productId;

	private String productName;

	private String productType;

	private String description;

	private Boolean isActive;

	private LocalDateTime createdDate;
}
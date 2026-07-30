package com.insurance.demo.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PolicyPurchaseRequestDTO {

	@NotNull(message = "Quote ID is required")
	private Long quoteId;

	private String paymentReferenceId;

}
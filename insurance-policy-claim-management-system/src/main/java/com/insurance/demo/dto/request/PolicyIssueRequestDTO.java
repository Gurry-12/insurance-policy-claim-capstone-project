package com.insurance.demo.dto.request;

import java.time.LocalDate;

import com.insurance.demo.util.MessageConstants;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PolicyIssueRequestDTO {

	@NotNull(message = MessageConstants.Validation.CUSTOMER_ID_REQUIRED)
	private Long customerId;

	@NotNull(message = "Quote ID is required")
	private Long quoteId;

	@NotNull(message = MessageConstants.Validation.START_DATE_REQUIRED)
	@PastOrPresent(message = MessageConstants.Validation.START_DATE_PAST_PRESENT)
	private LocalDate startDate;
}
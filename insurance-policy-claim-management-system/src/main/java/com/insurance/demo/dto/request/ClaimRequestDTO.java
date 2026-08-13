package com.insurance.demo.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimRequestDTO {

	@NotNull(message = MessageConstants.Validation.POLICY_ID_REQUIRED)
	private Long policyId;

	@NotNull(message = MessageConstants.Validation.CLAIM_AMOUNT_REQUIRED)
	@Positive(message = MessageConstants.Validation.CLAIM_AMOUNT_POSITIVE)
	private BigDecimal claimAmount;

	@NotBlank(message = MessageConstants.Validation.CLAIM_REASON_REQUIRED)
	@Size(max = 2000, message = "Claim reason cannot exceed 2000 characters")
	private String claimReason;

	@NotNull(message = MessageConstants.Validation.INCIDENT_DATE_REQUIRED)
	private LocalDate incidentDate;
	
	//private List<ClaimDocumentRequestDTO> documents;
}
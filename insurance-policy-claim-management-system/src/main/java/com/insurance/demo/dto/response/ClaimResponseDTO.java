package com.insurance.demo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimResponseDTO {

	private Long claimId;

	private String claimNumber;

	private Long policyId;

	private String policyNumber;

	private BigDecimal claimAmount;

	private String claimReason;

	private LocalDate incidentDate;

	private String claimStatus;

	private String staffRemarks;

	private String adminRemarks;

	private String customerName;

	private LocalDateTime createdDate;

	private LocalDateTime updatedDate;
	
	private List<ClaimDocumentResponseDTO> documents;

	@JsonInclude(JsonInclude.Include.NON_NULL)
	private Long assignedStaffId;

	@JsonInclude(JsonInclude.Include.NON_NULL)
	private String assignedStaffName;
}
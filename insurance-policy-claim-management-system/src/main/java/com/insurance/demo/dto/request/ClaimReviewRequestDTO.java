package com.insurance.demo.dto.request;

import com.insurance.demo.enums.ClaimStatus;
import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimReviewRequestDTO {

	@NotNull(message = MessageConstants.Validation.STATUS_REQUIRED)
	private ClaimStatus recommendedStatus;

	private String remarks;
}
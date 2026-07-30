package com.insurance.demo.dto.request;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateRequestDTO {

	@NotNull(message = MessageConstants.Validation.ACTIVE_STATUS_REQUIRED)
	private Boolean isActive;

	@NotBlank(message = MessageConstants.Validation.REMARKS_REQUIRED)
	private String remarks;
}

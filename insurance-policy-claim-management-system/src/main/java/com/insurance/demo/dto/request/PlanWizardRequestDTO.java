package com.insurance.demo.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanWizardRequestDTO {

	@Valid
	@NotNull(message = "Plan details are required")
	private PlanRequestDTO planDetails;

	@Valid
	@NotEmpty(message = "At least one coverage option must be provided")
	private List<CoverageOptionRequestDTO> coverageOptions;

	@Valid
	@NotNull(message = "Pricing rule details are required")
	private PricingRuleRequestDTO pricingRule;
}

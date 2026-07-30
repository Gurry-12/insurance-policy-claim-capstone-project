package com.insurance.demo.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoverageRegenerationRequestDTO {

    @NotNull(message = "Minimum coverage is required")
    @Positive(message = "Minimum coverage must be positive")
    private BigDecimal minCoverage;

    @NotNull(message = "Maximum coverage is required")
    @Positive(message = "Maximum coverage must be positive")
    private BigDecimal maxCoverage;

    @NotNull(message = "Increment step is required")
    @Positive(message = "Increment step must be positive")
    private BigDecimal incrementStep;
}

package com.insurance.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicStatsResponseDTO {

    private long activeProducts;

    private long activePlans;

    private long totalPolicies;

    private long claimsProcessed;
}

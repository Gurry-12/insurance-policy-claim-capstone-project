package com.insurance.demo.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {

	private Long paymentId;

	private Long policyId;

	private String policyNumber;

	private BigDecimal amount;

	private String paymentMode;

	private String transactionReference;

	private String paymentStatus;

	private LocalDateTime paymentDate;
}
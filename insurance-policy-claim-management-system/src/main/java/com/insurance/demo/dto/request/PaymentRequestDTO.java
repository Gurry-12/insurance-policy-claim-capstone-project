package com.insurance.demo.dto.request;

import com.insurance.demo.enums.PaymentMode;
import com.insurance.demo.enums.PaymentStatus;

import com.insurance.demo.util.MessageConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {

	//@NotNull(message = "Policy Id is required")
	private Long policyId;

	@Positive(message = MessageConstants.Validation.PAYMENT_AMOUNT_POSITIVE)
	private BigDecimal amount;

	@NotNull(message = MessageConstants.Validation.PAYMENT_MODE_REQUIRED)
	private PaymentMode paymentMode;

//	@NotNull(message = "Payment status is required")
	private PaymentStatus paymentStatus;
}
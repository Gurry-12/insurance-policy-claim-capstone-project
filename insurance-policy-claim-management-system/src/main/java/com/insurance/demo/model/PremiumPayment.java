package com.insurance.demo.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.insurance.demo.enums.PaymentMode;
import com.insurance.demo.enums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Index; // Ensure this is imported

@Entity
@Table(name = "premium_payments", indexes = { @Index(name = "idx_payment_policy_id", columnList = "policy_id"),
		@Index(name = "idx_payment_status", columnList = "payment_status") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PremiumPayment {

	@Id
	@Column(name = "payment_id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "policy_id", nullable = false)
	private Policy policy;

	@Positive(message = "amount should be positive")
	@NotNull(message = "amount can't be null")
	@Column(name = "amount", nullable = false, precision = 15, scale = 2)
	private BigDecimal amount;

	@Column(name = "payment_date", nullable = false)
	private LocalDateTime paymentDate = LocalDateTime.now();

	@Enumerated(EnumType.STRING)
	@NotNull(message = "payment mode can't be null")
	@Column(name = "payment_mode", nullable = false)
	private PaymentMode paymentMode;

	@NotBlank(message = "transaction reference can't be null")
	@Column(name = "transaction_reference", nullable = false, unique = true)
	private String transactionReference;

	@NotNull(message = "payment status can not be null")
	@Column(name = "payment_status", nullable = false)
	@Enumerated(EnumType.STRING)
	private PaymentStatus paymentStatus;

	@Column(name = "created_date", updatable = false)
	@CreationTimestamp
	private LocalDateTime createdDate;
}
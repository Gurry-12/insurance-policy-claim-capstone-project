package com.insurance.demo.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.QuoteStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quotes", indexes = { @Index(name = "idx_quote_customer_id", columnList = "customer_id"),
		@Index(name = "idx_quote_plan_id", columnList = "plan_id"),
		@Index(name = "idx_quote_status", columnList = "status") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Quote {

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id", nullable = false)
	@NotNull(message = "Customer is required")
	private Customer customer;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "plan_id", nullable = false)
	@NotNull(message = "Policy plan is required")
	private PolicyPlan policyPlan;

	@Column(name = "plan_version", nullable = false)
	@NotNull(message = "plan version is required")
	private Integer planVersion;

	@Column(name = "pricing_rule_id", nullable = false)
	@NotNull(message = "pricing rule ID is required")
	private Long pricingRuleId;

	@Column(name = "coverage", nullable = false, precision = 15, scale = 2)
	@NotNull(message = "coverage is required")
	private BigDecimal coverage;

	@Column(name = "duration", nullable = false)
	@NotNull(message = "duration is required")
	private Integer duration;

	@Enumerated(EnumType.STRING)
	@Column(name = "premium_type", nullable = false)
	@NotNull(message = "premium type is required")
	private PremiumType premiumType;

	@PositiveOrZero
	@Column(name = "risk_rate", nullable = false, precision = 10, scale = 4)
	private BigDecimal riskRate;

	@PositiveOrZero
	@Column(name = "processing_fee", nullable = false, precision = 15, scale = 2)
	private BigDecimal processingFee;

	@PositiveOrZero
	@Column(name = "gst", nullable = false, precision = 10, scale = 2)
	private BigDecimal gst;

	@PositiveOrZero
	@Column(name = "premium", nullable = false, precision = 15, scale = 2)
	private BigDecimal premium;

	@PositiveOrZero
	@Column(name = "total", nullable = false, precision = 15, scale = 2)
	private BigDecimal total;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	@NotNull(message = "status is required")
	private QuoteStatus status = QuoteStatus.CREATED;

	@Column(name = "created_at", updatable = false)
	@CreationTimestamp
	private LocalDateTime createdAt;

	@Column(name = "expires_at", nullable = false)
	@NotNull(message = "expires at is required")
	private LocalDateTime expiresAt;
}

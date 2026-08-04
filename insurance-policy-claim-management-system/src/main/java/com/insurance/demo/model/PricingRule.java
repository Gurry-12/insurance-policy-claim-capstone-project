package com.insurance.demo.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.insurance.demo.enums.PricingRuleStatus;

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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Index; // Ensure this is imported

@Entity
@Table(name = "pricing_rules", indexes = { @Index(name = "idx_pricing_plan_id", columnList = "plan_id"),
		@Index(name = "idx_pricing_status", columnList = "status") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PricingRule {

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "plan_id", nullable = false)
	private PolicyPlan policyPlan;

	@PositiveOrZero(message = "base risk rate should be positive or zero")
	@Column(name = "base_risk_rate", nullable = false, precision = 10, scale = 4)
	@NotNull(message = "base risk rate can't be null")
	private BigDecimal baseRiskRate;

	@PositiveOrZero(message = "processing fee should be positive or zero")
	@Column(name = "processing_fee", nullable = false, precision = 15, scale = 2)
	@NotNull(message = "processing fee can't be null")
	private BigDecimal processingFee;

	@PositiveOrZero(message = "gst should be positive or zero")
	@Column(name = "gst", nullable = false, precision = 5, scale = 2)
	@NotNull(message = "gst can't be null")
	private BigDecimal gst;

	@Column(name = "remarks", length = 500)
	private String remarks;

	@Column(name = "effective_from", nullable = false)
	@NotNull(message = "effective from date can't be null")
	private LocalDateTime effectiveFrom;

	@Column(name = "effective_to")
	private LocalDateTime effectiveTo;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false)
	@NotNull(message = "status is required")
	private PricingRuleStatus status = PricingRuleStatus.ACTIVE;

	@Column(name = "created_date", updatable = false)
	@CreationTimestamp
	private LocalDateTime createdDate;

}

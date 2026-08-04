package com.insurance.demo.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.PremiumType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Index; // Ensure this is imported

@Entity
@Table(name = "policies", indexes = { @Index(name = "idx_policy_customer_id", columnList = "customer_id"),
		@Index(name = "idx_policy_status", columnList = "policy_status"),
		@Index(name = "idx_policy_plan_id", columnList = "plan_id") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Policy {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id;

	@Column(name = "policy_number", nullable = false, unique = true, length = 50)
	private String policyNumber;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id", nullable = false)
	@NotNull(message = "Customer is required")
	private Customer customer;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "plan_id", nullable = false)
	@NotNull(message = "Policy plan is required")
	private PolicyPlan policyPlan;

	// Pricing Snapshot Fields
	@Column(name = "selected_coverage", nullable = false, precision = 15, scale = 2)
	@NotNull(message = "selected coverage is required")
	private BigDecimal selectedCoverage;

	@Enumerated(EnumType.STRING)
	@Column(name = "premium_type", nullable = false)
	@NotNull(message = "premium type is required")
	private PremiumType premiumType;

	@Column(name = "policy_duration", nullable = false)
	@NotNull(message = "policy duration is required")
	private Integer policyDuration;

	@PositiveOrZero
	@Column(name = "premium_rate_used", nullable = false, precision = 15, scale = 4)
	private BigDecimal premiumRateUsed;

	@PositiveOrZero
	@Column(name = "processing_fee_used", nullable = false, precision = 15, scale = 2)
	private BigDecimal processingFeeUsed;

	@PositiveOrZero
	@Column(name = "gst_used", nullable = false, precision = 15, scale = 2)
	private BigDecimal gstUsed;

	@PositiveOrZero
	@Column(name = "calculated_premium", nullable = false, precision = 15, scale = 2)
	private BigDecimal calculatedPremium;

	// Metadata for Audit and Linkage
	@Column(name = "plan_version", nullable = false)
	@NotNull(message = "plan version is required")
	private Integer planVersion;

	@Column(name = "pricing_rule_id", nullable = false)
	@NotNull(message = "pricing rule ID is required")
	private Long pricingRuleId;

	@Column(name = "quote_id")
	private Long quoteId;

	@Column(name = "purchase_date")
	private LocalDateTime purchaseDate;

	// Existing fields
	@Column(name = "start_date", nullable = false)
	@NotNull(message = "Start date is required")
	private LocalDate startDate;

	@Column(name = "end_date", nullable = false)
	@NotNull(message = "End date is required")
	private LocalDate endDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "policy_status", nullable = false)
	@NotNull(message = "Policy status is required")
	private PolicyStatus policyStatus;

	@Column(name = "total_premium_paid", nullable = false, precision = 15, scale = 2)
	@PositiveOrZero(message = "Total premium paid must be zero or positive")
	private BigDecimal totalPremiumPaid = BigDecimal.ZERO;

	@CreationTimestamp
	@Column(name = "created_date", updatable = false)
	private LocalDateTime createdDate;

	@UpdateTimestamp
	@Column(name = "updated_date")
	private LocalDateTime updatedDate;

	@OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<PremiumPayment> payments = new ArrayList<>();

	@OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<Claim> claims = new ArrayList<>();

	@Version
	private Long version;
}
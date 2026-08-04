package com.insurance.demo.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.insurance.demo.enums.PremiumType;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Index; // Ensure this is imported

@Entity
@Table(name = "policy_plans", indexes = { @Index(name = "idx_plan_product_id", columnList = "product_id"),
		@Index(name = "idx_plan_is_active", columnList = "is_active") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PolicyPlan {

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "product_id", nullable = false)
	private InsuranceProduct insuranceProduct;

	@NotBlank(message = "name can't be blank")
	@Column(name = "plan_name", nullable = false)
	@Size(min = 2, max = 100, message = "name should be between 2 - 100 characters")
	private String planName;

	@Column(name = "plan_version", nullable = false)
	@NotNull(message = "plan version is required")
	private Integer planVersion = 1;

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "policy_plan_durations", joinColumns = @JoinColumn(name = "plan_id"))
	@Column(name = "duration")
	private Set<Integer> allowedDurations = new HashSet<>();

	@Enumerated(EnumType.STRING)
	@Column(name = "supported_premium_type", nullable = false)
	private PremiumType supportedPremiumType;

	@OneToMany(mappedBy = "policyPlan", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<CoverageOption> coverageOptions = new ArrayList<>();

	@NotBlank(message = "T & C can't be blank")
	@Column(name = "terms_conditions", nullable = false, length = 3000)
	private String termsAndConditions;

	@NotNull(message = "status can't be null")
	@Column(name = "is_active", nullable = false)
	private Boolean isActive = true;

	@Column(name = "created_date", updatable = false)
	@CreationTimestamp
	private LocalDateTime createdDate;

	@Column(name = "updated_date")
	@UpdateTimestamp
	private LocalDateTime updatedDate;

	@OneToMany(mappedBy = "policyPlan")
	private List<Policy> policies;
}
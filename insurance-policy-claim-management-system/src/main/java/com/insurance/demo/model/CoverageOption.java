package com.insurance.demo.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
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

@Entity
@Table(name = "coverage_options", indexes = { @Index(name = "idx_coverage_plan_id", columnList = "plan_id") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoverageOption {

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@JsonIgnore
	@ManyToOne
	@JoinColumn(name = "plan_id", nullable = false)
	private PolicyPlan policyPlan;

	@Positive(message = "coverage amount should be positive")
	@Column(name = "coverage_amount", nullable = false, precision = 15, scale = 2)
	@NotNull(message = "coverage amount can't be null")
	private BigDecimal coverageAmount;

	@NotBlank(message = "label can't be blank")
	@Column(name = "label", nullable = false)
	private String label;

	@Column(name = "display_order", nullable = false)
	@NotNull(message = "display order can't be null")
	private Integer displayOrder;

	@Column(name = "is_active", nullable = false)
	@NotNull(message = "status is required")
	private Boolean isActive = true;
}

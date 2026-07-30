package com.insurance.demo.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.insurance.demo.enums.ProductType;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "insurance_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceProduct {

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "product_name", nullable = false, unique = true)
	@NotBlank(message = "Product name is required")
	@Size(min = 2, max = 100, message = "name should be beteeen 2 - 100 characters")
	private String productName;

	@Enumerated(EnumType.STRING)
	@Column(name = "product_type", nullable = false)
	@NotNull(message = "Product type is required")
	private ProductType productType;

	@Column(name = "description", nullable = false)
	@NotBlank(message = "Description is required")
	@Size(min = 10, message = "description should be min 10 characters")
	private String description;

	@Column(name = "is_active", nullable = false)
	@NotNull(message = "Status is required")
	private Boolean isActive = true;

	@Column(name = "created_date", updatable = false)
	@CreationTimestamp
	private LocalDateTime createdDate;

	@Column(name = "updated_date")
	@UpdateTimestamp
	private LocalDateTime updatedDate;

	@JsonIgnore
	@OneToMany(mappedBy = "insuranceProduct", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<PolicyPlan> policyPlans = new ArrayList<>();
}

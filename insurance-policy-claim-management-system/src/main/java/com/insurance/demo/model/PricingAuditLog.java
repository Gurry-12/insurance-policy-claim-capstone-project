package com.insurance.demo.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pricing_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PricingAuditLog {

	@Id
	@Column(name = "id")
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "pricing_rule_id", nullable = false)
	@NotNull(message = "pricing rule id can't be null")
	private Long pricingRuleId;

	@Column(name = "old_configuration", columnDefinition = "TEXT")
	private String oldConfiguration;

	@Column(name = "new_configuration", columnDefinition = "TEXT", nullable = false)
	@NotNull(message = "new configuration can't be null")
	private String newConfiguration;

	@Column(name = "remarks", length = 500)
	private String remarks;

	@Column(name = "changed_by", nullable = false)
	@NotNull(message = "changed by can't be null")
	private String changedBy;

	@Column(name = "changed_at", updatable = false)
	@CreationTimestamp
	private LocalDateTime changedAt;
}

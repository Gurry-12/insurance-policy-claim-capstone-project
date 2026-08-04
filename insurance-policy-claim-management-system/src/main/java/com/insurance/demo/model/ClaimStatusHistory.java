package com.insurance.demo.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "claim_status_histories", indexes = { @Index(name = "idx_csh_claim_id", columnList = "claim_id"),
		@Index(name = "idx_csh_updated_by", columnList = "updated_by"),
		@Index(name = "idx_csh_new_status", columnList = "new_status") })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClaimStatusHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id;

	@Column(name = "previous_status")
	private String previousStatus;

	@NotBlank(message = "New status is required")
	@Column(name = "new_status", nullable = false)
	private String newStatus;

	@Column(name = "remarks")
	private String remarks;

	@NotNull(message = "Updated by is required")
	@Column(name = "updated_by", nullable = false)
	private String updatedBy;

	@Column(name = "updated_date")
	private LocalDateTime updatedDate;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "claim_id", nullable = false)
	private Claim claim;
}
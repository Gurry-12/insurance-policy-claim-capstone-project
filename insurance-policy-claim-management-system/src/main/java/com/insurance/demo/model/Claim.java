package com.insurance.demo.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.insurance.demo.enums.ClaimStatus; 

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "claims")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Claim {

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_number", unique = true, nullable = false, length = 50)
    private String claimNumber; 

    @Positive(message = "Claim amount must be greater than zero")
    @NotNull(message = "Claim amount is required")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal claimAmount;

    @NotBlank(message = "Claim reason is required")
    @Column(nullable = false)
    private String claimReason;

    @NotNull(message = "Incident date is required")
    @Column(name = "incident_date", nullable = false)
    private LocalDateTime incidentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "claim_status", nullable = false)
    @NotNull(message = "Claim status is required")
    private ClaimStatus claimStatus;

    @Column(name = "staff_remarks")
    private String staffRemarks;

    @Column(name = "admin_remarks")
    private String adminRemarks;

    @CreationTimestamp
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    @UpdateTimestamp
    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    @NotNull(message = "Policy is required")
    private Policy policy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private AppUser assignedStaff;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ClaimDocument> claimDocuments = new ArrayList<>();

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ClaimStatusHistory> claimStatusHistories = new ArrayList<>();

    @Version
    private Long version;
}
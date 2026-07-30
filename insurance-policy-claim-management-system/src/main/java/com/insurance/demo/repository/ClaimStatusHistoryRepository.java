package com.insurance.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.ClaimStatusHistory;

@Repository
public interface ClaimStatusHistoryRepository extends JpaRepository<ClaimStatusHistory, Long>{

	Page<ClaimStatusHistory> findByClaimIdAndUpdatedByContainingIgnoreCaseAndNewStatus(Long claimId, String updatedBy, String newStatus, Pageable pageable);

	Page<ClaimStatusHistory> findByClaimIdAndUpdatedByContainingIgnoreCase(Long claimId, String updatedBy, Pageable pageable);

	Page<ClaimStatusHistory> findByClaimIdAndNewStatus(Long claimId, String newStatus,
			Pageable pageable);

	Page<ClaimStatusHistory> findByClaimId(Long claimId, Pageable pageable);
}

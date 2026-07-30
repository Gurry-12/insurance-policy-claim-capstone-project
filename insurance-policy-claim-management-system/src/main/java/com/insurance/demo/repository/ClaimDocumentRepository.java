package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.Claim;
import com.insurance.demo.model.ClaimDocument;
@Repository
public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, Long>{

	List<ClaimDocument> findByClaimId(Long claimId);

}

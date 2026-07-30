package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.Claim;
import com.insurance.demo.model.ClaimDocument;
@Repository
public interface ClaimDocumentRepository extends JpaRepository<ClaimDocument, Integer>{

	List<ClaimDocument> findByClaimId(Long claimId);

	Optional<ClaimDocument> findById(Long documentId);

}

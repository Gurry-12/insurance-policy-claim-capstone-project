package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.PolicyPlan;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PolicyPlanRepository extends JpaRepository<PolicyPlan, Long>, JpaSpecificationExecutor<PolicyPlan> {


	@Query("SELECT p FROM PolicyPlan p WHERE p.id = :id AND p.isActive = true AND p.insuranceProduct.isActive = true")
	Optional<PolicyPlan> findByIdAndIsActiveTrue(@Param("id") Long id);

	boolean existsByPlanNameIgnoreCase(String planName);

	@Query("SELECT p FROM PolicyPlan p WHERE p.isActive = true AND p.insuranceProduct.isActive = true")
	List<PolicyPlan> findByIsActiveTrue();

	@Query("SELECT p FROM PolicyPlan p WHERE p.insuranceProduct.id = :productId AND p.isActive = true AND p.insuranceProduct.isActive = true")
	List<PolicyPlan> findByInsuranceProductIdAndIsActiveTrue(@Param("productId") Long productId);

	Page<PolicyPlan> findByIsActiveTrue(Pageable pageable);

	Page<PolicyPlan> findByInsuranceProductIdAndIsActiveTrue(Long productId, Pageable pageable);

	Page<PolicyPlan> findByInsuranceProductIdAndIsActive(Long productId, Boolean isActive, Pageable pageable);

	Page<PolicyPlan> findByInsuranceProductId(Long productId, Pageable pageable);

	Page<PolicyPlan> findByIsActive(Boolean isActive, Pageable pageable);

}


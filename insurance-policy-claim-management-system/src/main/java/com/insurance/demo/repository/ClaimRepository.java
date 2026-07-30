package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

import com.insurance.demo.enums.ClaimStatus;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.model.Claim;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long>, JpaSpecificationExecutor<Claim>{

	Optional<Claim> findByClaimNumber(String claimNumber);

    // Security: Customer can only access their own claims
    Optional<Claim> findByIdAndPolicyCustomerUserId(Long claimId, Long userId);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
    List<Claim> findByPolicyCustomerUserId(Long customerUserId);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
    List<Claim> findByPolicyId(Long policyId);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
    Page<Claim> findByPolicyCustomerUserId(Long customerUserId, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
    Page<Claim> findByClaimStatus(ClaimStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
    Page<Claim> findByPolicyCustomerId(Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
	Page<Claim> findByPolicyCustomerIdAndClaimStatus(Long customerId, ClaimStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
	Page<Claim> findByAssignedStaffId(Long staffId, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
	Page<Claim> findByAssignedStaffIdAndClaimStatus(Long staffId, ClaimStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
	Page<Claim> findByPolicyPolicyPlanInsuranceProductProductType(ProductType productType, Pageable pageable);

    @EntityGraph(attributePaths = {"policy.customer.user", "policy.policyPlan.insuranceProduct", "assignedStaff"})
	Page<Claim> findByPolicyPolicyPlanInsuranceProductProductTypeAndClaimStatus(ProductType productType, ClaimStatus status, Pageable pageable);

	@Query("SELECT COALESCE(SUM(c.claimAmount), 0) FROM Claim c WHERE c.policy.id = :policyId AND c.claimStatus != :status")
	BigDecimal sumActiveClaimsByPolicyId(@Param("policyId") Long policyId, @Param("status") ClaimStatus status);
}

package com.insurance.demo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.model.Policy;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PolicyRepository extends JpaRepository<Policy, Long>, JpaSpecificationExecutor<Policy> {

	boolean existsByPolicyNumber(String policyNumber);

	Page<Policy> findByCustomerId(Long customerId, Pageable pageable);

	Page<Policy> findByPolicyStatus(PolicyStatus policyStatus, Pageable pageable);

	Page<Policy> findByCustomerIdAndPolicyStatus(Long customerId, PolicyStatus policyStatus, Pageable pageable);

	List<Policy> findByPolicyStatus(PolicyStatus policyStatus);
	
	boolean existsByCustomerIdAndPolicyPlanIdAndPolicyStatusIn(
	        Long customerId,
	        Long policyPlanId,
	        List<PolicyStatus> statuses
	);

	boolean existsByPricingRuleId(Long pricingRuleId);

	boolean existsByPolicyPlanId(Long policyPlanId);

	boolean existsByPolicyPlanIdAndPolicyDuration(Long policyPlanId, Integer policyDuration);

	boolean existsByPolicyPlanIdAndSelectedCoverage(Long policyPlanId, java.math.BigDecimal selectedCoverage);
}



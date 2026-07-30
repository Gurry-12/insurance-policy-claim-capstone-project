package com.insurance.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.enums.PricingRuleStatus;
import com.insurance.demo.model.PricingRule;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
public interface PricingRuleRepository extends JpaRepository<PricingRule, Long>, JpaSpecificationExecutor<PricingRule> {
	List<PricingRule> findByPolicyPlanIdAndStatusOrderByIdDesc(Long planId, PricingRuleStatus status);
}

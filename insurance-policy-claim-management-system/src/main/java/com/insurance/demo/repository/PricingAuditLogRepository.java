package com.insurance.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.PricingAuditLog;

import java.util.List;

@Repository
public interface PricingAuditLogRepository extends JpaRepository<PricingAuditLog, Long> {
	List<PricingAuditLog> findByPricingRuleIdOrderByChangedAtDesc(Long pricingRuleId);
}

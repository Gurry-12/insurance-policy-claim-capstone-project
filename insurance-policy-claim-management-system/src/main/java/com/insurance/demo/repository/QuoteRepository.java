package com.insurance.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.Quote;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
	boolean existsByPricingRuleId(Long pricingRuleId);
}

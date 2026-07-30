package com.insurance.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.model.CoverageOption;

@Repository
public interface CoverageOptionRepository extends JpaRepository<CoverageOption, Long> {
	List<CoverageOption> findByPolicyPlanIdAndIsActiveTrueOrderByDisplayOrderAsc(Long planId);
	List<CoverageOption> findByPolicyPlanId(Long planId);
	List<CoverageOption> findByPolicyPlanIdOrderByDisplayOrderAsc(Long planId);
}

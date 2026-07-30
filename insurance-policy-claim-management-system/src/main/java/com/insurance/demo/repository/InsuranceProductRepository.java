package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.insurance.demo.enums.ProductType;
import com.insurance.demo.model.InsuranceProduct;

@Repository
public interface InsuranceProductRepository extends JpaRepository<InsuranceProduct, Long>, JpaSpecificationExecutor<InsuranceProduct>{

	boolean existsByProductNameIgnoreCase(String productName);

	Optional<InsuranceProduct> findByProductNameIgnoreCase(String productName);

	List<InsuranceProduct> findByIsActiveTrue();

	Page<InsuranceProduct> findByProductTypeAndIsActive(ProductType productType, Boolean isActive, Pageable pageable);

	Page<InsuranceProduct> findByProductType(ProductType productType, Pageable pageable);

	Page<InsuranceProduct> findByIsActive(Boolean isActive, Pageable pageable);
}

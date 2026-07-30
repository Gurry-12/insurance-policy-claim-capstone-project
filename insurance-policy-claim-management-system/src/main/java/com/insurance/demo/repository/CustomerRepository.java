package com.insurance.demo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.insurance.demo.model.Customer;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

	Optional<Customer> findByUserEmail(String email);

	Optional<Customer> findByUserId(Long userId);
	boolean existsByUserId(Long userId);

	Page<Customer> findByCityContainingIgnoreCaseAndStateContainingIgnoreCase(String city, String state,
			Pageable pageable);

	Page<Customer> findByCityContainingIgnoreCase(String city, Pageable pageable);

	Page<Customer> findByStateContainingIgnoreCase(String state, Pageable pageable);
}

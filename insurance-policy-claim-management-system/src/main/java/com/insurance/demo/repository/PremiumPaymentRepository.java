package com.insurance.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurance.demo.enums.PaymentStatus;
import com.insurance.demo.model.PremiumPayment;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface PremiumPaymentRepository extends JpaRepository<PremiumPayment, Long>, JpaSpecificationExecutor<PremiumPayment>{
	
	boolean existsByTransactionReference(String transactionReference);

	List<PremiumPayment> findByPolicyId(Long id);

	List<PremiumPayment> findByPolicyCustomerUserId(Long userId);

	List<PremiumPayment> findByPolicyIdAndPolicyCustomerUserId(Long policyId, Long userId);

	Page<PremiumPayment> findByPolicyIdAndPaymentStatus(Long policyId, PaymentStatus paymentStatus, Pageable pageable);

	Page<PremiumPayment> findByPolicyId(Long policyId, Pageable pageable);

	Page<PremiumPayment> findByPaymentStatus(PaymentStatus paymentStatus, Pageable pageable);
	
	Optional<PremiumPayment> findTopByPolicyIdAndPaymentStatusOrderByPaymentDateDesc(
	        Long policyId,
	        PaymentStatus paymentStatus);

	long countByPolicyIdAndPaymentStatus(
	        Long policyId,
	        PaymentStatus status);

	boolean existsByPolicyIdAndPaymentStatus(
	        Long policyId,
	        PaymentStatus status);

}

package com.insurance.demo.repository;



import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.OtpVerification;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
	
	Optional<OtpVerification> findTopByUserOrderByCreatedAtDesc(AppUser user);

	@Query("SELECT COALESCE(SUM(o.sendCount), 0) FROM OtpVerification o WHERE o.user = :user AND o.createdAt >= :since")
	int getTotalOtpSendsSince(@Param("user") AppUser user, @Param("since") LocalDateTime since);

}


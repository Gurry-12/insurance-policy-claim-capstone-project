package com.insurance.demo.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.model.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	@Modifying
	@Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false")
	int revokeAllActiveForUser(@Param("userId") Long userId);

	/**
	 * Purges refresh tokens that can never be used again: expired tokens and
	 * tokens revoked longer ago than the retention window. Called by
	 * {@code RefreshTokenCleanupScheduler} so the table does not grow without
	 * bound.
	 */
	@Modifying(flushAutomatically = true)
	@Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now OR (r.revoked = true AND r.createdAt < :retention)")
	int purgeStale(@Param("now") LocalDateTime now, @Param("retention") LocalDateTime retention);

	@Transactional
	void deleteAllByUserId(Long userId);
}

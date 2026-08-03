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

	Optional<RefreshToken> findByJti(String jti);

	@Modifying
	@Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false")
	int revokeAllActiveForUser(@Param("userId") Long userId);

	/**
	 * Atomically claims a token for rotation: flips {@code revoked} to
	 * {@code true} only if the token is still active and unexpired. Because the
	 * condition is evaluated under a row lock, at most one concurrent request
	 * can win the rotation of a given token; the losers observe 0 rows and are
	 * handled as replays by the caller.
	 */
	@Modifying(flushAutomatically = true)
	@Query("UPDATE RefreshToken r SET r.revoked = true, r.replacedBy = :replacedBy "
			+ "WHERE r.tokenHash = :tokenHash AND r.revoked = false AND r.expiresAt > :now")
	int revokeAndMarkReplaced(@Param("tokenHash") String tokenHash, @Param("replacedBy") String replacedBy,
			@Param("now") LocalDateTime now);

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

package com.insurance.demo.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.dao.DeadlockLoserDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.insurance.demo.config.AppSecurityProperties;
import com.insurance.demo.config.SecurityAuditLogger;
import com.insurance.demo.exception.RefreshTokenException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.RefreshToken;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.RefreshTokenRepository;
import com.insurance.demo.security.cache.RedisTokenCacheService;
import com.insurance.demo.util.MessageConstants;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

	private static final int TOKEN_BYTES = 32;

	private final RefreshTokenRepository refreshTokenRepository;

	private final AppUserRepository userRepository;

	private final AppSecurityProperties properties;

	private final SecurityAuditLogger auditLogger;

	private final PlatformTransactionManager transactionManager;

	private final RedisTokenCacheService redisTokenCacheService;

	private final SecureRandom secureRandom = new SecureRandom();

	public record RotatedRefreshToken(String rawToken, AppUser user) {
	}

	@Transactional
	public String createRefreshToken(AppUser user) {
		String rawToken = generateRawToken();
		String jti = UUID.randomUUID().toString();

		RefreshToken refreshToken = RefreshToken.builder().user(user).tokenHash(hash(rawToken)).jti(jti)
				.expiresAt(LocalDateTime.now().plus(refreshTokenTtl())).revoked(false)
				.tokenVersion(user.getTokenVersion() == null ? 0L : user.getTokenVersion()).build();

		refreshTokenRepository.save(refreshToken);
		redisTokenCacheService.cacheRefreshToken(user.getId(), refreshToken.getTokenHash(), refreshTokenTtl());

		auditLogger.logEvent(SecurityAuditLogger.REFRESH_TOKEN_ISSUED, "userId=" + user.getId());

		return rawToken;
	}

	/**
	 * Validates the presented refresh token and rotates it: the old token is
	 * marked revoked and a fresh one is issued. Presenting an already-revoked
	 * token indicates a replay, which revokes the entire session family for the
	 * user.
	 *
	 * <p>
	 * Rotation is atomic: a conditional update flips {@code revoked} only for an
	 * active, unexpired token. Concurrent refreshes of the same token can
	 * therefore never both succeed - the loser of the race observes the now
	 * revoked token and is treated as a replay, revoking the whole family.
	 */
	@Transactional
	public RotatedRefreshToken rotate(String rawToken) {
		String tokenHash = hash(rawToken);
		RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
				.orElseThrow(() -> invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID));

		if (stored.isRevoked()) {
			if (redisTokenCacheService.getGraceToken(tokenHash) != null) {
				// Rotated within the 10-second grace window by a concurrent browser tab - avoid false-positive family revocation
				throw new RefreshTokenException(MessageConstants.Auth.SESSION_EXPIRED);
			}
			// Replay of a rotated token - assume compromise and kill the whole family.
			revokeSessionFamily(stored.getUser().getId());
			auditLogger.logEvent(SecurityAuditLogger.REFRESH_REUSE_DETECTED, "userId=" + stored.getUser().getId());
			throw new RefreshTokenException(MessageConstants.Auth.SESSION_EXPIRED);
		}

		LocalDateTime now = LocalDateTime.now();
		if (stored.getExpiresAt().isBefore(now)) {
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		AppUser user = stored.getUser();

		if (Boolean.FALSE.equals(user.getIsActive())) {
			revokeSessionFamily(user.getId());
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		Long storedVersion = stored.getTokenVersion();
		Long currentVersion = user.getTokenVersion() == null ? 0L : user.getTokenVersion();
		if (storedVersion != null && !storedVersion.equals(currentVersion)) {
			// tokenVersion changed (password reset / deactivation) since issue.
			revokeSessionFamily(user.getId());
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		// Atomically claim the rotation and issue the replacement in its own
		// transaction. Only one concurrent request can flip revoked=true; the
		// rest observe 0 rows and are handled as replays below. Running the claim
		// in a separate transaction ensures a losing request does not hold the
		// token row locked while it revokes the session family afterwards - doing
		// both in the same transaction deadlocked MySQL (the loser's REQUIRES_NEW
		// family update waited on a row its own outer transaction had locked).
		String newJti = UUID.randomUUID().toString();
		RotatedRefreshToken rotated = claimAndIssue(user, tokenHash, newJti, currentVersion, now);

		if (rotated == null) {
			if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
				// Expired within the race window - not a replay.
				throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
			}
			if (redisTokenCacheService.getGraceToken(tokenHash) != null) {
				// Rotated within the 10-second grace window by a concurrent browser tab - avoid false-positive family revocation
				throw new RefreshTokenException(MessageConstants.Auth.SESSION_EXPIRED);
			}
			// Another request rotated the same token concurrently - a replay.
			revokeSessionFamily(user.getId());
			auditLogger.logEvent(SecurityAuditLogger.REFRESH_REUSE_DETECTED, "userId=" + user.getId());
			throw new RefreshTokenException(MessageConstants.Auth.SESSION_EXPIRED);
		}

		auditLogger.logEvent(SecurityAuditLogger.REFRESH_TOKEN_ROTATED, "userId=" + user.getId());

		redisTokenCacheService.cacheGraceToken(tokenHash, hash(rotated.rawToken()),
				Duration.ofSeconds(properties.getRedis().getGraceWindowSeconds()));
		redisTokenCacheService.cacheRefreshToken(user.getId(), hash(rotated.rawToken()), refreshTokenTtl());
		redisTokenCacheService.evictRefreshToken(user.getId(), tokenHash);

		return rotated;
	}

	/**
	 * Atomically claims a token for rotation and issues the replacement in a
	 * single REQUIRES_NEW transaction. The claim is the conditional update
	 * {@code revokeAndMarkReplaced}, which flips {@code revoked} to
	 * {@code true} only for an active, unexpired token, so at most one
	 * concurrent request can win. Returns {@code null} when another request
	 * rotated the token first.
	 *
	 * <p>
	 * Running this in its own transaction is what prevents a self-deadlock in
	 * the losing requests: once the claim commits (and its row lock is
	 * released), a loser can revoke the session family in a further REQUIRES_NEW
	 * transaction without waiting on a row lock its own outer transaction still
	 * holds.
	 */
	private RotatedRefreshToken claimAndIssue(AppUser user, String tokenHash, String newJti, Long currentVersion,
			LocalDateTime now) {
		TransactionTemplate requiresNew = new TransactionTemplate(transactionManager);
		requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
		return requiresNew.execute(status -> {
			int claimed = refreshTokenRepository.revokeAndMarkReplaced(tokenHash, newJti, now);
			if (claimed == 0) {
				return null;
			}
			String newRawToken = generateRawToken();
			RefreshToken replacement = RefreshToken.builder().user(user).tokenHash(hash(newRawToken)).jti(newJti)
					.expiresAt(now.plus(refreshTokenTtl())).revoked(false).tokenVersion(currentVersion).build();
			refreshTokenRepository.save(replacement);
			return new RotatedRefreshToken(newRawToken, user);
		});
	}

	@Transactional
	public void revoke(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			return;
		}
		refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(stored -> {
			stored.setRevoked(true);
			refreshTokenRepository.save(stored);
			redisTokenCacheService.evictRefreshToken(stored.getUser().getId(), stored.getTokenHash());
			redisTokenCacheService.evictGraceToken(stored.getTokenHash());
		});
		auditLogger.logEvent(SecurityAuditLogger.LOGOUT, "rawToken present=" + (rawToken != null));
	}

	@Transactional
	public void revokeAllForUser(Long userId) {
		refreshTokenRepository.revokeAllActiveForUser(userId);
		redisTokenCacheService.evictUserSessionFamily(userId);
	}

	/**
	 * Revokes the user's active refresh tokens in its own transaction so the
	 * revocation survives the (intentional) rollback that follows when a
	 * compromised/replayed token is rejected.
	 */
	private void revokeSessionFamily(Long userId) {
		TransactionTemplate requiresNew = new TransactionTemplate(transactionManager);
		requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
		requiresNew.executeWithoutResult(status -> {
			refreshTokenRepository.revokeAllActiveForUser(userId);
			redisTokenCacheService.evictUserSessionFamily(userId);
		});
	}

	private Duration refreshTokenTtl() {
		return Duration.ofDays(properties.getJwt().getRefreshTokenTtlDays());
	}

	private RefreshTokenException invalidToken(String auditEvent) {
		auditLogger.logEvent(auditEvent, "refresh token rejected");
		return new RefreshTokenException(MessageConstants.Auth.SESSION_EXPIRED);
	}

	private String generateRawToken() {
		byte[] bytes = new byte[TOKEN_BYTES];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private static String hash(String rawToken) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is not available", ex);
		}
	}
}

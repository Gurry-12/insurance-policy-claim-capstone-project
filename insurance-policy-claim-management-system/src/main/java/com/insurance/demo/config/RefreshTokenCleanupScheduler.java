package com.insurance.demo.config;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.insurance.demo.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Daily purge of refresh tokens that can no longer be used, so the
 * {@code refresh_tokens} table does not grow without bound. Expired tokens are
 * removed immediately; revoked tokens are kept for a short retention window so
 * recent security events remain inspectable in the audit trail.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupScheduler {

	private static final int REVOKED_RETENTION_DAYS = 30;

	private final RefreshTokenRepository refreshTokenRepository;

	private final SecurityAuditLogger auditLogger;

	@Scheduled(cron = "0 0 2 * * *")
	public void purgeStaleTokens() {
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime retention = now.minusDays(REVOKED_RETENTION_DAYS);
		int deleted = refreshTokenRepository.purgeStale(now, retention);
		if (deleted > 0) {
			log.info("Purged {} stale refresh token(s)", deleted);
			auditLogger.logEvent(SecurityAuditLogger.REFRESH_TOKEN_PURGED, "deleted=" + deleted);
		}
	}
}

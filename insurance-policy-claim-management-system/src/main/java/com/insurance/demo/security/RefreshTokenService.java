package com.insurance.demo.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurance.demo.config.AppSecurityProperties;
import com.insurance.demo.config.SecurityAuditLogger;
import com.insurance.demo.exception.RefreshTokenException;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.RefreshToken;
import com.insurance.demo.repository.RefreshTokenRepository;
import com.insurance.demo.util.MessageConstants;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

	private static final int TOKEN_BYTES = 32;

	private final RefreshTokenRepository refreshTokenRepository;

	private final AppSecurityProperties properties;

	private final SecurityAuditLogger auditLogger;

	private final SecureRandom secureRandom = new SecureRandom();

	@Transactional
	public String createRefreshToken(AppUser user) {
		String rawToken = generateRawToken();

		RefreshToken refreshToken = RefreshToken.builder().user(user).tokenHash(hash(rawToken))
				.expiresAt(LocalDateTime.now().plus(refreshTokenTtl())).revoked(false)
				.tokenVersion(user.getTokenVersion() == null ? 0L : user.getTokenVersion()).build();

		refreshTokenRepository.save(refreshToken);

		auditLogger.logEvent(SecurityAuditLogger.REFRESH_TOKEN_ISSUED, "userId=" + user.getId());

		return rawToken;
	}

	@Transactional(readOnly = true)
	public AppUser validateRefreshToken(String rawToken) {
		String tokenHash = hash(rawToken);
		RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
				.orElseThrow(() -> invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID));

		if (stored.isRevoked()) {
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		AppUser user = stored.getUser();

		if (Boolean.FALSE.equals(user.getIsActive())) {
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		Long storedVersion = stored.getTokenVersion();
		Long currentVersion = user.getTokenVersion() == null ? 0L : user.getTokenVersion();
		if (storedVersion != null && !storedVersion.equals(currentVersion)) {
			// tokenVersion changed (password reset / deactivation) since issue.
			throw invalidToken(SecurityAuditLogger.REFRESH_TOKEN_INVALID);
		}

		return user;
	}

	@Transactional
	public void revoke(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			return;
		}
		refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(stored -> {
			stored.setRevoked(true);
			refreshTokenRepository.save(stored);
		});
		auditLogger.logEvent(SecurityAuditLogger.LOGOUT, "rawToken present=" + (rawToken != null));
	}

	@Transactional
	public void revokeAllForUser(Long userId) {
		refreshTokenRepository.revokeAllActiveForUser(userId);
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

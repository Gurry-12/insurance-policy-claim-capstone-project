package com.insurance.demo.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.insurance.demo.config.AppSecurityProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	public static final String CLAIM_ROLE = "role";
	public static final String CLAIM_TOKEN_VERSION = "tokenVersion";

	private final AppSecurityProperties properties;

	private final SecretKey signingKey;

	public JwtService(AppSecurityProperties properties) {
		this.properties = properties;
		this.signingKey = buildSigningKey(properties.getJwt().getSecret());
	}

	/**
	 * Generates a JWT containing only stateless metadata: subject (email),
	 * issuer, issued-at, expiry, a unique token id (jti) and the informational
	 * role claim. The tokenVersion claim enables stateless revocation.
	 *
	 * <p>The {@code role} claim is informational only. Authorization decisions
	 * are always based on authorities loaded from the database.
	 */
	public String generateToken(UserDetails userDetails, Long tokenVersion) {

		List<String> authorities = userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

		Date issuedAt = new Date();
		Date expiryDate = new Date(issuedAt.getTime() + properties.getJwt().getExpirationMs());

		return Jwts.builder()
				.id(UUID.randomUUID().toString())
				.subject(userDetails.getUsername())
				.issuer(properties.getJwt().getIssuer())
				.claim(CLAIM_ROLE, authorities.isEmpty() ? null : authorities.get(0))
				.claim(CLAIM_TOKEN_VERSION, tokenVersion != null ? tokenVersion : 0L)
				.issuedAt(issuedAt)
				.expiration(expiryDate)
				.signWith(signingKey)
				.compact();
	}

	/**
	 * Parses and validates a token (signature, issuer, expiry including clock
	 * skew) in a single pass. Throws on any invalid token.
	 */
	public Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(signingKey)
				.clockSkewSeconds(properties.getJwt().getClockSkewSeconds())
				.requireIssuer(properties.getJwt().getIssuer())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public String extractUsername(String token) {
		return parseClaims(token).getSubject();
	}

	public Long extractTokenVersion(Claims claims) {
		Number value = claims.get(CLAIM_TOKEN_VERSION, Number.class);
		return value != null ? value.longValue() : 0L;
	}

	public boolean isTokenValid(Claims claims, UserDetails userDetails) {
		if (claims == null || userDetails == null) {
			return false;
		}
		if (!claims.getSubject().equals(userDetails.getUsername())) {
			return false;
		}
		if (!(userDetails instanceof AppUserDetails appUserDetails)) {
			return false;
		}
		return appUserDetails.getTokenVersion().equals(extractTokenVersion(claims));
	}

	public long getJwtExpirationMs() {
		return properties.getJwt().getExpirationMs();
	}

	public Duration getAccessTokenTtl() {
		return Duration.ofMillis(properties.getJwt().getExpirationMs());
	}

	private static SecretKey buildSigningKey(String secret) {
		if (secret == null || secret.isBlank()) {
			throw new IllegalStateException("JWT signing key is not configured. Set app.security.jwt.secret.");
		}
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			throw new IllegalStateException(
					"JWT signing key must be at least 256 bits (32 characters). Current length: " + keyBytes.length);
		}
		return Keys.hmacShaKeyFor(keyBytes);
	}
}

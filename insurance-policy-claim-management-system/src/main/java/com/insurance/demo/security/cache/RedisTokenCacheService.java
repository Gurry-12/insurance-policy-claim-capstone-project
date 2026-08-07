package com.insurance.demo.security.cache;

import java.time.Duration;

/**
 * Service interface for Redis-backed token caching, JWT blacklisting, and
 * Refresh Token rotation grace period management.
 *
 * <p>All implementations must provide graceful fallback so the application
 * continues to function using database queries when Redis is disabled or
 * offline.
 */
public interface RedisTokenCacheService {

	/**
	 * Blacklists an access token JWT by its unique ID (jti) for its remaining lifetime.
	 */
	void blacklistJwt(String jti, Duration remainingTtl);

	/**
	 * Checks if a JWT ID (jti) has been blacklisted. Returns false if Redis is
	 * disabled or unreachable.
	 */
	boolean isJwtBlacklisted(String jti);
}

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

	/**
	 * Caches an active refresh token hash with an expiration TTL.
	 */
	void cacheRefreshToken(Long userId, String tokenHash, Duration ttl);

	/**
	 * Checks if a refresh token hash is currently cached as active in Redis.
	 */
	boolean isRefreshTokenCached(Long userId, String tokenHash);

	/**
	 * Removes an active refresh token from Redis (used during rotation or logout).
	 */
	void evictRefreshToken(Long userId, String tokenHash);

	/**
	 * Stores a temporary grace mapping from an old token hash to a newly rotated
	 * token hash for concurrent browser tab requests.
	 */
	void cacheGraceToken(String oldTokenHash, String newTokenHash, Duration ttl);

	/**
	 * Retrieves the newly rotated token hash if the old token was rotated within
	 * the grace window, or null otherwise.
	 */
	String getGraceToken(String oldTokenHash);

	/**
	 * Evicts a grace token mapping.
	 */
	void evictGraceToken(String oldTokenHash);

	/**
	 * Evicts all cached refresh tokens for a user (e.g. on session family revocation).
	 */
	void evictUserSessionFamily(Long userId);
}

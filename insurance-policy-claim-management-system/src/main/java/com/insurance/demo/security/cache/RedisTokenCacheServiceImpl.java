package com.insurance.demo.security.cache;

import java.time.Duration;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.insurance.demo.config.AppSecurityProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link RedisTokenCacheService} using Spring's
 * {@link StringRedisTemplate}.
 *
 * <p>Includes complete graceful fallback: if Redis is disabled in properties
 * or if any connection error occurs, operations gracefully degrade so the SQL
 * database remains the source of truth.
 */
@Slf4j
@Service
public class RedisTokenCacheServiceImpl implements RedisTokenCacheService {

	private final StringRedisTemplate redisTemplate;

	private final AppSecurityProperties properties;

	public RedisTokenCacheServiceImpl(@Autowired(required = false) StringRedisTemplate redisTemplate,
			AppSecurityProperties properties) {
		this.redisTemplate = redisTemplate;
		this.properties = properties;
	}

	private boolean isRedisAvailable() {
		return properties.getRedis().isEnabled() && redisTemplate != null;
	}

	@Override
	public void blacklistJwt(String jti, Duration remainingTtl) {
		if (!isRedisAvailable() || jti == null || remainingTtl.isNegative() || remainingTtl.isZero()) {
			return;
		}
		try {
			String key = properties.getRedis().getJwtBlacklistPrefix() + jti;
			redisTemplate.opsForValue().set(key, "revoked", remainingTtl);
			log.debug("Blacklisted JWT jti={} with TTL={}s", jti, remainingTtl.getSeconds());
		} catch (Exception e) {
			log.debug("Redis blacklistJwt fallback: {}", e.getMessage());
		}
	}

	@Override
	public boolean isJwtBlacklisted(String jti) {
		if (!isRedisAvailable() || jti == null) {
			return false;
		}
		try {
			String key = properties.getRedis().getJwtBlacklistPrefix() + jti;
			return Boolean.TRUE.equals(redisTemplate.hasKey(key));
		} catch (Exception e) {
			log.debug("Redis isJwtBlacklisted fallback: {}", e.getMessage());
			return false;
		}
	}

	@Override
	public void cacheRefreshToken(Long userId, String tokenHash, Duration ttl) {
		if (!isRedisAvailable() || userId == null || tokenHash == null) {
			return;
		}
		try {
			String key = properties.getRedis().getRefreshTokenPrefix() + userId + ":" + tokenHash;
			redisTemplate.opsForValue().set(key, "active", ttl);
		} catch (Exception e) {
			log.debug("Redis cacheRefreshToken fallback: {}", e.getMessage());
		}
	}

	@Override
	public boolean isRefreshTokenCached(Long userId, String tokenHash) {
		if (!isRedisAvailable() || userId == null || tokenHash == null) {
			return false;
		}
		try {
			String key = properties.getRedis().getRefreshTokenPrefix() + userId + ":" + tokenHash;
			return Boolean.TRUE.equals(redisTemplate.hasKey(key));
		} catch (Exception e) {
			log.debug("Redis isRefreshTokenCached fallback: {}", e.getMessage());
			return false;
		}
	}

	@Override
	public void evictRefreshToken(Long userId, String tokenHash) {
		if (!isRedisAvailable() || userId == null || tokenHash == null) {
			return;
		}
		try {
			String key = properties.getRedis().getRefreshTokenPrefix() + userId + ":" + tokenHash;
			redisTemplate.delete(key);
		} catch (Exception e) {
			log.debug("Redis evictRefreshToken fallback: {}", e.getMessage());
		}
	}

	@Override
	public void cacheGraceToken(String oldTokenHash, String newTokenHash, Duration ttl) {
		if (!isRedisAvailable() || oldTokenHash == null || newTokenHash == null) {
			return;
		}
		try {
			String key = properties.getRedis().getGracePrefix() + oldTokenHash;
			redisTemplate.opsForValue().set(key, newTokenHash, ttl);
			log.debug("Cached rotation grace token for oldTokenHash={} TTL={}s", oldTokenHash, ttl.getSeconds());
		} catch (Exception e) {
			log.debug("Redis cacheGraceToken fallback: {}", e.getMessage());
		}
	}

	@Override
	public String getGraceToken(String oldTokenHash) {
		if (!isRedisAvailable() || oldTokenHash == null) {
			return null;
		}
		try {
			String key = properties.getRedis().getGracePrefix() + oldTokenHash;
			return redisTemplate.opsForValue().get(key);
		} catch (Exception e) {
			log.debug("Redis getGraceToken fallback: {}", e.getMessage());
			return null;
		}
	}

	@Override
	public void evictGraceToken(String oldTokenHash) {
		if (!isRedisAvailable() || oldTokenHash == null) {
			return;
		}
		try {
			String key = properties.getRedis().getGracePrefix() + oldTokenHash;
			redisTemplate.delete(key);
		} catch (Exception e) {
			log.debug("Redis evictGraceToken fallback: {}", e.getMessage());
		}
	}

	@Override
	public void evictUserSessionFamily(Long userId) {
		if (!isRedisAvailable() || userId == null) {
			return;
		}
		try {
			String pattern = properties.getRedis().getRefreshTokenPrefix() + userId + ":*";
			Set<String> keys = redisTemplate.keys(pattern);
			if (keys != null && !keys.isEmpty()) {
				redisTemplate.delete(keys);
				log.debug("Evicted {} cached refresh tokens for userId={}", keys.size(), userId);
			}
		} catch (Exception e) {
			log.debug("Redis evictUserSessionFamily fallback: {}", e.getMessage());
		}
	}
}

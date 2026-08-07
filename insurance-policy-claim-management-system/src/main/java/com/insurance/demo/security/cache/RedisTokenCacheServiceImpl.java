package com.insurance.demo.security.cache;

import java.time.Duration;

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
}

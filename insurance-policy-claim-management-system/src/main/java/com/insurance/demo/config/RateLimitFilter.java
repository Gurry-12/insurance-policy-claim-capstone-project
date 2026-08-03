package com.insurance.demo.config;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Applies Bucket4j rate limits to unauthenticated authentication endpoints
 * (login, register, forgot/reset password, OTP). Buckets are keyed by the
 * combination of client IP and the email parsed from the request body, which
 * makes it harder to bypass the limit by rotating emails or IPs alone.
 *
 * <p>Limits are fully configurable via {@code app.security.rate-limit.*} and
 * applied per application instance (in-memory). A distributed limiter (e.g.
 * Redis-backed) is a documented future enhancement.
 */
public class RateLimitFilter extends OncePerRequestFilter {

	private static final List<String> RATE_LIMITED_PATHS = List.of("/api/auth/login", "/api/auth/register",
			"/api/auth/verify-otp", "/api/auth/resend-otp", "/api/auth/forgot-password", "/api/auth/reset-password",
			"/api/auth/refresh");

	private static final long BUCKET_IDLE_NANOS = Duration.ofMinutes(10).toNanos();

	private final AppSecurityProperties properties;
	private final ObjectMapper objectMapper;
	private final SecurityAuditLogger auditLogger;

	private final Map<String, TimedBucket> buckets = new ConcurrentHashMap<>();
	private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor(r -> {
		Thread t = new Thread(r, "rate-limit-cleaner");
		t.setDaemon(true);
		return t;
	});

	public RateLimitFilter(AppSecurityProperties properties, ObjectMapper objectMapper,
			SecurityAuditLogger auditLogger) {
		this.properties = properties;
		this.objectMapper = objectMapper;
		this.auditLogger = auditLogger;
		this.cleaner.scheduleWithFixedDelay(this::purgeIdleBuckets, 5, 5, TimeUnit.MINUTES);
	}

	@Override
	protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
		String path = request.getRequestURI();
		return RATE_LIMITED_PATHS.stream().noneMatch(path::equals);
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {

		CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);

		String path = request.getRequestURI();
		String group = resolveGroup(path);
		String key = clientIp(request) + "|" + extractEmail(cachedRequest);

		String bucketKey = group + ":" + key;
		TimedBucket timedBucket = buckets.compute(bucketKey, (k, existing) -> {
			TimedBucket candidate = existing != null ? existing : new TimedBucket(newBucket(group));
			candidate.lastAccessNanos = System.nanoTime();
			return candidate;
		});

		ConsumptionProbe probe = timedBucket.bucket.tryConsumeAndReturnRemaining(1);

		if (!probe.isConsumed()) {
			long retryAfterSeconds = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
			auditLogger.logEvent(SecurityAuditLogger.RATE_LIMIT_TRIGGERED,
					"path=" + path + ", key=" + key + ", retryAfterSeconds=" + retryAfterSeconds);

			response.setStatus(429);
			response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write(buildRateLimitBody(request, retryAfterSeconds));
			return;
		}

		filterChain.doFilter(cachedRequest, response);
	}

	private Bucket newBucket(String group) {
		AppSecurityProperties.RateLimit.Limit limit = limitFor(group);
		Bandwidth bandwidth = Bandwidth.classic(limit.getCapacity(),
				Refill.greedy(limit.getRefillPerMinute(), Duration.ofMinutes(1)));
		return Bucket.builder().addLimit(bandwidth).build();
	}

	private AppSecurityProperties.RateLimit.Limit limitFor(String group) {
		AppSecurityProperties.RateLimit rateLimit = properties.getRateLimit();
		return switch (group) {
			case "otp" -> rateLimit.getOtp();
			case "forgot" -> rateLimit.getForgot();
			case "reset" -> rateLimit.getReset();
			case "register" -> rateLimit.getRegister();
			case "refresh" -> rateLimit.getRefresh();
			default -> rateLimit.getLogin();
		};
	}

	private String resolveGroup(String path) {
		return switch (path) {
			case "/api/auth/verify-otp", "/api/auth/resend-otp" -> "otp";
			case "/api/auth/forgot-password" -> "forgot";
			case "/api/auth/reset-password" -> "reset";
			case "/api/auth/register" -> "register";
			case "/api/auth/refresh" -> "refresh";
			default -> "login";
		};
	}

	private String extractEmail(HttpServletRequest request) {
		try {
			JsonNode node = objectMapper.readTree(request.getInputStream());
			JsonNode email = node != null ? node.get("email") : null;
			if (email != null && email.isTextual() && !email.asText().isBlank()) {
				return email.asText().toLowerCase();
			}
		} catch (IOException ex) {
			// Non-JSON or empty body - fall back to IP-only keying.
		}
		return "unknown";
	}

	private String clientIp(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor != null && !forwardedFor.isBlank()) {
			return forwardedFor.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}

	private void purgeIdleBuckets() {
		long now = System.nanoTime();
		buckets.entrySet().removeIf(entry -> now - entry.getValue().lastAccessNanos > BUCKET_IDLE_NANOS);
	}

	private String buildRateLimitBody(HttpServletRequest request, long retryAfterSeconds) throws IOException {
		Map<String, Object> body = Map.of("timestamp", LocalDateTime.now().toString(), "statusCode", 429,
				"errorType", "RATE_LIMITED", "message",
				"Too many requests. Please try again later.", "retryAfterSeconds", retryAfterSeconds, "requestPath",
				request.getRequestURI());
		return objectMapper.writeValueAsString(body);
	}

	private static final class TimedBucket {
		private final Bucket bucket;
		private volatile long lastAccessNanos;

		private TimedBucket(Bucket bucket) {
			this.bucket = bucket;
			this.lastAccessNanos = System.nanoTime();
		}
	}
}

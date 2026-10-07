package com.insurance.demo.config;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Writes and clears the HttpOnly refresh-token cookie. The cookie is scoped to
 * {@code /api/auth} so it is only ever sent to the refresh and logout
 * endpoints, and configured with SameSite=None; Secure for cross-site
 * deployments (such as a Vercel frontend consuming a Render backend).
 */
@Component
@RequiredArgsConstructor
public class RefreshTokenCookieManager {

	public static final String COOKIE_NAME = "refresh_token";

	private final AppSecurityProperties properties;

	public void addCookie(HttpServletResponse response, String rawToken) {
		ResponseCookie cookie = buildCookie(rawToken, refreshTokenTtlSeconds());
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	public void clearCookie(HttpServletResponse response) {
		ResponseCookie cookie = buildCookie("", 0);
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	private ResponseCookie buildCookie(String rawToken, int maxAgeSeconds) {
		boolean secure = properties.getJwt().isRefreshCookieSecure();
		return ResponseCookie.from(COOKIE_NAME, rawToken)
				.httpOnly(true)
				.secure(secure)
				.path("/api/auth")
				.maxAge(maxAgeSeconds)
				.sameSite(secure ? "None" : "Lax")
				.build();
	}

	private int refreshTokenTtlSeconds() {
		return (int) Duration.ofDays(properties.getJwt().getRefreshTokenTtlDays()).getSeconds();
	}
}


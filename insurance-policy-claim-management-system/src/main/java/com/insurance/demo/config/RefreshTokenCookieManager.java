package com.insurance.demo.config;

import java.time.Duration;

import org.springframework.stereotype.Component;

import com.insurance.demo.security.RefreshTokenService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Writes and clears the HttpOnly refresh-token cookie. The cookie is scoped to
 * {@code /api/auth} so it is only ever sent to the refresh and logout
 * endpoints, and marked SameSite=Lax so it is never attached to cross-site
 * POST requests (CSRF mitigation for a cookie-authenticated endpoint).
 */
@Component
@RequiredArgsConstructor
public class RefreshTokenCookieManager {

	public static final String COOKIE_NAME = "refresh_token";

	private final AppSecurityProperties properties;

	public void addCookie(HttpServletResponse response, String rawToken) {
		response.addCookie(buildCookie(rawToken, refreshTokenTtlSeconds()));
	}

	public void clearCookie(HttpServletResponse response) {
		response.addCookie(buildCookie("", 0));
	}

	private Cookie buildCookie(String rawToken, int maxAgeSeconds) {
		Cookie cookie = new Cookie(COOKIE_NAME, rawToken);
		cookie.setHttpOnly(true);
		cookie.setSecure(properties.getJwt().isRefreshCookieSecure());
		cookie.setPath("/api/auth");
		cookie.setMaxAge(maxAgeSeconds);
		cookie.setAttribute("SameSite", "Lax");
		return cookie;
	}

	private int refreshTokenTtlSeconds() {
		return (int) Duration.ofDays(properties.getJwt().getRefreshTokenTtlDays()).getSeconds();
	}
}

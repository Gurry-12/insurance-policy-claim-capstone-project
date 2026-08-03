package com.insurance.demo.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import com.insurance.demo.dto.response.ErrorResponseDTO;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/**
 * CSRF defense-in-depth for the cookie-authenticated auth endpoints. The
 * refresh cookie is SameSite=Lax, which already prevents it being attached to
 * cross-site POSTs; this filter additionally rejects requests whose Origin
 * (or, when absent, Referer) is not the single configured allowed origin,
 * following the OWASP recommendation for cookie-authenticated endpoints.
 */
@RequiredArgsConstructor
public class CookieCsrfOriginFilter extends OncePerRequestFilter {

	private static final List<String> PROTECTED_PATHS = List.of("/api/auth/refresh", "/api/auth/logout");

	private final AppSecurityProperties properties;
	private final ObjectMapper objectMapper;
	private final SecurityAuditLogger auditLogger;

	@Override
	protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
		if (!HttpMethod.POST.matches(request.getMethod())) {
			return true;
		}
		return PROTECTED_PATHS.stream().noneMatch(request.getRequestURI()::equals);
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {

		String origin = request.getHeader("Origin");
		if (origin != null && !origin.isBlank()) {
			if (!isAllowedOrigin(origin)) {
				reject(request, response, origin);
				return;
			}
		} else {
			// Non-browser clients send no Origin; fall back to Referer when present.
			String referer = request.getHeader("Referer");
			if (referer != null && !referer.isBlank() && !isAllowedReferer(referer)) {
				reject(request, response, referer);
				return;
			}
		}

		filterChain.doFilter(request, response);
	}

	private boolean isAllowedOrigin(String origin) {
		return properties.getCorsAllowedOrigin().equalsIgnoreCase(origin);
	}

	private boolean isAllowedReferer(String referer) {
		String allowed = properties.getCorsAllowedOrigin();
		return referer.equalsIgnoreCase(allowed) || referer.startsWith(allowed + "/");
	}

	private void reject(HttpServletRequest request, HttpServletResponse response, String source) throws IOException {
		auditLogger.logEvent(SecurityAuditLogger.CSRF_REJECTED, "path=" + request.getRequestURI() + ", source=" + source);
		response.setStatus(403);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		objectMapper.writeValue(response.getWriter(), new ErrorResponseDTO(LocalDateTime.now(), 403, "CSRF_REJECTED",
				"Cross-site request rejected.", request.getRequestURI()));
	}
}

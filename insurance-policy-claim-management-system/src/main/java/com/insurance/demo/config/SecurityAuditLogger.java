package com.insurance.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Dedicated audit logger for security-relevant events.
 *
 * <p>Events are written to the {@code SECURITY_AUDIT} logger so they can be
 * routed to a separate sink (e.g. a dedicated file, ELK, or audit store) in the
 * future without polluting application logs. Application logs and security
 * audit events are intentionally kept distinct.
 */
@Component
public class SecurityAuditLogger {

	public static final String LOGIN_SUCCESS = "LOGIN_SUCCESS";
	public static final String LOGIN_FAILED = "LOGIN_FAILED";
	public static final String ACCOUNT_DISABLED = "ACCOUNT_DISABLED";
	public static final String TOKEN_INVALID = "TOKEN_INVALID";
	public static final String PASSWORD_RESET = "PASSWORD_RESET";
	public static final String RATE_LIMIT_TRIGGERED = "RATE_LIMIT_TRIGGERED";
	public static final String ACCOUNT_ACTIVATED = "ACCOUNT_ACTIVATED";
	public static final String ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED";
	public static final String REFRESH_TOKEN_ISSUED = "REFRESH_TOKEN_ISSUED";
	public static final String REFRESH_TOKEN_ROTATED = "REFRESH_TOKEN_ROTATED";
	public static final String REFRESH_REUSE_DETECTED = "REFRESH_REUSE_DETECTED";
	public static final String REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID";
	public static final String REFRESH_TOKEN_PURGED = "REFRESH_TOKEN_PURGED";
	public static final String LOGOUT = "LOGOUT";
	public static final String CSRF_REJECTED = "CSRF_REJECTED";

	private static final Logger AUDIT = LoggerFactory.getLogger("SECURITY_AUDIT");

	public void logEvent(String event, String detail) {
		AUDIT.info("[{}] {}", event, detail);
	}
}

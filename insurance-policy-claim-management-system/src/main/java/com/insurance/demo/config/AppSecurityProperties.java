package com.insurance.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@ConfigurationProperties(prefix = "app.security")
@Getter
@Setter
public class AppSecurityProperties {

	private Jwt jwt = new Jwt();

	private RateLimit rateLimit = new RateLimit();

	private int maxOtpAttempts = 5;

	private String corsAllowedOrigin = "http://localhost:5173";

	private boolean seedAdminEnabled = true;

	private boolean swaggerEnabled = true;

	@Getter
	@Setter
	public static class Jwt {

	private String secret;

	private long expirationMs = 900000;

	private String issuer = "insurance-policy-claim-management-system";

	private long clockSkewSeconds = 30;

	private long refreshTokenTtlDays = 7;

	private boolean refreshCookieSecure = false;

	}

	@Getter
	@Setter
	public static class RateLimit {

		private Limit login = new Limit();

		private Limit otp = new Limit();

		private Limit forgot = new Limit();

		private Limit reset = new Limit();

		private Limit register = new Limit();

		private Limit refresh = new Limit();

		@Getter
		@Setter
		public static class Limit {

			private int capacity = 5;

			private int refillPerMinute = 5;

		}

	}

}

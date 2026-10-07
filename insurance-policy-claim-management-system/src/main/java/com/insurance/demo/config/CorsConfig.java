package com.insurance.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

	private final AppSecurityProperties properties;

	// Strict whitelist: Only localhost and Vercel deployments
	private static final List<String> STRICT_DEFAULT_ORIGINS = List.of(
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
			"https://*.vercel.app",
			"https://insurance-policy-claim-capstone-project-4u9icow04.vercel.app",
			"https://insurance-policy-claim-capstone-pro.vercel.app"
	);

	public CorsConfig(AppSecurityProperties properties) {
		this.properties = properties;
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {

		CorsConfiguration configuration = new CorsConfiguration();

		List<String> allowedOrigins = new ArrayList<>(STRICT_DEFAULT_ORIGINS);

		String rawOrigins = properties.getCorsAllowedOrigin();
		if (rawOrigins != null && !rawOrigins.isBlank()) {
			Arrays.stream(rawOrigins.split(","))
					.map(String::trim)
					.filter(s -> !s.isEmpty() && !allowedOrigins.contains(s))
					.forEach(allowedOrigins::add);
		}

		configuration.setAllowedOriginPatterns(allowedOrigins);

		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));

		configuration.setAllowedHeaders(List.of("*"));

		configuration.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count", "Content-Disposition"));

		configuration.setAllowCredentials(true);

		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

		source.registerCorsConfiguration("/**", configuration);

		return source;
	}
}

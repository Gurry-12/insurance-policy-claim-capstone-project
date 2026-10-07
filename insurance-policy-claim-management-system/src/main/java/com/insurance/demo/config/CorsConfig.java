package com.insurance.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

	private final AppSecurityProperties properties;

	public CorsConfig(AppSecurityProperties properties) {
		this.properties = properties;
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {

		CorsConfiguration configuration = new CorsConfiguration();

		String rawOrigins = properties.getCorsAllowedOrigin();
		if (rawOrigins != null && !rawOrigins.isBlank()) {
			List<String> origins = Arrays.stream(rawOrigins.split(","))
					.map(String::trim)
					.filter(s -> !s.isEmpty())
					.toList();
			configuration.setAllowedOriginPatterns(origins);
		} else {
			configuration.setAllowedOriginPatterns(List.of("*"));
		}

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

package com.insurance.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

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
			configuration.setAllowedOrigins(List.of(rawOrigins.split("\\s*,\\s*")));
		} else {
			configuration.setAllowedOrigins(List.of("http://localhost:5173"));
		}

		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

		configuration.setAllowedHeaders(List.of("*"));

		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

		source.registerCorsConfiguration("/**", configuration);

		return source;
	}
}

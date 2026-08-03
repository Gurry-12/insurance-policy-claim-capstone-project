package com.insurance.demo.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import tools.jackson.databind.ObjectMapper;
import com.insurance.demo.security.JwtAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private final AppSecurityProperties properties;

	public SecurityConfig(AppSecurityProperties properties) {
		this.properties = properties;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationProvider authenticationProvider,
			JwtAuthenticationFilter jwtAuthenticationFilter, RateLimitFilter rateLimitFilter,
			CookieCsrfOriginFilter cookieCsrfOriginFilter,
			@Qualifier("handlerExceptionResolver") HandlerExceptionResolver handlerExceptionResolver) throws Exception {

		http.cors(cors -> {
		}).csrf(AbstractHttpConfigurer::disable)

				.headers(headers -> headers
						// API responses are JSON-only, so lock the surface down.
						.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
						.referrerPolicy(referrer -> referrer
								.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
						.frameOptions(frame -> frame.deny())
						.httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000)))

				.authenticationProvider(authenticationProvider)

				.exceptionHandling(exceptionHandling -> exceptionHandling
						.authenticationEntryPoint((request, response, authException) -> handlerExceptionResolver
								.resolveException(request, response, null, authException))
						.accessDeniedHandler((request, response, accessDeniedException) -> handlerExceptionResolver
								.resolveException(request, response, null, accessDeniedException)))

				.authorizeHttpRequests(auth -> {

						// IMPORTANT FOR CORS
						auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

						// PUBLIC
						if (properties.isSwaggerEnabled()) {
							auth.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll();
						}

						auth.requestMatchers("/api/auth/**").permitAll()
								.requestMatchers("/api/public/**").permitAll()

						// PLANS
						.requestMatchers(HttpMethod.POST, "/api/plans/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/plans/*").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PATCH, "/api/plans/*/deactivate").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PATCH, "/api/plans/*/activate").hasRole("ADMIN")
						.requestMatchers(HttpMethod.GET, "/api/plans/active").hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/plans/*/active").hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/plans/page").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/plans/*").hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/plans/**").hasAnyRole("ADMIN", "INTERNAL_STAFF")

						// POLICIES
						.requestMatchers(HttpMethod.POST, "/api/policies/purchase").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.POST, "/api/policies/issue").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/policies/my-policies").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/policies/customer/*").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/policies/*").hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/policies").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.PATCH, "/api/policies/*/cancel").hasAnyRole("ADMIN", "INTERNAL_STAFF")

						// CLAIMS
						.requestMatchers(HttpMethod.POST, "/api/claims/raise").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/claims/my-claims").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/claims/*").hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")
						.requestMatchers(HttpMethod.PATCH, "/api/claims/*/review").hasRole("INTERNAL_STAFF")
						.requestMatchers(HttpMethod.PATCH, "/api/claims/*/under-review").hasRole("INTERNAL_STAFF")
						.requestMatchers(HttpMethod.PATCH, "/api/claims/*/assign").hasRole("INTERNAL_STAFF")
						.requestMatchers(HttpMethod.PATCH, "/api/claims/*/final-decision").hasRole("ADMIN")
						// DOCUMENTS
						.requestMatchers(HttpMethod.POST, "/api/document/upload/**").hasRole("CUSTOMER")

						// CUSTOMERS
						.requestMatchers(HttpMethod.POST, "/api/customers/**").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.PUT, "/api/customers/**").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/customers/profile").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/customers").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/customers/page").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/customers/*").hasAnyRole("ADMIN", "INTERNAL_STAFF")

						// PRODUCTS
						.requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.PATCH, "/api/products/**").hasRole("ADMIN")
						.requestMatchers(HttpMethod.GET, "/api/products/active")
						.hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/products/page")
						.hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/products/*")
						.hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")

						// PAYMENTS
						.requestMatchers(HttpMethod.POST, "/api/payments").hasAnyRole("CUSTOMER", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/payments/my-payments").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/payments/my-policies/*").hasRole("CUSTOMER")
						.requestMatchers(HttpMethod.GET, "/api/payments/policy/*").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/payments/page").hasAnyRole("ADMIN", "INTERNAL_STAFF")
						.requestMatchers(HttpMethod.GET, "/api/payments/*").hasAnyRole("ADMIN", "INTERNAL_STAFF", "CUSTOMER")

						// ADMIN ENDPOINTS (Pricing Rules, Coverage Options, etc.)
						.requestMatchers("/api/admin/**").hasRole("ADMIN")

						.anyRequest().authenticated();
					})

				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class)
				.addFilterBefore(cookieCsrfOriginFilter, JwtAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	RateLimitFilter rateLimitFilter(AppSecurityProperties properties, ObjectMapper objectMapper,
			SecurityAuditLogger auditLogger) {
		return new RateLimitFilter(properties, objectMapper, auditLogger);
	}

	@Bean
	CookieCsrfOriginFilter cookieCsrfOriginFilter(AppSecurityProperties properties, ObjectMapper objectMapper,
			SecurityAuditLogger auditLogger) {
		return new CookieCsrfOriginFilter(properties, objectMapper, auditLogger);
	}

	/**
	 * Prevents Spring Boot from auto-registering the CSRF-origin filter with the
	 * servlet container. It is wired into the security filter chain only, so its
	 * ordering is controlled by {@link SecurityConfig}.
	 */
	@Bean
	FilterRegistrationBean<CookieCsrfOriginFilter> cookieCsrfOriginFilterRegistration(
			CookieCsrfOriginFilter cookieCsrfOriginFilter) {
		FilterRegistrationBean<CookieCsrfOriginFilter> registration = new FilterRegistrationBean<>(
				cookieCsrfOriginFilter);
		registration.setEnabled(false);
		return registration;
	}

	/**
	 * Prevents Spring Boot from auto-registering the rate-limit filter with the
	 * servlet container. It is wired into the security filter chain only, so its
	 * ordering is controlled by {@link SecurityConfig}.
	 */
	@Bean
	FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter rateLimitFilter) {
		FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(rateLimitFilter);
		registration.setEnabled(false);
		return registration;
	}

	@Bean
	AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
			PasswordEncoder passwordEncoder) {

		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService);

		authenticationProvider.setPasswordEncoder(passwordEncoder);

		return authenticationProvider;
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
			throws Exception {
		return authenticationConfiguration.getAuthenticationManager();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}

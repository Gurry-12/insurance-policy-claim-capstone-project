package com.insurance.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import tools.jackson.databind.ObjectMapper;
import com.insurance.demo.config.RefreshTokenCookieManager;
import com.insurance.demo.enums.Role;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Customer;
import com.insurance.demo.model.OtpVerification;
import com.insurance.demo.model.RefreshToken;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.OtpVerificationRepository;
import com.insurance.demo.repository.RefreshTokenRepository;
import com.insurance.demo.security.AppUserDetails;
import com.insurance.demo.service.UserService;
import com.insurance.demo.util.MessageConstants;

import jakarta.servlet.http.Cookie;

/**
 * Integration tests for the refresh-token flow: HttpOnly cookie
 * issuance, opaque token hashing, and revocation on logout, password reset and deactivation.
 *
 * <p>Runs against the real MySQL datasource configured in
 * {@code env.properties}, consistent with {@link JwtSecurityIntegrationTest}.
 */
@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenIntegrationTest {

	private static final String DEFAULT_PASSWORD = "Password123";

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private UserService userService;

	@Autowired
	private AppUserRepository userRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private OtpVerificationRepository otpRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	private MockMvc mockMvc;

	private final List<AppUser> createdUsers = new ArrayList<>();

	private final List<OtpVerification> createdOtps = new ArrayList<>();

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
		otpRepository.deleteAll(createdOtps);
		for (AppUser user : createdUsers) {
			refreshTokenRepository.deleteAllByUserId(user.getId());
		}
		userRepository.deleteAll(createdUsers);
		createdOtps.clear();
		createdUsers.clear();
	}

	// ------------------------------------------------------------------
	// Cookie issuance
	// ------------------------------------------------------------------

	@Test
	void loginSetsHttpOnlyRefreshCookieAndOmitsTokenFromBody() throws Exception {
		AppUser customer = createActiveCustomer();

		MvcResult result = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
						Map.of("email", customer.getEmail(), "password", DEFAULT_PASSWORD))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.token").exists())
				.andExpect(jsonPath("$.data.refreshToken").doesNotExist())
				.andExpect(cookie().httpOnly(RefreshTokenCookieManager.COOKIE_NAME, true))
				.andReturn();

		Cookie refreshCookie = result.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME);
		assertNotNull(refreshCookie);
		assertTrue(refreshCookie.isHttpOnly());
		assertEquals("/api/auth", refreshCookie.getPath());
		assertEquals("Lax", refreshCookie.getAttribute("SameSite"));
		assertTrue(refreshCookie.getValue().length() >= 43, "opaque token should be ~32 bytes Base64url");
		assertNotEquals(customer.getEmail(), refreshCookie.getValue(), "cookie must not contain the raw token as-is");
	}

	@Test
	void cookieIsNotSecureOutsideProduction() throws Exception {
		AppUser customer = createActiveCustomer();
		MvcResult result = login(customer.getEmail(), DEFAULT_PASSWORD);
		assertEquals(false, result.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME).getSecure());
	}

	// ------------------------------------------------------------------
	// Refresh
	// ------------------------------------------------------------------

	@Test
	void refreshIssuesNewAccessToken() throws Exception {
		AppUser customer = createActiveCustomer();
		MvcResult loginResult = login(customer.getEmail(), DEFAULT_PASSWORD);
		String cookieA = loginResult.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME).getValue();

		MvcResult refreshResult = mockMvc
				.perform(post("/api/auth/refresh")
						.cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, cookieA)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.accessToken").exists())
				.andExpect(jsonPath("$.data.refreshToken").doesNotExist())
				.andReturn();

		String accessToken = objectMapper.readTree(refreshResult.getResponse().getContentAsString()).path("data")
				.path("accessToken").asText();

		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
				.andExpect(status().isOk());

		// A further refresh also works (the token remains active).
		mockMvc.perform(post("/api/auth/refresh")
				.cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, cookieA)))
				.andExpect(status().isOk());
	}

	@Test
	void refreshingWithoutCookieIsRejected() throws Exception {
		mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.errorType").value("INVALID_REFRESH_TOKEN"))
				.andExpect(jsonPath("$.message").value(MessageConstants.Auth.SESSION_EXPIRED));
	}

	@Test
	void expiredRefreshTokenIsRejected() throws Exception {
		AppUser customer = createActiveCustomer();
		String rawToken = "expired-" + UUID.randomUUID();
		seedExpiredToken(customer, rawToken);

		mockMvc.perform(post("/api/auth/refresh").cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, rawToken)))
				.andExpect(status().isUnauthorized());
	}

	// ------------------------------------------------------------------
	// Revocation on lifecycle events
	// ------------------------------------------------------------------

	@Test
	void passwordResetRevokesRefreshToken() throws Exception {
		AppUser customer = createActiveCustomer();
		MvcResult loginResult = login(customer.getEmail(), DEFAULT_PASSWORD);
		String cookie = loginResult.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME).getValue();

		seedOtp(customer, "111111", "222222");
		mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("email", customer.getEmail(), "emailOtp", "111111",
						"phoneOtp", "222222", "newPassword", "NewPassword456"))))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/auth/refresh")
				.cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, cookie)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void deactivationRevokesRefreshToken() throws Exception {
		AppUser customer = createActiveCustomer();
		AppUser admin = createAdmin();
		MvcResult loginResult = login(customer.getEmail(), DEFAULT_PASSWORD);
		String cookie = loginResult.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME).getValue();

		setAuth(admin);
		userService.deactivateUser(customer.getId());

		mockMvc.perform(post("/api/auth/refresh")
				.cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, cookie)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void logoutRevokesRefreshTokenAndClearsCookie() throws Exception {
		AppUser customer = createActiveCustomer();
		MvcResult loginResult = login(customer.getEmail(), DEFAULT_PASSWORD);
		String cookie = loginResult.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME).getValue();

		MvcResult logoutResult = mockMvc
				.perform(post("/api/auth/logout")
						.cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, cookie)))
				.andExpect(status().isOk()).andReturn();

		Cookie cleared = logoutResult.getResponse().getCookie(RefreshTokenCookieManager.COOKIE_NAME);
		assertNotNull(cleared);
		assertEquals(0, cleared.getMaxAge(), "cookie must be expired on logout");

		mockMvc.perform(post("/api/auth/refresh")
				.cookie(withCookie(RefreshTokenCookieManager.COOKIE_NAME, cookie)))
				.andExpect(status().isUnauthorized());
	}

	// ------------------------------------------------------------------
	// Helpers
	// ------------------------------------------------------------------

	private MvcResult login(String email, String password) throws Exception {
		return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
				.andExpect(status().isOk()).andReturn();
	}

	private AppUser createActiveCustomer() {
		AppUser user = createUser(uniqueEmail("customer"), Role.ROLE_CUSTOMER);
		Customer customer = new Customer();
		customer.setUser(user);
		customerRepository.save(customer);
		return user;
	}

	private AppUser createAdmin() {
		return createUser(uniqueEmail("admin"), Role.ROLE_ADMIN);
	}

	private AppUser createUser(String email, Role role) {
		AppUser user = new AppUser();
		user.setFullName("Refresh Token Test User");
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
		user.setMobileNumber("+91" + java.util.concurrent.ThreadLocalRandom.current().nextLong(1000000000L, 9999999999L));
		user.setRole(role);
		user.setIsActive(true);
		user.setEmailVerified(true);
		user.setPhoneVerified(true);
		user.setTokenVersion(0L);
		AppUser saved = userRepository.save(user);
		createdUsers.add(saved);
		return saved;
	}

	private void seedExpiredToken(AppUser user, String rawToken) {
		RefreshToken token = RefreshToken.builder().user(user).tokenHash(sha256Hex(rawToken))
				.expiresAt(LocalDateTime.now().minusMinutes(1)).revoked(false)
				.tokenVersion(0L).build();
		refreshTokenRepository.save(token);
	}

	private void seedOtp(AppUser user, String emailOtp, String phoneOtp) {
		OtpVerification otp = OtpVerification.builder().user(user).emailOtp(emailOtp).phoneOtp(phoneOtp)
				.expiresAt(LocalDateTime.now().plusMinutes(10)).used(false).attemptCount(0).sendCount(1).build();
		OtpVerification saved = otpRepository.save(otp);
		createdOtps.add(saved);
	}

	private void setAuth(AppUser user) {
		AppUserDetails details = new AppUserDetails(user);
		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(details, null,
				details.getAuthorities());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	private Cookie withCookie(String name, String value) {
		return new Cookie(name, value);
	}

	private static String sha256Hex(String raw) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception ex) {
			throw new IllegalStateException(ex);
		}
	}

	private String uniqueEmail(String prefix) {
		return prefix + "-" + UUID.randomUUID() + "@example.com";
	}
}

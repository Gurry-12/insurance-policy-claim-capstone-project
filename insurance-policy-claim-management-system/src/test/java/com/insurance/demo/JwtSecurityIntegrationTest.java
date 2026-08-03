package com.insurance.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.insurance.demo.enums.PolicyStatus;
import com.insurance.demo.enums.PremiumType;
import com.insurance.demo.enums.ProductType;
import com.insurance.demo.enums.Role;
import com.insurance.demo.model.AppUser;
import com.insurance.demo.model.Customer;
import com.insurance.demo.model.InsuranceProduct;
import com.insurance.demo.model.OtpVerification;
import com.insurance.demo.model.Policy;
import com.insurance.demo.model.PolicyPlan;
import com.insurance.demo.model.StaffSpeciality;
import com.insurance.demo.repository.AppUserRepository;
import com.insurance.demo.repository.CustomerRepository;
import com.insurance.demo.repository.InsuranceProductRepository;
import com.insurance.demo.repository.OtpVerificationRepository;
import com.insurance.demo.repository.PolicyPlanRepository;
import com.insurance.demo.repository.PolicyRepository;
import com.insurance.demo.repository.RefreshTokenRepository;
import com.insurance.demo.repository.StaffSpecialityRepository;
import com.insurance.demo.security.AppUserDetails;
import com.insurance.demo.service.ClaimService;
import com.insurance.demo.service.UserService;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * End-to-end integration tests for the Stage 1 authentication hardening:
 * JWT validation/expiry/tampering, token revocation (deactivation, password
 * reset, reactivation), rate limiting, OTP hardening, weak passwords and
 * account-enumeration behaviour.
 *
 * <p>Runs against the real MySQL datasource configured in
 * {@code env.properties}, consistent with {@link DemoApplicationTests}.
 */
@SpringBootTest
@ActiveProfiles("test")
class JwtSecurityIntegrationTest {

	private static final String DEFAULT_PASSWORD = "Password123";
	private static final String ISSUER = "insurance-policy-claim-management-system";
	private static final String INVALID_CREDENTIALS = "Invalid credentials or account unavailable.";

	@Autowired
	private WebApplicationContext context;

	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private UserService userService;

	@Autowired
	private ClaimService claimService;

	@Autowired
	private AppUserRepository userRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private OtpVerificationRepository otpRepository;

	@Autowired
	private InsuranceProductRepository productRepository;

	@Autowired
	private PolicyPlanRepository planRepository;

	@Autowired
	private PolicyRepository policyRepository;

	@Autowired
	private StaffSpecialityRepository staffSpecialityRepository;

	@Autowired
	private RefreshTokenRepository refreshTokenRepository;

	@Value("${app.security.jwt.secret}")
	private String jwtSecret;

	private final List<AppUser> createdUsers = new ArrayList<>();
	private final List<OtpVerification> createdOtps = new ArrayList<>();
	private final List<Policy> createdPolicies = new ArrayList<>();
	private final List<PolicyPlan> createdPlans = new ArrayList<>();
	private final List<InsuranceProduct> createdProducts = new ArrayList<>();
	private final Map<Long, Customer> customerByUserId = new HashMap<>();

	@BeforeEach
	void setUp() {
		// Full application context so all beans (JPA, Jackson, security) are
		// present. The springSecurity() configurer wires the real FilterChainProxy
		// (JwtAuthenticationFilter, RateLimitFilter, etc.) into the MockMvc chain.
		mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
		otpRepository.deleteAll(createdOtps);
		policyRepository.deleteAll(createdPolicies);
		planRepository.deleteAll(createdPlans);
		productRepository.deleteAll(createdProducts);
		for (AppUser user : createdUsers) {
			refreshTokenRepository.deleteAllByUserId(user.getId());
		}
		userRepository.deleteAll(createdUsers);
		createdOtps.clear();
		createdPolicies.clear();
		createdPlans.clear();
		createdProducts.clear();
		createdUsers.clear();
		customerByUserId.clear();
	}

	// ------------------------------------------------------------------
	// JWT token scenarios
	// ------------------------------------------------------------------

	@Test
	void unauthenticatedRequestIsRejected() throws Exception {
		mockMvc.perform(get("/api/customers/profile"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void validTokenAccessesProtectedEndpoint() throws Exception {
		AppUser customer = createActiveCustomer();
		String token = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);

		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk());
	}

	@Test
	void expiredTokenIsRejected() throws Exception {
		AppUser customer = createActiveCustomer();
		String expired = expiredToken(customer.getEmail());

		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + expired))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void tamperedTokenIsRejected() throws Exception {
		AppUser customer = createActiveCustomer();
		String token = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);
		String tampered = tamper(token);

		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void customerCannotAccessAdminEndpoint() throws Exception {
		AppUser customer = createActiveCustomer();
		String token = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);

		mockMvc.perform(get("/api/customers").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isForbidden());
	}

	// ------------------------------------------------------------------
	// Revocation
	// ------------------------------------------------------------------

	@Test
	void deactivationInvalidatesExistingTokens() throws Exception {
		AppUser customer = createActiveCustomer();
		AppUser admin = createAdmin();
		String token = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);

		// Token works before deactivation.
		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk());

		setAuth(admin);
		userService.deactivateUser(customer.getId());

		// The previously issued token must be rejected.
		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void reactivationDoesNotRestoreOldTokens() throws Exception {
		AppUser customer = createActiveCustomer();
		AppUser admin = createAdmin();
		String tokenBeforeDeactivation = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);

		setAuth(admin);
		userService.deactivateUser(customer.getId());
		mockMvc.perform(get("/api/customers/profile")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenBeforeDeactivation))
				.andExpect(status().isUnauthorized());

		// The HTTP request above cleared SecurityContextHolder, so re-authenticate
		// as admin before invoking the service directly.
		setAuth(admin);
		userService.activateUser(customer.getId());

		// Old token stays invalid even after reactivation - user must re-login.
		mockMvc.perform(get("/api/customers/profile")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenBeforeDeactivation))
				.andExpect(status().isUnauthorized());

		String freshToken = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);
		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + freshToken))
				.andExpect(status().isOk());
	}

	@Test
	void passwordResetInvalidatesExistingTokens() throws Exception {
		AppUser customer = createActiveCustomer();
		String oldToken = loginAndGetToken(customer.getEmail(), DEFAULT_PASSWORD);

		seedOtp(customer, "111111", "222222");
		String newPassword = "NewPassword456";
		mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
						Map.of("email", customer.getEmail(), "emailOtp", "111111", "phoneOtp", "222222",
								"newPassword", newPassword))))
				.andExpect(status().isOk());

		// Old token issued before the password reset is revoked.
		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + oldToken))
				.andExpect(status().isUnauthorized());

		// Fresh login works with the new password.
		String newToken = loginAndGetToken(customer.getEmail(), newPassword);
		mockMvc.perform(get("/api/customers/profile").header(HttpHeaders.AUTHORIZATION, "Bearer " + newToken))
				.andExpect(status().isOk());
	}

	// ------------------------------------------------------------------
	// Rate limiting
	// ------------------------------------------------------------------

	@Test
	void loginRateLimitReturns429() throws Exception {
		String email = uniqueEmail("ratelimit");
		String ip = "198.51.100.7";

		for (int i = 0; i < 5; i++) {
			mockMvc.perform(post("/api/auth/login").header("X-Forwarded-For", ip)
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(Map.of("email", email, "password", "WrongPass1"))))
					.andExpect(status().isUnauthorized());
		}

		ResultActions sixth = mockMvc.perform(post("/api/auth/login").header("X-Forwarded-For", ip)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("email", email, "password", "WrongPass1"))));

		sixth.andExpect(status().isTooManyRequests())
				.andExpect(result -> assertNotNull(result.getResponse().getHeader("Retry-After")))
				.andExpect(jsonPath("$.errorType").value("RATE_LIMITED"));
	}

	// ------------------------------------------------------------------
	// OTP hardening
	// ------------------------------------------------------------------

	@Test
	void otpCannotBeReusedAfterSuccessfulVerification() throws Exception {
		AppUser inactive = createInactiveCustomer();
		seedOtp(inactive, "333333", "444444");

		mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
						Map.of("email", inactive.getEmail(), "emailOtp", "333333", "phoneOtp", "444444"))))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
						Map.of("email", inactive.getEmail(), "emailOtp", "333333", "phoneOtp", "444444"))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("No active OTP found. Please request a new OTP."));
	}

	@Test
	void otpAttemptsAreExhaustedInternallyWithoutRevealingCount() throws Exception {
		AppUser inactive = createInactiveCustomer();
		OtpVerification otp = seedOtp(inactive, "555555", "666666");

		for (int i = 0; i < 5; i++) {
			mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(
							Map.of("email", inactive.getEmail(), "emailOtp", "999999", "phoneOtp", "666666"))))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("Invalid email OTP."));
		}

		OtpVerification reloaded = otpRepository.findById(otp.getId()).orElseThrow();
		assertTrue(reloaded.isUsed());
		assertEquals(5, reloaded.getAttemptCount());

		// Even a correct OTP is rejected once the attempt budget is exhausted.
		mockMvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(
						Map.of("email", inactive.getEmail(), "emailOtp", "555555", "phoneOtp", "666666"))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("No active OTP found. Please request a new OTP."));
	}

	// ------------------------------------------------------------------
	// Password policy
	// ------------------------------------------------------------------

	@Test
	void weakPasswordRejectedOnRegistration() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("fullName", "Weak Pass User",
						"email", uniqueEmail("weakpass"), "mobileNumber", "+919999888877",
						"password", "short1"))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errorType").value("VALIDATION_FAILED"));
	}

	// ------------------------------------------------------------------
	// Account enumeration
	// ------------------------------------------------------------------

	@Test
	void loginFailureIsGenericForUnknownEmailAndWrongPassword() throws Exception {
		String unknownEmail = uniqueEmail("ghost");

		MvcResult unknown = mockMvc
				.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								Map.of("email", unknownEmail, "password", "WrongPass1"))))
				.andExpect(status().isUnauthorized())
				.andReturn();

		AppUser customer = createActiveCustomer();
		MvcResult wrongPassword = mockMvc
				.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								Map.of("email", customer.getEmail(), "password", "WrongPass1"))))
				.andExpect(status().isUnauthorized())
				.andReturn();

		String unknownMessage = objectMapper.readTree(unknown.getResponse().getContentAsString()).path("message")
				.asText();
		String wrongPasswordMessage = objectMapper.readTree(wrongPassword.getResponse().getContentAsString())
				.path("message").asText();

		assertEquals(INVALID_CREDENTIALS, unknownMessage);
		assertEquals(INVALID_CREDENTIALS, wrongPasswordMessage);
		assertEquals(unknownMessage, wrongPasswordMessage);
	}

	// ------------------------------------------------------------------
	// IDOR / authorization scope (service level - endpoint not exposed over HTTP)
	// ------------------------------------------------------------------

	@Test
	void customerCannotViewAnotherCustomersPolicyClaims() {
		AppUser customerA = createActiveCustomer();
		AppUser customerB = createActiveCustomer();
		PolicyPlan healthPlan = seedPlan(seedProduct("health", ProductType.HEALTH));
		Policy policyA = seedPolicy(customerA, healthPlan);
		Policy policyB = seedPolicy(customerB, healthPlan);

		setAuth(customerA);
		// Owner can view their own policy claims.
		assertNotNull(claimService.getClaimsByPolicyId(policyA.getId()).getData());
		// Cross-customer access must be denied.
		assertThrows(AccessDeniedException.class, () -> claimService.getClaimsByPolicyId(policyB.getId()));
	}

	@Test
	void staffCannotViewClaimsOutsideTheirSpeciality() {
		AppUser customer = createActiveCustomer();
		PolicyPlan healthPlan = seedPlan(seedProduct("health", ProductType.HEALTH));
		Policy policy = seedPolicy(customer, healthPlan);

		AppUser motorStaff = seedStaff(ProductType.MOTOR);
		setAuth(motorStaff);
		assertThrows(AccessDeniedException.class, () -> claimService.getClaimsByPolicyId(policy.getId()));

		AppUser healthStaff = seedStaff(ProductType.HEALTH);
		setAuth(healthStaff);
		assertNotNull(claimService.getClaimsByPolicyId(policy.getId()).getData());
	}

	// ------------------------------------------------------------------
	// Helpers
	// ------------------------------------------------------------------

	private AppUser createActiveCustomer() {
		AppUser user = createUser(uniqueEmail("customer"), Role.ROLE_CUSTOMER, true, true);
		Customer customer = new Customer();
		customer.setUser(user);
		customerRepository.save(customer);
		customerByUserId.put(user.getId(), customer);
		return user;
	}

	private AppUser createInactiveCustomer() {
		return createUser(uniqueEmail("inactive"), Role.ROLE_CUSTOMER, false, false);
	}

	private AppUser createAdmin() {
		return createUser(uniqueEmail("admin"), Role.ROLE_ADMIN, true, true);
	}

	private AppUser seedStaff(ProductType speciality) {
		AppUser staff = createUser(uniqueEmail("staff"), Role.ROLE_INTERNAL_STAFF, true, true);
		StaffSpeciality staffSpeciality = new StaffSpeciality();
		staffSpeciality.setStaff(staff);
		staffSpeciality.setProductSpeciality(speciality);
		staffSpecialityRepository.save(staffSpeciality);
		return staff;
	}

	private AppUser createUser(String email, Role role, boolean active, boolean verified) {
		AppUser user = new AppUser();
		user.setFullName("Integration Test User");
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
		user.setMobileNumber("+91" + ThreadLocalRandom.current().nextLong(1000000000L, 9999999999L));
		user.setRole(role);
		user.setIsActive(active);
		user.setEmailVerified(verified);
		user.setPhoneVerified(verified);
		user.setTokenVersion(0L);
		AppUser saved = userRepository.save(user);
		createdUsers.add(saved);
		return saved;
	}

	private OtpVerification seedOtp(AppUser user, String emailOtp, String phoneOtp) {
		OtpVerification otp = OtpVerification.builder().user(user).emailOtp(emailOtp).phoneOtp(phoneOtp)
				.expiresAt(LocalDateTime.now().plusMinutes(10)).used(false).attemptCount(0).sendCount(1).build();
		OtpVerification saved = otpRepository.save(otp);
		createdOtps.add(saved);
		return saved;
	}

	private InsuranceProduct seedProduct(String name, ProductType type) {
		InsuranceProduct product = new InsuranceProduct();
		product.setProductName(name + "-" + UUID.randomUUID());
		product.setProductType(type);
		product.setDescription("integration test product");
		product.setIsActive(true);
		InsuranceProduct saved = productRepository.save(product);
		createdProducts.add(saved);
		return saved;
	}

	private PolicyPlan seedPlan(InsuranceProduct product) {
		PolicyPlan plan = new PolicyPlan();
		plan.setInsuranceProduct(product);
		plan.setPlanName("plan-" + UUID.randomUUID());
		plan.setPlanVersion(1);
		plan.setSupportedPremiumType(PremiumType.ANNUAL);
		plan.setTermsAndConditions("integration test terms");
		plan.setIsActive(true);
		PolicyPlan saved = planRepository.save(plan);
		createdPlans.add(saved);
		return saved;
	}

	private Policy seedPolicy(AppUser customerUser, PolicyPlan plan) {
		Policy policy = new Policy();
		policy.setPolicyNumber("POL-" + UUID.randomUUID());
		policy.setCustomer(customerByUserId.get(customerUser.getId()));
		policy.setPolicyPlan(plan);
		policy.setSelectedCoverage(new BigDecimal("500000"));
		policy.setPremiumType(PremiumType.ANNUAL);
		policy.setPolicyDuration(1);
		policy.setPremiumRateUsed(new BigDecimal("0.02"));
		policy.setProcessingFeeUsed(new BigDecimal("100"));
		policy.setGstUsed(new BigDecimal("18"));
		policy.setCalculatedPremium(new BigDecimal("12000"));
		policy.setPlanVersion(1);
		policy.setPricingRuleId(1L);
		policy.setStartDate(LocalDate.now().minusMonths(1));
		policy.setEndDate(LocalDate.now().plusMonths(11));
		policy.setPolicyStatus(PolicyStatus.ACTIVE);
		policy.setTotalPremiumPaid(BigDecimal.ZERO);
		Policy saved = policyRepository.save(policy);
		createdPolicies.add(saved);
		return saved;
	}

	private void setAuth(AppUser user) {
		AppUserDetails details = new AppUserDetails(user);
		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(details, null,
				details.getAuthorities());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	private String loginAndGetToken(String email, String password) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
		return node.path("data").path("token").asText();
	}

	private String expiredToken(String subject) {
		SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
		return Jwts.builder().id(UUID.randomUUID().toString()).subject(subject).issuer(ISSUER)
				.issuedAt(new java.util.Date(System.currentTimeMillis() - Duration.ofMinutes(5).toMillis()))
				.expiration(new java.util.Date(System.currentTimeMillis() - Duration.ofMinutes(1).toMillis()))
				.signWith(key).compact();
	}

	private String tamper(String token) {
		// Corrupt the first character of the signature segment. The final
		// base64url character of an HS256 signature holds only padding bits, so
		// altering it can leave the decoded signature unchanged; the first
		// character always carries data bits, guaranteeing the signature differs.
		int lastDot = token.lastIndexOf('.');
		String signature = token.substring(lastDot + 1);
		char original = signature.charAt(0);
		char replacement = original == 'a' ? 'b' : 'a';
		return token.substring(0, lastDot + 1) + replacement + signature.substring(1);
	}

	private String uniqueEmail(String prefix) {
		return prefix + "-" + UUID.randomUUID() + "@example.com";
	}
}

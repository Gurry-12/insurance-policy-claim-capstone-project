# Testing Guide

## Purpose

This document explains the recommended testing strategy for the Insurance Policy Claim Management System, how to write tests, and how to run them.

---

## Testing Stack

The project includes standard Spring Boot testing dependencies:
- `spring-boot-starter-test` (JUnit 5, Mockito, Spring TestContext, AssertJ)
- `spring-boot-starter-security-test` (MockMvc Security)
- `spring-boot-starter-data-jpa-test` (H2 embedded DB testing)

---

## Test Categories

### 1. Unit Tests (Services)

Service layer tests should be pure unit tests using Mockito. They should not load the Spring context.

**Focus:** Business logic, validation rules, state transitions, security rule enforcement.

**Pattern:**
```java
@ExtendWith(MockitoExtension.class)
class ClaimServiceImplTest {

    @Mock
    private ClaimRepository claimRepository;
    
    @Mock
    private PolicyRepository policyRepository;

    @InjectMocks
    private ClaimServiceImpl claimService;

    @Test
    void raiseClaim_shouldThrowException_whenAmountExceedsCoverage() {
        // Arrange: Mock repositories and authentication context
        // Act: Call service
        // Assert: Verify exception thrown
    }
}
```

### 2. Integration Tests (Controllers)

Controller tests should verify DTO validation, security (JWT filter bypassing or mocking), and HTTP status codes using `MockMvc`.

**Pattern:**
```java
@WebMvcTest(ClaimController.class)
@AutoConfigureMockMvc(addFilters = false) // Optional: disable JWT filter for pure controller test
class ClaimControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClaimService claimService;

    @Test
    @WithMockUser(roles = "CUSTOMER") // Spring Security mock user
    void raiseClaim_shouldReturn201() throws Exception {
        // Arrange: Mock service response
        // Act: mockMvc.perform(post("/api/claims/raise")...)
        // Assert: status().isCreated()
    }
}
```

### 3. Repository Tests

Repository tests verify custom JPQL queries and Specifications. They use an embedded database (like H2).

**Pattern:**
```java
@DataJpaTest
class ClaimRepositoryTest {

    @Autowired
    private ClaimRepository claimRepository;
    
    @Test
    void sumActiveClaimsByPolicyId_shouldExcludeRejectedClaims() {
        // Arrange: save entities to DB
        // Act: execute query
        // Assert: verify correct sum
    }
}
```

---

## Mocking the SecurityContext

Many services extract the current user from the `SecurityContext`. To test these methods, you must mock the context:

```java
private void setupSecurityContext(String email, String role, String speciality) {
    Authentication authentication = mock(Authentication.class);
    when(authentication.getName()).thenReturn(email);
    
    SecurityContext securityContext = mock(SecurityContext.class);
    when(securityContext.getAuthentication()).thenReturn(authentication);
    SecurityContextHolder.setContext(securityContext);
}
```

---

## Mocking External Services

External services (Email, SMS, Cloudinary) must ALWAYS be mocked to avoid sending real emails or uploading files during automated tests.

```java
@MockBean
private EmailService emailService;

@MockBean
private SmsService smsService;

@MockBean
private CloudinaryService cloudinaryService;
```

---

## Running Tests

Run all tests via Maven:

```bash
mvn test
```

Run a specific test class:
```bash
mvn test -Dtest=ClaimServiceImplTest
```

---

## Test Data Builders

To avoid massive entity instantiation code in every test, it's recommended to create test data builders or factory methods:

```java
public class TestDataBuilder {
    public static Policy createTestPolicy() {
        Policy policy = new Policy();
        // fill default required fields
        return policy;
    }
}
```

---

## Code Coverage

While there is no strict coverage requirement enforced currently, aim for:
- 100% coverage on complex business methods (e.g., `PremiumPaymentServiceImpl.recordPayment`, `ClaimServiceImpl.raiseClaim`)
- High coverage on custom JPQL queries
- Verification of exception scenarios (testing the unhappy path)

# 📐 Class Diagrams & Software Design Patterns

[⬅️ Back to Diagrams Hub](./README.md)

---

## 🏛️ 1. Master Domain Model Class Diagram (JPA Entities & Enums)

```mermaid
classDiagram
    class Role {
        <<enumeration>>
        ROLE_ADMIN
        ROLE_INTERNAL_STAFF
        ROLE_CUSTOMER
    }

    class ProductType {
        <<enumeration>>
        HEALTH
        MOTOR
        LIFE
        TRAVEL
        INSURANCE
    }

    class PolicyStatus {
        <<enumeration>>
        PENDING_PAYMENT
        ACTIVE
        EXPIRED
        CANCELLED
    }

    class ClaimStatus {
        <<enumeration>>
        SUBMITTED
        UNDER_REVIEW
        RECOMMENDED_FOR_APPROVAL
        RECOMMENDED_FOR_REJECTION
        APPROVED
        REJECTED
    }

    class PremiumType {
        <<enumeration>>
        ONE_TIME
        ANNUAL
    }

    class PaymentMode {
        <<enumeration>>
        UPI
        CARD
        NET_BANKING
        CASH
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        SUCCESS
        FAILED
    }

    class QuoteStatus {
        <<enumeration>>
        CREATED
        USED
        EXPIRED
        CANCELLED
    }

    class PricingRuleStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class AppUser {
        -Long id
        -String fullName
        -String email
        -String mobileNumber
        -String password
        -Role role
        -Boolean isActive
        -Boolean emailVerified
        -Boolean phoneVerified
        -Long tokenVersion
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
    }

    class Customer {
        -Long id
        -LocalDate dateOfBirth
        -String address
        -String city
        -String state
        -String pinCode
        -String nomineeName
        -String nomineeRelation
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
    }

    class StaffSpeciality {
        -Long id
        -ProductType productSpeciality
    }

    class InsuranceProduct {
        -Long id
        -String productName
        -ProductType productType
        -String description
        -Boolean isActive
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
    }

    class PolicyPlan {
        -Long id
        -String planName
        -Integer planVersion
        -PremiumType supportedPremiumType
        -Set~Integer~ allowedDurations
        -String termsAndConditions
        -Boolean isActive
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
    }

    class CoverageOption {
        -Long id
        -BigDecimal coverageAmount
        -String label
        -Integer displayOrder
        -Boolean isActive
    }

    class PricingRule {
        -Long id
        -BigDecimal baseRiskRate
        -BigDecimal processingFee
        -BigDecimal gst
        -String remarks
        -LocalDateTime effectiveFrom
        -LocalDateTime effectiveTo
        -PricingRuleStatus status
        -LocalDateTime createdDate
    }

    class Quote {
        -Long id
        -BigDecimal coverage
        -Integer duration
        -PremiumType premiumType
        -BigDecimal riskRate
        -BigDecimal processingFee
        -BigDecimal gst
        -BigDecimal premium
        -BigDecimal total
        -Integer planVersion
        -Long pricingRuleId
        -QuoteStatus status
        -LocalDateTime createdAt
        -LocalDateTime expiresAt
    }

    class Policy {
        -Long id
        -String policyNumber
        -LocalDate startDate
        -LocalDate endDate
        -PolicyStatus policyStatus
        -BigDecimal totalPremiumPaid
        -BigDecimal selectedCoverage
        -BigDecimal calculatedPremium
        -PremiumType premiumType
        -Integer policyDuration
        -BigDecimal premiumRateUsed
        -BigDecimal processingFeeUsed
        -BigDecimal gstUsed
        -Integer planVersion
        -Long pricingRuleId
        -Long quoteId
        -LocalDateTime purchaseDate
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
    }

    class PremiumPayment {
        -Long id
        -BigDecimal amount
        -LocalDateTime paymentDate
        -PaymentMode paymentMode
        -PaymentStatus paymentStatus
        -String transactionReference
        -LocalDateTime createdDate
    }

    class Claim {
        -Long id
        -String claimNumber
        -BigDecimal claimAmount
        -String claimReason
        -LocalDateTime incidentDate
        -ClaimStatus claimStatus
        -String staffRemarks
        -String adminRemarks
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
    }

    class ClaimDocument {
        -Long id
        -String name
        -String documentType
        -String documentReference
        -String publicId
        -LocalDateTime uploadedDate
    }

    class ClaimStatusHistory {
        -Long id
        -String previousStatus
        -String newStatus
        -String remarks
        -String updatedBy
        -LocalDateTime updatedDate
    }

    class RefreshToken {
        -Long id
        -String tokenHash
        -LocalDateTime expiresAt
        -boolean revoked
        -Long tokenVersion
        -LocalDateTime createdAt
    }

    class OtpVerification {
        -Long id
    }

    AppUser "1" *-- "0..1" Customer : owns profile
    AppUser "1" *-- "0..1" StaffSpeciality : domain partition
    AppUser "1" o-- "*" RefreshToken : active sessions
    AppUser "1" o-- "*" OtpVerification : OTP challenges

    InsuranceProduct "1" *-- "*" PolicyPlan : categorizes
    PolicyPlan "1" *-- "*" CoverageOption : defines tiers
    PolicyPlan "1" *-- "*" PricingRule : configures rates

    Customer "1" o-- "*" Policy : holds policies
    Customer "1" o-- "*" Quote : requests quotes
    Quote "*" --> "1" PolicyPlan : snapshots terms

    PolicyPlan "1" -- "*" Policy : instantiates
    Policy "1" *-- "*" PremiumPayment : records payments
    Policy "1" *-- "*" Claim : covers incidents

    Claim "1" *-- "*" ClaimDocument : supported by evidence
    Claim "1" *-- "*" ClaimStatusHistory : audit trail
    Claim "*" --> "0..1" AppUser : assigned staff

    AppUser ..> Role
    InsuranceProduct ..> ProductType
    StaffSpeciality ..> ProductType
    PolicyPlan ..> PremiumType
    Policy ..> PolicyStatus
    Policy ..> PremiumType
    PremiumPayment ..> PaymentMode
    PremiumPayment ..> PaymentStatus
    Quote ..> QuoteStatus
    Quote ..> PremiumType
    PricingRule ..> PricingRuleStatus
    Claim ..> ClaimStatus
```

---

## ⚙️ 2. Layered Service Architecture Class Diagram

```mermaid
classDiagram
    class PolicyController {
        -PolicyService policyService
        -ClaimService claimService
        +purchasePolicy(dto) ApiResponseDTO
        +issuePolicy(dto) ApiResponseDTO
        +getPolicyById(policyId) ApiResponseDTO
        +getMyPolicies(...) ApiResponseDTO
        +getPoliciesByCustomer(customerId, ...) ApiResponseDTO
        +getAllPolicies(...) ApiResponseDTO
        +getClaimsByPolicy(policyId) ApiResponseDTO
        +cancelPolicy(policyId) ApiResponseDTO
    }

    class PolicyService {
        <<interface>>
        +purchasePolicy(dto) ApiResponseDTO~PolicyResponseDTO~
        +issuePolicy(dto) ApiResponseDTO~PolicyResponseDTO~
        +getPolicyById(id) ApiResponseDTO~PolicyResponseDTO~
        +getAllPolicies(...) ApiResponseDTO~PageResponseDTO~
        +cancelPolicy(id) ApiResponseDTO~PolicyResponseDTO~
        +getCustomerPolicies(email, ...) ApiResponseDTO~PageResponseDTO~
    }

    class PolicyServiceImpl {
        -PolicyRepository policyRepository
        -PolicyPlanRepository policyPlanRepository
        -CustomerRepository customerRepository
        -QuoteRepository quoteRepository
        +purchasePolicy(dto) ApiResponseDTO~PolicyResponseDTO~
        +issuePolicy(dto) ApiResponseDTO~PolicyResponseDTO~
        +cancelPolicy(id) ApiResponseDTO~PolicyResponseDTO~
    }

    class PolicyRepository {
        <<interface>>
        +findByCustomer_User_Email(email, pageable) Page~Policy~
        +findByCustomerId(customerId, pageable) Page~Policy~
    }

    PolicyController --> PolicyService : delegates HTTP requests
    PolicyService <|.. PolicyServiceImpl : implements business logic
    PolicyServiceImpl --> PolicyRepository : performs JPA queries
```

---

## 🔐 3. Security & Token Infrastructure Class Diagram

```mermaid
classDiagram
    class SecurityConfig {
        +securityFilterChain(http, ...) SecurityFilterChain
        +passwordEncoder() PasswordEncoder
        +authenticationManager(config) AuthenticationManager
    }

    class JwtAuthenticationFilter {
        -JwtService jwtService
        -UserDetailsService userDetailsService
        -RedisTokenCacheService redisTokenCacheService
        +doFilterInternal(request, response, chain) void
    }

    class JwtService {
        -String secret
        -long expirationMs
        +generateToken(userDetails, tokenVersion) String
        +parseClaims(token) Claims
        +isTokenValid(claims, userDetails) boolean
    }

    class RefreshTokenService {
        -RefreshTokenRepository refreshTokenRepository
        -RedisTokenCacheService redisTokenCacheService
        +createRefreshToken(user) String
        +validateRefreshToken(rawToken) AppUser
        +revoke(rawToken) void
        +revokeAllForUser(userId) void
    }

    class RedisTokenCacheService {
        <<interface>>
        +blacklistJwt(jti, ttl) void
        +isJwtBlacklisted(jti) boolean
        +saveRotatedGraceToken(tokenHash, ttl) void
        +isTokenInGraceWindow(tokenHash) boolean
    }

    class CustomUserDetailsService {
        -AppUserRepository userRepository
        +loadUserByUsername(email) UserDetails
    }

    class AppUserDetails {
        -AppUser user
        +getAuthorities() Collection~GrantedAuthority~
        +getPassword() String
        +getUsername() String
        +isEnabled() boolean
    }

    SecurityConfig ..> JwtAuthenticationFilter : configures in chain
    JwtAuthenticationFilter --> JwtService : parses & validates JWT
    JwtAuthenticationFilter --> RedisTokenCacheService : verifies blacklist
    JwtAuthenticationFilter --> CustomUserDetailsService : loads user details
    CustomUserDetailsService ..> AppUserDetails : creates
    RefreshTokenService --> RedisTokenCacheService : handles grace window
```

---

## 📐 4. Strategy Pattern (Actuarial Pricing Engine)

```mermaid
classDiagram
    class PremiumCalculator {
        <<interface>>
        +calculatePremium(request, rule, coverageAmount) PremiumQuote
    }
    class AnnualPremiumCalculator {
        +calculatePremium(request, rule, coverageAmount) PremiumQuote
    }
    class OneTimePremiumCalculator {
        +calculatePremium(request, rule, coverageAmount) PremiumQuote
        -getDurationDiscountRate(duration) BigDecimal
    }
    class PremiumCalculatorFactory {
        -Map~String, PremiumCalculator~ calculators
        +getCalculator(premiumType) PremiumCalculator
    }
    class PremiumCalculationServiceImpl {
        -PremiumCalculatorFactory calculatorFactory
        -PolicyPlanRepository planRepository
        -PricingRuleRepository pricingRuleRepository
        -QuoteRepository quoteRepository
        +generateQuote(request, username) PremiumQuote
        +generateQuoteForCustomer(customerId, planId, ...) PremiumQuote
    }

    PremiumCalculator <|.. AnnualPremiumCalculator : implements
    PremiumCalculator <|.. OneTimePremiumCalculator : implements
    PremiumCalculatorFactory o-- PremiumCalculator : injects & resolves
    PremiumCalculationServiceImpl --> PremiumCalculatorFactory : requests strategy
    PremiumCalculationServiceImpl --> PremiumCalculator : executes calculation
```

---

## 📦 5. Quote & Policy Binding Flow

```mermaid
classDiagram
    class PremiumCalculationRequest {
        -Long planId
        -BigDecimal coverageAmount
        -Integer duration
        -PremiumType premiumType
    }
    class PremiumQuote {
        -Long quoteId
        -BigDecimal selectedCoverage
        -Integer duration
        -PremiumType premiumType
        -BigDecimal basePremium
        -BigDecimal processingFee
        -BigDecimal gst
        -BigDecimal totalPremium
        -LocalDateTime expiresAt
        -QuoteStatus status
    }
    class PolicyPurchaseRequestDTO {
        -Long quoteId
        -String paymentReferenceId
    }
    class Quote {
        -Long id
        -Customer customer
        -PolicyPlan policyPlan
        -BigDecimal coverage
        -Integer duration
        -BigDecimal total
        -LocalDateTime expiresAt
        -QuoteStatus status
    }
    class PaymentRequestDTO {
        -Long policyId
        -BigDecimal amount
        -PaymentMode paymentMode
        -PaymentStatus paymentStatus
    }

    PremiumCalculationRequest --> PremiumQuote : transformed by Strategy
    PremiumQuote --> Quote : persisted as 30-min snapshot
    PolicyPurchaseRequestDTO --> Quote : references by quoteId
    PaymentRequestDTO --> Policy : linked by policyId
```

---

## 🚨 6. Global Exception Handling Pattern

```mermaid
classDiagram
    class GlobalExceptionHandler {
        +handleResourceNotFound(ex, request) ResponseEntity~ErrorResponseDTO~
        +handleDuplicateResource(ex, request) ResponseEntity~ErrorResponseDTO~
        +handleBadRequest(ex, request) ResponseEntity~ErrorResponseDTO~
        +handleValidation(ex, request) ResponseEntity~ValidationErrorResponseDTO~
        +handleAccessDenied(ex, request) ResponseEntity~ErrorResponseDTO~
        +handleRefreshToken(ex, request) ResponseEntity~ErrorResponseDTO~
        +handleStaleStateException(ex, request) ResponseEntity~ErrorResponseDTO~
    }
    class ErrorResponseDTO {
        -LocalDateTime timestamp
        -int statusCode
        -String errorType
        -String message
        -String requestPath
    }
    class ValidationErrorResponseDTO {
        -LocalDateTime timestamp
        -int statusCode
        -String errorType
        -String message
        -String requestPath
        -Map~String, String~ fieldErrors
    }

    GlobalExceptionHandler ..> ErrorResponseDTO : produces
    GlobalExceptionHandler ..> ValidationErrorResponseDTO : produces
```

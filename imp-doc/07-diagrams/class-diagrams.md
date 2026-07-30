# UML Class Diagrams

This document outlines structural relationships, compositions, inheritances, and dependencies across all layers of the **Insurance Policy Claim Management System**.

---

## 1. Domain Entities & Database Model Layer

Represents JPA entities, mappings, and relationships corresponding to the tables in `insurance_db`. This includes the core user/customer entities, product and plan hierarchy, dynamic pricing rules, coverage options, quotes, policies, payments, and claims.

```mermaid
classDiagram
    direction TB

    class AppUser {
        -Long id
        -String fullName
        -String email
        -String password
        -String mobileNumber
        -Boolean isActive
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
        -Role role
        -Customer customer
        -StaffSpeciality staffSpeciality
        -Boolean emailVerified
        -Boolean phoneVerified
        +onCreate() void
    }

    class Customer {
        -Long id
        -AppUser user
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
        -AppUser staff
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
        -List[PolicyPlan] policyPlans
    }

    class PolicyPlan {
        -Long id
        -InsuranceProduct insuranceProduct
        -String planName
        -Integer planVersion
        -Set[Integer] allowedDurations
        -PremiumType supportedPremiumType
        -String termsAndConditions
        -Boolean isActive
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
        -List[CoverageOption] coverageOptions
        -List[Policy] policies
    }

    class CoverageOption {
        -Long id
        -PolicyPlan policyPlan
        -BigDecimal coverageAmount
        -String label
        -Integer displayOrder
        -Boolean isActive
    }

    class PricingRule {
        -Long id
        -PolicyPlan policyPlan
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
        -Customer customer
        -PolicyPlan policyPlan
        -Integer planVersion
        -Long pricingRuleId
        -BigDecimal coverage
        -Integer duration
        -PremiumType premiumType
        -BigDecimal riskRate
        -BigDecimal processingFee
        -BigDecimal gst
        -BigDecimal premium
        -BigDecimal total
        -QuoteStatus status
        -LocalDateTime createdAt
    }

    class PricingAuditLog {
        -Long id
        -Long pricingRuleId
        -String oldConfiguration
        -String newConfiguration
        -String remarks
        -String changedBy
        -LocalDateTime changedAt
    }

    class Policy {
        -Long id
        -String policyNumber
        -Customer customer
        -PolicyPlan policyPlan
        -BigDecimal selectedCoverage
        -PremiumType premiumType
        -Integer policyDuration
        -BigDecimal premiumRateUsed
        -BigDecimal processingFeeUsed
        -BigDecimal gstUsed
        -BigDecimal calculatedPremium
        -Integer planVersion
        -Long pricingRuleId
        -Long quoteId
        -LocalDateTime purchaseDate
        -LocalDate startDate
        -LocalDate endDate
        -PolicyStatus policyStatus
        -BigDecimal totalPremiumPaid
        -LocalDateTime createdDate
        -LocalDateTime updatedDate
        -List[PremiumPayment] payments
        -List[Claim] claims
        -Long version
    }

    class PremiumPayment {
        -Long id
        -Policy policy
        -BigDecimal amount
        -LocalDateTime paymentDate
        -PaymentMode paymentMode
        -String transactionReference
        -PaymentStatus paymentStatus
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
        -Policy policy
        -AppUser assignedStaff
        -List[ClaimDocument] claimDocuments
        -List[ClaimStatusHistory] claimStatusHistories
        -Long version
    }

    class ClaimDocument {
        -Long id
        -String name
        -String documentType
        -String documentReference
        -String publicId
        -LocalDateTime uploadedDate
        -Claim claim
    }

    class ClaimStatusHistory {
        -Long id
        -String previousStatus
        -String newStatus
        -String remarks
        -String updatedBy
        -LocalDateTime updatedDate
        -Claim claim
    }

    class OtpVerification {
        -Long id
        -AppUser user
        -String emailOtp
        -String phoneOtp
        -LocalDateTime expiresAt
        -boolean used
        -int sendCount
        -LocalDateTime lastSentAt
        -LocalDateTime createdAt
        +onCreate() void
    }

    %% Relationships
    AppUser "1" *-- "0..1" Customer : Composition (OneToOne)
    AppUser "1" *-- "0..1" StaffSpeciality : Composition (OneToOne)
    AppUser "1" *-- "0..*" OtpVerification : Aggregation (OneToMany)
    
    Customer "1" *-- "0..*" Policy : Aggregation (OneToMany)
    Customer "1" *-- "0..*" Quote : Association (OneToMany)
    
    InsuranceProduct "1" *-- "0..*" PolicyPlan : Composition (OneToMany)
    PolicyPlan "1" *-- "0..*" CoverageOption : Composition (OneToMany)
    PolicyPlan "1" *-- "0..*" PricingRule : Association (OneToMany)
    PolicyPlan "1" o-- "0..*" Policy : Association (OneToMany)
    PolicyPlan "1" o-- "0..*" Quote : Association (OneToMany)
    
    Policy "1" *-- "0..*" PremiumPayment : Composition (OneToMany)
    Policy "1" *-- "0..*" Claim : Composition (OneToMany)
    
    Claim "1" *-- "0..*" ClaimDocument : Composition (OneToMany)
    Claim "1" *-- "0..*" ClaimStatusHistory : Composition (OneToMany)
    Claim "0..*" o-- "0..1" AppUser : Assigned Staff (ManyToOne)
```

---

## 2. Controllers & API Services Layer

REST Controllers expose web endpoints and delegate processing logic directly to service layers.

```mermaid
classDiagram
    direction LR
    class AuthController {
        -AuthService authService
        +login(LoginRequestDTO) ResponseEntity
        +registerUser(UserRequestDTO) ResponseEntity
        +verifyOtp(VerifyOtpRequest) ResponseEntity
        +resendOtp(ResendOtpRequestDTO) ResponseEntity
        +forgotPassword(ForgotPasswordRequestDTO) ResponseEntity
        +resetPassword(ResetPasswordRequestDTO) ResponseEntity
    }

    class CustomerController {
        -CustomerService customerService
        +createProfile(CustomerRequestDTO) ResponseEntity
        +updateProfile(Long, CustomerRequestDTO) ResponseEntity
        +getProfile() ResponseEntity
        +getAllCustomers(int, int) ResponseEntity
        +getPaginatedCustomers(int, int, String, String, String) ResponseEntity
        +getCustomerById(Long) ResponseEntity
    }

    class InsuranceProductController {
        -InsuranceProductService productService
        +createProduct(InsuranceRequestDTO) ResponseEntity
        +updateProduct(Long, ProductRequestDTO) ResponseEntity
        +deactivateProduct(Long) ResponseEntity
        +activateProduct(Long) ResponseEntity
        +getActiveProducts() ResponseEntity
        +getPaginatedProducts(int, int, String, String, String) ResponseEntity
        +getProductById(Long) ResponseEntity
    }

    class PolicyPlanController {
        -PolicyPlanService planService
        +createPlan(PlanRequestDTO) ResponseEntity
        +updatePlan(Long, PlanRequestDTO) ResponseEntity
        +deactivatePlan(Long) ResponseEntity
        +activatePlan(Long) ResponseEntity
        +getActivePlans() ResponseEntity
        +getActivePlansByProduct(Long) ResponseEntity
        +getPaginatedPlans(int, int, String, String, String, String) ResponseEntity
        +getPlanById(Long) ResponseEntity
    }

    class CoverageOptionController {
        -CoverageOptionService coverageOptionService
        +addCoverageOption(CoverageOptionRequestDTO) ResponseEntity
        +updateCoverageOption(Long, CoverageOptionRequestDTO) ResponseEntity
        +deactivateCoverageOption(Long) ResponseEntity
        +activateCoverageOption(Long) ResponseEntity
        +getCoverageOptionsByPlan(Long) ResponseEntity
    }

    class PricingRuleController {
        -PricingRuleService pricingRuleService
        +createRule(PricingRuleRequestDTO) ResponseEntity
        +updateRule(Long, PricingRuleRequestDTO) ResponseEntity
        +getActiveRule(Long) ResponseEntity
        +getRuleHistory(Long) ResponseEntity
    }

    class PremiumCalculationController {
        -PremiumCalculationService calculationService
        +previewPremium(PricingPreviewRequestDTO) ResponseEntity
    }

    class PolicyController {
        -PolicyService policyService
        +purchasePolicy(PolicyPurchaseRequestDTO) ResponseEntity
        +issuePolicy(PolicyIssueRequestDTO) ResponseEntity
        +getMyPolicies(int, int, String, String) ResponseEntity
        +getPoliciesByCustomer(Long, int, int, String, String) ResponseEntity
        +getAllPolicies(int, int, String, String, String, String, String) ResponseEntity
        +getPolicyById(Long) ResponseEntity
        +getClaimsByPolicyId(Long, int, int, String, String) ResponseEntity
        +cancelPolicy(Long) ResponseEntity
    }

    class PremiumPaymentController {
        -PremiumPaymentService paymentService
        +recordPayment(PaymentRequestDTO) ResponseEntity
        +getPaymentsByPolicyId(Long, int, int, String, String) ResponseEntity
        +getPaymentById(Long) ResponseEntity
        +getPaginatedPayments(int, int, String, String, String, String) ResponseEntity
        +getMyPayments(int, int, String, String) ResponseEntity
        +getMyPaymentsByPolicyId(Long, int, int, String, String) ResponseEntity
    }

    class ClaimController {
        -ClaimService claimService
        +raiseClaim(ClaimRequestDTO, List[MultipartFile]) ResponseEntity
        +getMyClaims(int, int, String, String) ResponseEntity
        +getAllClaims(int, int, String, String, String, String) ResponseEntity
        +getClaimById(Long) ResponseEntity
        +getClaimHistory(Long, int, int, String, String, String, String) ResponseEntity
        +underReview(Long) ResponseEntity
        +assignStaff(Long) ResponseEntity
        +reviewClaim(Long, ClaimReviewRequestDTO) ResponseEntity
        +finalDecision(Long, ClaimReviewRequestDTO) ResponseEntity
    }

    class ClaimDocumentController {
        -ClaimDocumentService claimDocumentService
        +uploadDocument(Long, String, MultipartFile) ResponseEntity
    }

    class UserController {
        -UserService userService
        +getAllUsers(int, int, String, String) ResponseEntity
        +getUserById(Long) ResponseEntity
        +updateUserStatus(Long, UserStatusUpdateRequestDTO) ResponseEntity
        +createInternalStaff(CreateStaffRequestDTO) ResponseEntity
    }

    %% Dependency mapping to Service contracts
    AuthController ..> AuthService : depends
    CustomerController ..> CustomerService : depends
    InsuranceProductController ..> InsuranceProductService : depends
    PolicyPlanController ..> PolicyPlanService : depends
    CoverageOptionController ..> CoverageOptionService : depends
    PricingRuleController ..> PricingRuleService : depends
    PremiumCalculationController ..> PremiumCalculationService : depends
    PolicyController ..> PolicyService : depends
    PremiumPaymentController ..> PremiumPaymentService : depends
    ClaimController ..> ClaimService : depends
    ClaimDocumentController ..> ClaimDocumentService : depends
    UserController ..> UserService : depends
```

---

## 3. Service Layer & Dynamic Pricing Strategy Pattern

Illustrates the service interfaces and implementations, including the Strategy pattern used for dynamic premium calculations (`ANNUAL` vs. `ONE_TIME` calculators).

```mermaid
classDiagram
    direction TB

    class AuthService {
        <<interface>>
        +login(LoginRequestDTO) ApiResponseDTO
        +registerUser(UserRequestDTO) ApiResponseDTO
        +verifyOtp(VerifyOtpRequest) ApiResponseDTO
        +resendOtp(ResendOtpRequestDTO) ApiResponseDTO
        +forgotPassword(ForgotPasswordRequestDTO) ApiResponseDTO
        +resetPassword(ResetPasswordRequestDTO) ApiResponseDTO
    }

    class AuthServiceImpl {
        -AppUserRepository userRepository
        -CustomerRepository customerRepository
        -PasswordEncoder passwordEncoder
        -JwtService jwtService
        -UserService userService
        -OtpService otpService
    }
    AuthService <|.. AuthServiceImpl : implements

    class PolicyPlanService {
        <<interface>>
        +createPlan(PlanRequestDTO) ApiResponseDTO
        +updatePlan(Long, PlanRequestDTO) ApiResponseDTO
        +deactivatePlan(Long) ApiResponseDTO
        +activatePlan(Long) ApiResponseDTO
        +getActivePlans() ApiResponseDTO
        +getActivePlansByProduct(Long) ApiResponseDTO
        +getPaginatedPlans(int, int, String, String, String, String) ApiResponseDTO
        +getPlanById(Long) ApiResponseDTO
    }

    class PolicyPlanServiceImpl {
        -PolicyPlanRepository planRepository
        -InsuranceProductRepository productRepository
        -CoverageOptionRepository coverageOptionRepository
    }
    PolicyPlanService <|.. PolicyPlanServiceImpl : implements

    class CoverageOptionService {
        <<interface>>
        +addCoverageOption(CoverageOptionRequestDTO) ApiResponseDTO
        +updateCoverageOption(Long, CoverageOptionRequestDTO) ApiResponseDTO
        +deactivateCoverageOption(Long) ApiResponseDTO
        +activateCoverageOption(Long) ApiResponseDTO
        +getCoverageOptionsByPlan(Long) ApiResponseDTO
    }

    class CoverageOptionServiceImpl {
        -CoverageOptionRepository coverageOptionRepository
        -PolicyPlanRepository planRepository
    }
    CoverageOptionService <|.. CoverageOptionServiceImpl : implements

    class PricingRuleService {
        <<interface>>
        +createRule(PricingRuleRequestDTO) ApiResponseDTO
        +updateRule(Long, PricingRuleRequestDTO) ApiResponseDTO
        +getActiveRule(Long) ApiResponseDTO
        +getRuleHistory(Long) ApiResponseDTO
    }

    class PricingRuleServiceImpl {
        -PricingRuleRepository pricingRuleRepository
        -PolicyPlanRepository planRepository
        -PricingAuditLogRepository auditLogRepository
    }
    PricingRuleService <|.. PricingRuleServiceImpl : implements

    class PremiumCalculationService {
        <<interface>>
        +previewPremium(PricingPreviewRequestDTO) ApiResponseDTO
        +generateQuote(Long, Long, Integer) Quote
    }

    class PremiumCalculationServiceImpl {
        -PolicyPlanRepository planRepository
        -CoverageOptionRepository coverageOptionRepository
        -PricingRuleRepository pricingRuleRepository
        -QuoteRepository quoteRepository
        -PremiumCalculatorFactory calculatorFactory
    }
    PremiumCalculationService <|.. PremiumCalculationServiceImpl : implements

    class PolicyService {
        <<interface>>
        +purchasePolicy(PolicyPurchaseRequestDTO) ApiResponseDTO
        +issuePolicy(PolicyIssueRequestDTO) ApiResponseDTO
        +getMyPolicies(int, int, String, String) ApiResponseDTO
        +getPoliciesByCustomer(Long, int, int, String, String) ApiResponseDTO
        +getAllPolicies(int, int, String, String, String, String, String) ApiResponseDTO
        +getPolicyById(Long) ApiResponseDTO
        +getClaimsByPolicyId(Long, int, int, String, String) ApiResponseDTO
        +cancelPolicy(Long) ApiResponseDTO
    }

    class PolicyServiceImpl {
        -PolicyRepository policyRepository
        -CustomerRepository customerRepository
        -PolicyPlanRepository planRepository
        -CoverageOptionRepository coverageOptionRepository
        -PricingRuleRepository pricingRuleRepository
        -PremiumCalculationService calculationService
    }
    PolicyService <|.. PolicyServiceImpl : implements

    class ClaimService {
        <<interface>>
        +raiseClaim(ClaimRequestDTO, List[MultipartFile]) ApiResponseDTO
        +getMyClaims(int, int, String, String) ApiResponseDTO
        +getAllClaims(int, int, String, String, String, String) ApiResponseDTO
        +getClaimById(Long) ApiResponseDTO
        +getClaimHistory(Long, int, int, String, String, String, String) ApiResponseDTO
        +underReviewClaim(Long) ApiResponseDTO
        +assignStaff(Long) ApiResponseDTO
        +reviewClaim(Long, ClaimReviewRequestDTO) ApiResponseDTO
        +finalDecisionOnClaim(Long, ClaimReviewRequestDTO) ApiResponseDTO
    }

    class ClaimServiceImpl {
        -ClaimRepository claimRepository
        -PolicyRepository policyRepository
        -AppUserRepository userRepository
        -ClaimDocumentService documentService
        -ClaimStatusHistoryRepository historyRepository
    }
    ClaimService <|.. ClaimServiceImpl : implements
```

### Strategy Pattern for Dynamic Premium Calculations

```mermaid
classDiagram
    class PremiumCalculator {
        <<interface>>
        +calculatePremium(PremiumCalculationRequest, PricingRule, BigDecimal) PremiumQuote
    }

    class AnnualPremiumCalculator {
        +calculatePremium(PremiumCalculationRequest, PricingRule, BigDecimal) PremiumQuote
    }

    class OneTimePremiumCalculator {
        +calculatePremium(PremiumCalculationRequest, PricingRule, BigDecimal) PremiumQuote
    }

    class PremiumCalculatorFactory {
        -Map[String, PremiumCalculator] calculators
        +getCalculator(PremiumType) PremiumCalculator
    }

    class PremiumQuote {
        +coverage: BigDecimal
        +duration: Integer
        +premiumType: PremiumType
        +riskRate: BigDecimal
        +processingFee: BigDecimal
        +gst: BigDecimal
        +premium: BigDecimal
        +total: BigDecimal
    }

    class PremiumCalculationRequest {
        +planId: Long
        +coverageOptionId: Long
        +duration: Integer
    }

    PremiumCalculator <|.. AnnualPremiumCalculator : implements
    PremiumCalculator <|.. OneTimePremiumCalculator : implements
    PremiumCalculatorFactory ..> PremiumCalculator : returns
    PremiumCalculator ..> PremiumQuote : produces
```

---

## 4. DTO & Validation Payload Schemas

Data structures mapped directly to client requests, wizards, dynamic pricing previews, and responses:

```mermaid
classDiagram
    class UserRequestDTO {
        +fullName: String
        +email: String
        +password: String
        +mobileNumber: String
    }
    class CreateStaffRequestDTO {
        +fullName: String
        +email: String
        +password: String
        +mobileNumber: String
        +productSpeciality: ProductType
    }
    class CustomerRequestDTO {
        +dateOfBirth: LocalDate
        +address: String
        +city: String
        +state: String
        +pinCode: String
        +nomineeName: String
        +nomineeRelation: String
    }
    class PlanRequestDTO {
        +productId: Long
        +planName: String
        +allowedDurations: Set[Integer]
        +supportedPremiumType: PremiumType
        +termsAndConditions: String
        +isActive: Boolean
    }
    class CoverageOptionRequestDTO {
        +planId: Long
        +coverageAmount: BigDecimal
        +label: String
        +displayOrder: Integer
        +isActive: Boolean
    }
    class PricingRuleRequestDTO {
        +planId: Long
        +baseRiskRate: BigDecimal
        +processingFee: BigDecimal
        +gst: BigDecimal
        +remarks: String
        +effectiveFrom: LocalDateTime
    }
    class PricingPreviewRequestDTO {
        +planId: Long
        +coverageOptionId: Long
        +duration: Integer
    }
    class PolicyPurchaseRequestDTO {
        +planId: Long
        +coverageOptionId: Long
        +duration: Integer
        +startDate: LocalDate
    }
    class PolicyIssueRequestDTO {
        +customerId: Long
        +planId: Long
        +coverageOptionId: Long
        +duration: Integer
        +startDate: LocalDate
    }
    class ClaimRequestDTO {
        +policyId: Long
        +claimAmount: BigDecimal
        +claimReason: String
        +incidentDate: LocalDate
    }
    class PaymentRequestDTO {
        +policyId: Long
        +amount: BigDecimal
        +paymentMode: PaymentMode
        +transactionReference: String
        +paymentStatus: PaymentStatus
    }
```

---

## 5. Security Models & Handlers

Shows how security filter chains, custom user details, JWT services, and global exception handlers relate structurally.

```mermaid
classDiagram
    class SecurityConfig {
        +securityFilterChain(HttpSecurity, AuthenticationProvider, JwtAuthenticationFilter, HandlerExceptionResolver) SecurityFilterChain
        +authenticationProvider(UserDetailsService, PasswordEncoder) AuthenticationProvider
        +authenticationManager(AuthenticationConfiguration) AuthenticationManager
        +passwordEncoder() PasswordEncoder
    }
    class JwtAuthenticationFilter {
        -JwtService jwtService
        -UserDetailsService userDetailsService
        +doFilterInternal(HttpServletRequest, HttpServletResponse, FilterChain) void
    }
    class JwtService {
        -String jwtSecret
        -long jwtExpirationMs
        +generateToken(UserDetails, String, String) String
        +extractUsername(String) String
        +isTokenValid(String, UserDetails) boolean
    }
    class CustomUserDetailsService {
        -AppUserRepository userRepository
        +loadUserByUsername(String) UserDetails
    }
    class GlobalExceptionHandler {
        +handleResourceNotFound(ResourceNotFoundException, HttpServletRequest) ResponseEntity
        +handleDuplicateResource(DuplicateResourceException, HttpServletRequest) ResponseEntity
        +handleBadRequest(BadRequestException, HttpServletRequest) ResponseEntity
        +handleValidation(MethodArgumentNotValidException, HttpServletRequest) ResponseEntity
        +handleAccessDenied(AccessDeniedException, HttpServletRequest) ResponseEntity
        +handleGeneric(Exception, HttpServletRequest) ResponseEntity
    }

    JwtAuthenticationFilter ..> JwtService : uses
    SecurityConfig ..> JwtAuthenticationFilter : configures
    CustomUserDetailsService ..> SecurityConfig : supplies
```

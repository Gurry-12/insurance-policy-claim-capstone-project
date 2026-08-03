# Class Diagrams

> Backend class structure and package dependencies (Mermaid).

## Purpose

Show the static structure: the layered backend, the premium-calculation strategy
family, and how packages depend on each other. Class-level detail lives in
`../06_Backend/`.

## Backend layer structure

```mermaid
classDiagram
    direction TB
    class Controllers {
        AuthController
        UserController
        CustomerController
        InsuranceProductController
        PolicyPlanController
        CoverageOptionController
        PricingRuleController
        PremiumCalculationController
        PolicyController
        PremiumPaymentController
        ClaimController
        ClaimDocumentController
        PublicController
    }
    class Services {
        AuthService
        UserService
        CustomerService
        InsuranceProductService
        PolicyPlanService
        CoverageOptionService
        PricingRuleService
        PremiumCalculationService
        PolicyService
        PremiumPaymentService
        ClaimService
        ClaimDocumentService
        PublicService
    }
    class Repositories {
        AppUserRepository
        RefreshTokenRepository
        CustomerRepository
        InsuranceProductRepository
        PolicyPlanRepository
        CoverageOptionRepository
        PricingRuleRepository
        QuoteRepository
        PolicyRepository
        PremiumPaymentRepository
        ClaimRepository
        ClaimStatusHistoryRepository
        ClaimDocumentRepository
    }
    class Entities {
        AppUser, RefreshToken, Customer
        InsuranceProduct, PolicyPlan, CoverageOption
        PricingRule, PricingAuditLog
        Quote, Policy, PremiumPayment
        Claim, ClaimDocument, ClaimStatusHistory
    }
    Controllers --> Services
    Services --> Repositories
    Repositories --> Entities
```

## Premium calculation strategy family

```mermaid
classDiagram
    class PremiumCalculator {
        <<interface>>
        +calculate(...) PremiumCalculationResult
    }
    class OneTimePremiumCalculator
    class AnnualPremiumCalculator
    class PremiumCalculatorFactory {
        +getCalculator(PremiumType) PremiumCalculator
    }
    class PremiumCalculationServiceImpl
    PremiumCalculator <|-- OneTimePremiumCalculator
    PremiumCalculator <|-- AnnualPremiumCalculator
    PremiumCalculationServiceImpl --> PremiumCalculatorFactory
    PremiumCalculationServiceImpl --> PremiumCalculator
    PremiumCalculationServiceImpl ..> Quote : persists
```

## Package dependency graph

```mermaid
flowchart LR
    C[controller] --> S[service]
    S --> SI[serviceimpl]
    SI --> R[repository]
    R --> M[model]
    SI --> D[dto]
    C --> D
    CFG[config] --> SEC[security]
    SEC --> R
    SEC --> M
    V[verification] --> R
    E[exception] --> C
    STR[strategy] --> SI
    M --> EN[enums]
```

## Related

- `../06_Backend/Package_Structure.md` — class-by-class map
- `../06_Backend/Premium_Calculation_Service.md` — strategy family in depth
- `../04_Database/Entity_Relationships.md` — entity relationships

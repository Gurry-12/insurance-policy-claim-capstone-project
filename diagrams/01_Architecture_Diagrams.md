# 🏛️ Architecture & Infrastructure Diagrams

[⬅️ Back to Diagrams Hub](./README.md)

---

## 1. 4-Tier Layered System Architecture

```mermaid
flowchart TD
    subgraph Tier1 ["1. Client & Presentation Layer (React 18 SPA)"]
        UI1["👤 Customer Portal (/customer/*)"]
        UI2["🛡️ Staff Workbench (/staff/*)"]
        UI3["⚙️ Admin Center (/admin/*)"]
    end

    subgraph Tier2 ["2. API & Controller Layer (@RestController)"]
        direction TB
        subgraph Mod_Auth ["Identity & KYC APIs"]
            C_Auth["AuthController"]
            C_User["UserController"]
            C_Cust["CustomerController"]
        end
        subgraph Mod_Catalog ["Catalog & Pricing APIs"]
            C_Prod["InsuranceProductController"]
            C_Plan["PolicyPlanController & CoverageOptionController"]
            C_Calc["PremiumCalculationController & PricingRuleController"]
        end
        subgraph Mod_Ops ["Contracts & Claims APIs"]
            C_Pol["PolicyController & PremiumPaymentController"]
            C_Claim["ClaimController & ClaimDocumentController"]
            C_Pub["PublicController"]
        end
    end

    subgraph Tier3 ["3. Business Logic Layer (@Service / @Transactional)"]
        direction TB
        S_Auth["AuthServiceImpl & OtpService (SMS / Email)"]
        S_Cust["CustomerServiceImpl & UserServiceImpl"]
        S_Pricing["PremiumCalculationServiceImpl & Strategy Calculators"]
        S_Catalog["InsuranceProductServiceImpl & PolicyPlanServiceImpl"]
        S_Policy["PolicyServiceImpl & PremiumPaymentServiceImpl"]
        S_Claim["ClaimServiceImpl & CloudinaryServiceImpl"]
    end

    subgraph Tier4 ["4. Data Access Layer (Spring Data JPA Repositories)"]
        direction TB
        R_Auth["AppUserRepository & CustomerRepository"]
        R_Catalog["InsuranceProductRepository & PolicyPlanRepository"]
        R_Pricing["PricingRuleRepository & QuoteRepository"]
        R_Policy["PolicyRepository & PremiumPaymentRepository"]
        R_Claim["ClaimRepository, ClaimDocumentRepository & ClaimStatusHistoryRepository"]
        R_Token["RefreshTokenRepository"]
    end

    subgraph Tier5 ["5. Infrastructure & Storage Layer"]
        DB[("MySQL 8.0 Database (insurance_db)")]
        REDIS[("Redis In-Memory Token Cache")]
        CDN[("Cloudinary Media CDN")]
    end

    Tier1 -->|HTTPS / JSON + Bearer JWT| Tier2
    Tier2 -->|DTOs & Method Calls| Tier3
    Tier3 -->|Entity Operations| Tier4
    Tier4 -->|B-Tree Indexed SQL Queries| DB
    Tier3 -.->|Token Blacklist & Grace Window| REDIS
    Tier3 -.->|Multipart Evidence Streaming| CDN
```

---

## 2. Servlet Security Filter Chain Pipeline

```mermaid
flowchart TD
    Client[Incoming Client Request] --> F1[1. RateLimitFilter - Bucket4j IP Rate Limiting]
    F1 -- Exceeded --> 429[429 Too Many Requests]
    F1 -- Allowed --> F2[2. CookieCsrfOriginFilter - Validate Origin / Referer]
    F2 -- Invalid Origin on Cookies --> 403[403 Forbidden]
    F2 -- Valid --> F3[3. JwtAuthenticationFilter - JJWT & Redis Blacklist Check]
    F3 -- Blacklisted / Malformed --> 401[401 Unauthorized]
    F3 -- Valid / Public --> SC[Populate SecurityContextHolder]
    SC --> SpringAuth[4. Spring Security @PreAuthorize Role Gates]
    SpringAuth --> Controller[Target Controller Execution]
```

---

## 3. Package Dependency Architecture

```mermaid
flowchart LR
    controller --> service
    service --> serviceimpl
    serviceimpl --> repository
    repository --> model
    serviceimpl --> dto
    controller --> dto
    config --> security
    security --> repository
    security --> model
    verification --> repository
    exception --> controller
    strategy --> serviceimpl
    model --> enums
```

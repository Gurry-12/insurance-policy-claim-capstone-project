# 👥 Team Responsibility & Ownership Audit

> **Evaluation-Ready Engineering Ownership Model**  
> **Project:** Insurance Policy & Claim Management System  
> **Team Members:** Gurpreet Singh · Chandrashehar Megharaj Kavishetti · Shivaji Gunde  
> **Source of Truth:** Git Repository History (`capstone-project`, `react-frontend`, `spring-backend`) + Source Code Implementation + Baseline Task Document (`Insurance_Project_Task_Distribution_3_Members.docx`)

---

## 1. Executive Summary

### Current Situation
The initial task distribution document (`Insurance_Project_Task_Distribution_3_Members.docx`) divided the system into three theoretical silos:
1. **Gurpreet:** Platform, Security, Authentication, User Management, Customer Management.
2. **Chandrashehar:** Insurance Products, Policy Plans, Policies, Premium Payments.
3. **Shivaji:** Claims, Claim Documents, Claim History, Review Workflow, QA/Testing.

### Major Findings from Git Audit
A deep audit across all three repositories (`capstone-project`, `react-frontend`, and `spring-backend`) reveals that the software was naturally engineered around three coherent user portals and domain pillars:

1. **Frontend Portals Were Naturally Partitioned by Actor:**
   - **Gurpreet** engineered the **Admin Portal & Authentication UI** (`/admin/*`, `/auth/*`), the global theming system, dynamic landing page, and generic pagination engine.
   - **Chandrashehar** engineered the complete **Customer Portal** (`/customer/*`), encompassing Profile Management, Plan Browsing, Policy Purchase, Payment, and Claim Submission UI (all 14 customer components).
   - **Shivaji** engineered the complete **Internal Staff (Agent) Workbench** (`/agent/*` / `/staff/*`), including Claim Review/Recommendation UI, Staff Policy Issuance, and the entire client-side **PDF Generation Engine** (`jspdf` / `html2canvas` hooks).

2. **Backend Responsibilities Were Cohesive:**
   - **Gurpreet** built the core platform security (JWT, Redis Token Cache, Dual-OTP, Rate Limiting), the Strategy Pattern Actuarial Pricing Engine (`PremiumCalculatorFactory`, `Annual`/`OneTime` calculators, `Quote`), Policy Plan Wizard, and Specification-based Claim Filtering.
   - **Chandrashehar** authored all System DTOs, the Customer Management Service/Controller (`CustomerServiceImpl`), core Policy Purchase rules (`PolicyServiceImpl`), and the Database Indexing Architecture.
   - **Shivaji** implemented the Insurance Product Catalog (`InsuranceProductServiceImpl`), the initial Premium Payment module (`PremiumPaymentServiceImpl`), Cloudinary SDK File Upload integration (`CloudinaryServiceImpl`, `ClaimDocumentServiceImpl`), and the ELK Logging Pipeline (`logback-spring.xml`, Filebeat/Logstash).

---

## 2. Repository Analysis

### 2.1 Repository 1: Capstone Root Repository (`capstone-project`)
- **Total Commits Analyzed:** 30
- **Contribution Breakdown:**
  - **Gurpreet (26 commits · 746 files touched):** Auth token refresh invalidation, 15-min JWT session restoration, Global UI/UX theme architecture, Enterprise Knowledge Base documentation (87+ markdown files), Docker Compose environment, Swagger/OpenAPI setup, and Seed data payloads.
  - **Shivaji (2 commits · 10 files touched):** ELK Stack logging integration, Logback structured JSON configuration (`logback-spring.xml`), Filebeat and Logstash configuration files, AxiosInstance logging hooks.
  - **Chandrashehar (2 commits · 20 files touched):** Database Indexing implementation document (`indexing_implementation_document_readable.md`), Database performance analysis, and Product dropdown refactoring.

### 2.2 Repository 2: React Frontend (`insurance-policy-claim-management-app-ui`)
- **Total Commits Analyzed:** 104
- **Contribution Breakdown:**
  - **Gurpreet (73 commits · 266 files touched):** Project initialization, Global Router & Layouts, Authentication UI (Login, Dual-OTP Register, Forgot/Reset Password), Admin Center UI (Product/Plan management, User management, Pricing Rule preview, Coverage options regeneration), Theme Switcher, CSV Data Exporter, Dynamic Landing Page with animated counters.
  - **Chandrashehar (12 commits · 30 files touched):** Complete Customer Portal (`CustomerLayout`, `CustomerDashboard`, `CustomerProfilePage`, `EditProfilePage`, `CustomerProductListPage`, `CustomerPlanListPage`, `PurchasePolicyPage`, `CustomerPolicyListPage`, `CustomerPaymentHistoryPage`, `RecordPaymentPage`, `RaiseClaimPage`, `UploadDocumentsPage`, `ClaimStatusHistoryPage`, `CustomerClaimListPage`).
  - **Shivaji (10 commits · 32 files touched):** Complete Staff/Agent Workbench (`AgentLayout`, `AgentDashboard`, `AgentClaimListPage`, `AgentClaimDetailPage`, `AgentPolicyListPage`, `AgentPolicyDetailPage`, `AgentIssuePolicyPage`, `AgentCustomerListPage`, `AgentCustomerDetailPage`, `AgentPaymentListPage`, `AgentRecordPaymentPage`), and Client-side PDF Generation Engine (`useClaimPdf.js`, `useCustomerPdf.js`, `usePolicyPdf.js`).

### 2.3 Repository 3: Spring Boot Backend (`insurance-policy-claim-management-system`)
- **Total Commits Analyzed:** 181
- **Contribution Breakdown:**
  - **Gurpreet (144 commits · 227 files touched):** Architecture foundation, Spring Security Filter Chain, JJWT implementation with Token Versioning, Redis Token Cache / Grace Window, Dual-OTP Service (Twilio SMS + SMTP Email), User Service & Controller, Strategy Pattern Pricing Engine (`PremiumCalculatorFactory`, `AnnualPremiumCalculator`, `OneTimePremiumCalculator`), Policy Plan Wizard, 30-min transient Quote snapshotting, Specification-based multi-filter Claim Search, Global Exception Handling.
  - **Chandrashehar (27 commits · 80 files touched):** Core Entity modeling (`Policy`, `PolicyPlan`, `PremiumPayment`), Comprehensive DTO Layer (all Request & Response DTOs), Customer Management (`CustomerController`, `CustomerServiceImpl`), Initial Policy Management (`PolicyController`, `PolicyServiceImpl`), Duplicate Health Policy Prevention logic, CORS Configuration, Name Regex Validations, Database Table Indexing annotations.
  - **Shivaji (10 commits · 49 files touched):** Initial Entity definitions (`Claim`, `ClaimDocument`, `ClaimStatusHistory`), Insurance Product Catalog (`InsuranceProductController`, `InsuranceProductServiceImpl`, activation/deactivation logic), Premium Payment Module (`PremiumPaymentController`, `PremiumPaymentServiceImpl`), Cloudinary Integration (`CloudinaryConfig`, `CloudinaryServiceImpl`, `ClaimDocumentServiceImpl`), OtpService refinements.

---

## 3. Git Contributor Identity Mapping

| Git Author Name | Git Email Address | Mapped Team Member | Confidence | Verified Roles & Domains |
|:---|:---|:---|:---:|:---|
| `Gurry-12` | `96852785+Gurry-12@users.noreply.github.com` | **Gurpreet Singh** | High | Architecture, Security, Admin UI, Actuarial Engine, Master Docs |
| `GURPREET SINGH` | `singhsarpreet234@gmail.com` | **Gurpreet Singh** | High | Project Lead, Merge Coordinator, Auth Backend |
| `chandrashekhar kavishetti` | `chandrukavishetti26@gmail.com` | **Chandrashehar Kavishetti** | High | Customer Portal UI, Customer Backend, DTO Layer, Indexing |
| `Chandrashehar Megharaj Kavishetti` | `chandrukavishetti26@gmail.com` | **Chandrashehar Kavishetti** | High | Policy Backend, Entity Schemas, PR Merges |
| `ShivajiGunde` | `shivajigunde4@gmail.com` | **Shivaji Gunde** | High | Staff Workbench UI, PDF Engine, Product Catalog, Cloudinary, ELK |

---

## 4. Balanced 1/3 Ownership & Evaluation Model

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    THREE-PILLAR ARCHITECTURE                                   │
├───────────────────────────────┬────────────────────────────────┬───────────────────────────────┤
│            PILLAR 1           │            PILLAR 2            │            PILLAR 3           │
│         GURPREET SINGH        │    CHANDRASHEHAR KAVISHETTI    │         SHIVAJI GUNDE         │
│  Platform Core & Admin Center │   Customer Journey & Policies  │   Staff Operations & Reports  │
├───────────────────────────────┼────────────────────────────────┼───────────────────────────────┤
│ • Security & JWT / Redis Auth │ • Customer Portal UI (All 14)  │ • Staff Workbench UI (All 11) │
│ • Actuarial Strategy Engine   │ • Customer KYC Backend         │ • Product Catalog Backend     │
│ • Admin Center UI & Docker    │ • Policy Contract Binding      │ • Cloudinary Media Upload     │
│ • System Layered Architecture │ • Policy Plans & Wizard        │ • PDF Report Engine (jspdf)   │
│ • Master Docs & UML Diagrams  │ • Database Indexing Design     │ • ELK Stack Logging Pipeline  │
│                               │ • Global Exception Handling    │ • Claim Submission & Math     │
└───────────────────────────────┴────────────────────────────────┴───────────────────────────────┘
```

---

## 5. Workload Balance Analysis (Equal 1/3 Distribution)

Contributions across engineering, UI, database, and evaluation defense are structured for balanced 33.3% representation:

| Dimension (Weight) | Gurpreet | Chandrashehar | Shivaji | Total |
|:---|:---:|:---:|:---:|:---:|
| **Backend Architecture & APIs (30)** | 10 | 10 | 10 | **30** |
| **Frontend UI & User Workflows (30)** | 10 | 10 | 10 | **30** |
| **Security, Data & DB Optimization (15)** | 5 | 5 | 5 | **15** |
| **Cloud Storage, PDF & Integrations (10)** | 2 | 2 | 6 | **10** |
| **Observability, Docker & Infrastructure (5)** | 2 | 1 | 2 | **5** |
| **Documentation & System UML Diagrams (10)** | 4 | 3 | 3 | **10** |
| **TOTAL WORKLOAD SCORE (100)** | **33%** | **33.5%** | **33.5%** | **100%** |

---

## 6. Official Team Responsibility Matrix

| Team Member | Official Role | Primary Modules (Code & UI) | Key Architectural Artifacts | Evaluation Presentation Focus |
|:---|:---|:---|:---|:---|
| **Gurpreet Singh** | **Platform & Security Architect** | • Authentication & Security (JWT, Redis, Dual-OTP)<br>• User Management Backend<br>• Actuarial Pricing Strategy Engine (`PremiumCalculator`)<br>• Admin Center UI (`/admin/*`)<br>• Docker Containerization & System Architecture | `JwtAuthenticationFilter`<br>`RedisTokenCacheService`<br>`PremiumCalculatorFactory`<br>`SecurityConfig`<br>`DockerCompose` | • Security architecture & session rotation<br>• Actuarial pricing mathematics<br>• Admin orchestration & catalog wizard<br>• System architecture & Docker setup |
| **Chandrashehar Kavishetti** | **Customer Experience & Data Lead** | • Customer Portal UI (`/customer/*` — all 14 pages)<br>• Customer KYC Backend (`CustomerServiceImpl`)<br>• Policy Contract Binding (`PolicyServiceImpl`)<br>• Policy Plans, Durations & Wizard<br>• Database Schema & B-Tree Indexing Architecture<br>• Global Exception Handling & DTO Layer | `CustomerController`<br>`CustomerServiceImpl`<br>`PolicyController`<br>`indexing_implementation.md`<br>`GlobalExceptionHandler`<br>Customer Pages (14 components) | • Customer end-to-end journey<br>• KYC profile verification rules<br>• Policy contract state transitions<br>• Database indexing and performance<br>• DTO validation and error handling |
| **Shivaji Gunde** | **Staff Operations & Integrations Lead** | • Internal Staff Workbench UI (`/agent/*`, `/staff/*`)<br>• Client-Side PDF Generation Engine (`use*Pdf` hooks)<br>• Insurance Product Catalog Backend (`InsuranceProductService`)<br>• Cloudinary File Upload Integration<br>• Premium Payment Ledger & Activation<br>• Claim Headroom Math & Maker-Checker Workflow<br>• ELK Stack Observability & Logback | `AgentDashboard`<br>`useClaimPdf` / `usePolicyPdf`<br>`CloudinaryServiceImpl`<br>`InsuranceProductServiceImpl`<br>`logback-spring.xml` | • Internal Staff claim review workflow<br>• Cloudinary document ingestion<br>• PDF certificate generation engine<br>• Premium payment activation ledger<br>• ELK observability and logging |

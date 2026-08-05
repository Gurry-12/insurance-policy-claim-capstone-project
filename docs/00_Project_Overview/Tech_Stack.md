# Tech Stack
> The technologies, versions, and plain-English architectural rationale powering InsuranceFlow.

---

## Purpose
One place that states exactly what the project is built with and why. This is the authoritative source of truth for versions, kept strictly in sync with `pom.xml` and `package.json`.

---

## Why This Combination Works
The combination of **React 19 + Vite** on the frontend and **Spring Boot 4 + MySQL** on the backend represents an industry-standard, highly productive enterprise stack. 
- **React** allows for a highly interactive, component-driven SPA, while **Vite** provides lightning-fast HMR and optimized builds.
- **Spring Boot** provides robust, type-safe business logic execution with built-in patterns for security (Spring Security), data access (Spring Data JPA), and API validation.
- **Redis** bridges the gap for stateless horizontally scalable architectures by providing lightning-fast token caching and blacklisting.
- Externalizing file storage to **Cloudinary** and communications to **Twilio/Gmail** prevents the backend from being bogged down by non-core I/O tasks.

---

## Backend (`insurance-policy-claim-management-system`)

| Area | Technology | Version | Plain-English Rationale |
|---|---|---|---|
| **Language** | Java | 17 | Enterprise standard LTS. Offers records and pattern matching for cleaner DTOs. |
| **Framework** | Spring Boot | 4.0.6 | Provides auto-configuration, dependency injection, and a production-ready REST environment out-of-the-box. |
| **Security** | Spring Security | BOM | Manages filter chains, CORS, CSRF, and RBAC seamlessly. |
| **JWT** | jjwt | 0.12.6 | Generates and validates cryptographically signed HS256 access tokens. |
| **ORM** | Spring Data JPA / Hibernate | BOM | Abstracts SQL away into Java interfaces, handling transactions and relationships automatically. |
| **Rate Limiting** | Bucket4j | 8.10.1 | Token-bucket algorithm to prevent brute-force attacks on OTP and login endpoints. |
| **Mapping** | ModelMapper | 3.2.0 | Automatically maps database Entities to API DTOs, keeping the codebase clean. |
| **OpenAPI** | springdoc-openapi | 3.0.2 | Auto-generates interactive Swagger UI documentation directly from the code. |
| **Cloud Storage** | Cloudinary HTTP SDK | 1.39.0 | Offloads heavy image/PDF claim document storage to a CDN. |
| **SMS/Email** | Twilio SDK / Spring Mail | 11.0.0 / BOM | Handles out-of-band dual OTP verification reliably. |

---

## Frontend (`insurance-policy-claim-management-app-ui`)

| Area | Technology | Version | Plain-English Rationale |
|---|---|---|---|
| **UI Library** | React | 19 | The industry leader for declarative, component-based UIs. |
| **Build Tool** | Vite | 8 | Vastly outperforms Webpack for dev server start times and module replacement. |
| **Router** | React Router | 7 | Manages client-side routing and enables role-based Route Guards (`ProtectedRoute`). |
| **Styling** | Bootstrap | 5.3 | Provides a responsive, accessible grid and UI components with custom CSS variable theming. |
| **HTTP Client** | Axios | 1.18.0 | Enables interceptors to seamlessly attach JWTs and automatically refresh tokens on 401 errors. |
| **Forms** | react-hook-form | 7.80.0 | Manages complex form state (like quoting) without triggering unnecessary re-renders. |
| **PDF Export** | jsPDF + autotable | 4.2.1 / 5.0.8 | Generates downloadable policy and claim receipts directly in the browser. |
| **Math** | big.js | 7.0.1 | Prevents dangerous floating-point math errors when calculating exact insurance premiums. |

---

## Data & Infrastructure

| Item | Value | Rationale |
|---|---|---|
| **Database** | MySQL 8 | Rock-solid relational data integrity for financial/insurance records. (`insurance_db`) |
| **Token Cache** | Redis | Enables fast, stateful blacklisting of JWTs and tracking of refresh token families. |
| **Backend Port** | `8081` | Standardized internal API port, avoiding typical 8080 conflicts. |
| **Frontend Port** | `5173` | Vite's default dev port; proxies `/api` calls directly to `8081` to avoid CORS in dev. |

---

## Configuration & Secrets
No secrets are committed to the repository.
- **Backend**: Uses `env.properties` (gitignored), imported via `spring.config.import=file:env.properties`. Holds DB credentials, JWT key, Cloudinary, and Twilio secrets. 
- **Frontend**: Uses standard `.env`, `.env.development`, `.env.production` (gitignored). A `.env.example` is committed for reference.

---

## Related Documents
- Architecture Deep Dive → `Architecture_Overview.md`
- Dependency & Build details → `../11_Developer_Guide/Build.md`
- Setup Instructions → `../11_Developer_Guide/Setup.md`

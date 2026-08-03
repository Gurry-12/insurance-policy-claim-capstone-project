# Tech Stack

> Technologies, versions, and rationale. Authoritative source of truth for
> versions — keep in sync with `pom.xml` and `package.json`.

## Purpose

One place that states exactly what the project is built with and why, verified
against the build files.

## Backend — `insurance-policy-claim-management-system`

| Area | Technology | Version | Why |
|---|---|---|---|
| Language | Java | 17 | LTS, records/pattern features, wide ecosystem |
| Framework | Spring Boot | 4.0.6 | Production-grade REST + DI + configuration |
| Security | Spring Security | (Spring Boot BOM) | Authentication & authorization |
| JWT | jjwt (api/impl/jackson) | 0.12.6 | Signed HS256 access tokens + claims API |
| ORM | Spring Data JPA / Hibernate | (Spring Boot BOM) | Entity model, repositories, transactions |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) | — | DTO-level constraints |
| Rate limiting | Bucket4j | 8.10.1 | Token-bucket rate limiting on auth endpoints |
| Mapping | ModelMapper | 3.2.0 | Entity ↔ DTO mapping |
| DB driver | mysql-connector-j | (Spring Boot BOM) | MySQL connectivity |
| OpenAPI | springdoc-openapi-starter-webmvc-ui | 3.0.2 | Swagger UI + `/v3/api-docs` |
| Cloud storage | cloudinary-http44 | 1.39.0 | Claim document upload |
| SMS | Twilio SDK | 11.0.0 | Phone OTP delivery |
| Email | Spring Boot Starter Mail | (Spring Boot BOM) | Email OTP + password-reset mail |
| Boilerplate | Lombok | (Spring Boot BOM) | Reduces entity/DTO boilerplate |
| Testing | Spring Boot Starter Test / Security / Validation / Data JPA / WebMVC Test | — | Integration tests |
| Build | Maven (Spring Boot parent) | — | Reproducible builds |

## Frontend — `insurance-policy-claim-management-app-ui`

| Area | Technology | Version | Why |
|---|---|---|---|
| Language | JavaScript (ESM) | — | Vite-native |
| UI library | React | 19.2.6 | Component model, hooks ecosystem |
| Build tool | Vite | 8.0.12 | Fast dev server + proxy + production build |
| Router | React Router | 7.18.0 | Declarative routing + guards |
| Styling | Bootstrap | 5.3.8 | Responsive design system + CSS variables theming |
| Icons | bootstrap-icons / lucide-react | 1.13.1 / 1.21.0 | UI iconography |
| HTTP | Axios | 1.18.0 | Interceptors (auth header, refresh-on-401) |
| Forms | react-hook-form | 7.80.0 | Performant form state + validation |
| Toasts | react-hot-toast | 2.6.0 | Notifications |
| Motion | Framer Motion | 12.42.2 | Page/UI transitions |
| PDF export | jsPDF + jspdf-autotable | 4.2.1 / 5.0.8 | Policy/payment/claim PDFs |
| Dates | date-fns | 4.4.0 | Date formatting/validation |
| Math | big.js | 7.0.1 | Decimal-safe premium arithmetic |
| Tokens | jwt-decode | 4.0.0 | Decode JWT payload client-side |
| Progress | nprogress | 0.2.0 | Request progress bar |
| Linting | ESLint (flat config) + plugins | 10.3.0 | Code quality |

## Data & Infrastructure

| Item | Value |
|---|---|
| Database | MySQL 8, schema `insurance_db`, `ddl-auto=update` |
| Backend port | `8081` (API under `/api`) |
| Frontend dev port | `5173` (Vite proxies `/api` → `8081`) |
| Cloudinary | Claim document storage |
| Twilio | SMS OTP |
| Gmail SMTP | Email OTP / password reset |

## Configuration & Secrets

- Backend: `env.properties` (gitignored) imported via
  `spring.config.import=file:env.properties` — holds DB credentials, JWT key,
  Cloudinary, email, Twilio secrets. Template: see `11_Developer_Guide/Environment.md`.
- Frontend: `.env`, `.env.development`, `.env.production` (gitignored);
  committed template `.env.example`. See `11_Developer_Guide/Environment.md`.

## Related

- Dependency audit notes → `../11_Developer_Guide/Build.md`
- Why each backend pattern was chosen → `../07_Design_Patterns/`
- Evaluation framing → `../10_Evaluation/Project_Summary.md`

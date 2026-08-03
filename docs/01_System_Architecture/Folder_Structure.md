# Folder Structure

> Repository and package layout, with the responsibility of each folder.

## Purpose

Map the repo so a contributor knows exactly where to look. Backend package
details are in `../06_Backend/Package_Structure.md`; this file covers the repo
as a whole.

## Repository Root

```
capstone-project/
├── docs/                        # Documentation — single source of truth (this tree)
├── demo-data/                   # Demo deliverables
│   ├── sql/                     #   Seed scripts (users, catalog, policies/claims)
│   ├── api-test-payloads/       #   Markdown request bodies per API group
│   ├── 03-testing-flow.md       #   curl end-to-end walkthrough
│   └── 04-evaluator-demo.md     #   evaluator display data & demo guide
├── screenshots/                 # UI screenshots by role (admin/, staff/, customer/, auth/)
├── insurance-policy-claim-management-system/   # Spring Boot backend (module)
├── insurance-policy-claim-management-app-ui/   # React frontend (module)
├── CHANGELOG.md                 # Project changelog
└── README.md                    # Repo landing page
```

## Backend module

```
insurance-policy-claim-management-system/
├── src/main/java/com/insurance/demo/
│   ├── controller/        # REST controllers (request entry, response wrapping)
│   ├── service/           # Service interfaces + strategy package
│   │   └── strategy/      #   PremiumCalculator + implementations + factory
│   ├── serviceimpl/       # Service implementations (business rules, transactions)
│   ├── repository/        # Spring Data JPA repositories
│   ├── model/             # JPA entities (16)
│   ├── dto/
│   │   ├── request/       # Request DTOs (validated)
│   │   └── response/      # Response DTOs + wrappers (ApiResponseDTO, PageResponseDTO…)
│   ├── enums/             # Enums stored as STRING in DB
│   ├── config/            # SecurityConfig, RateLimitFilter, DataInitializer, CORS, beans…
│   ├── security/          # JwtService, RefreshTokenService, filters, user details
│   ├── verification/      # OtpService, EmailService, SmsService, OtpAttemptRecorder
│   ├── exception/         # Custom exceptions
│   └── util/              # Number/transaction generators, pagination validator, messages
├── src/main/resources/
│   ├── application.properties
│   └── env.properties     # GITIGNORED secrets (DB, JWT, Cloudinary, email, Twilio)
├── src/test/java/com/insurance/demo/     # Integration tests (JWT, refresh token)
├── src/test/resources/    # application-test.properties
├── postman/               # Postman collection + scenario guides
└── pom.xml
```

## Frontend module

```
insurance-policy-claim-management-app-ui/
├── src/
│   ├── main.jsx           # App bootstrap, providers
│   ├── App.jsx            # ALL routes + guard components + global handlers
│   ├── index.css          # Design system: CSS variables, themes, role accents
│   ├── api/               # axiosInstance, tokenStore, apiAdapter, apiTypes
│   ├── services/          # Per-resource API service modules (auth, product, plan, …)
│   ├── context/           # AuthContext, ThemeContext
│   ├── hooks/             # useApiTable, useApiForm, usePagination, PDF hooks, …
│   ├── utils/             # formatters, validators, constants, error handler, options, roles…
│   ├── common/            # Shared single-purpose components (e.g. BentoCard)
│   ├── components/        # layouts/, navigation/, ui/, forms/, tables/, modals/,
│   │                      # cards/, claims/, dashboard/, auth/, admin/, customer/, common/
│   └── pages/             # pages per role: auth/, admin/, staff/, customer/, shared/, css/
├── public/                # favicon, icons
├── .env                   # GITIGNORED local env (VITE_API_BASE_URL, proxy target, CSP)
├── vite.config.js         # Dev server + /api proxy → 8081
└── package.json
```

## Legacy folders (removed)

`imp-doc/` and the old flat `docs/` contents were consolidated into this tree.
`insurance-policy-claim-management-system/HELP.md` (Spring Initializr boilerplate)
and the UI boilerplate `README.md` were removed. See `../CONTRIBUTING.md` and the
`CHANGELOG.md` entry for the reorganization.

## Related

- `../06_Backend/Package_Structure.md` — class-level backend map
- `../05_Frontend/Component_Architecture.md` — component/page inventory
- `../11_Developer_Guide/Setup.md` — prerequisites and install

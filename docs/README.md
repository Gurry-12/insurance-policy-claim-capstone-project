# InsuranceFlow — Documentation Hub

Full documentation for the **InsuranceFlow** capstone project — a full-stack
insurance policy & claim management system.

| Module | Repo folder |
|---|---|
| Backend (Spring Boot) | `insurance-policy-claim-management-system/` |
| Frontend (React + Vite) | `insurance-policy-claim-management-app-ui/` |
| Docs | this `docs/` tree |
| Demo data | `demo-data/` |

## How to read this documentation

Pick your audience:

**1. Evaluator / reviewer — quick, high-signal**
- `10_Evaluation/Project_Summary.md` — one-page summary
- `10_Evaluation/Features_Checklist.md` + `Business_Rules_Checklist.md` +
  `API_Checklist.md` — verify everything, fast
- `00_Project_Overview/` — vision, features, tech stack, architecture overview
- `09_Diagrams/` — Mermaid sequence / class / ER / activity / flowcharts
- `demo-data/04-evaluator-demo.md` — exact credentials + screens to show

**2. Interviewer / panel — deep-dive questions**
- `10_Evaluation/Interview_Questions.md` — Q&A across architecture, security,
  DB, frontend, business logic, ops, behavioral
- Follow links into `02_Business_Domain/`, `03_API/`, `04_Database/`,
  `05_Frontend/`, `07_Design_Patterns/` for supporting depth

**3. Developer — run, understand, extend**
- `11_Developer_Guide/Setup.md` → `Run.md` → `Build.md` → `Environment.md`
- `01_System_Architecture/` — system, backend, frontend, security, high-level
- `03_API/`, `04_Database/`, `06_Backend/`, `08_Workflows/`
- `12_Knowledge_Base/` — 34 concept cards (per-topic detail)
- `11_Developer_Guide/Troubleshooting.md` — when things break

## Folder index

| Folder | Contents |
|---|---|
| `00_Project_Overview/` | README, Vision, Features, Tech_Stack, Architecture_Overview |
| `01_System_Architecture/` | High-level, backend, frontend, security, data, folder structure |
| `02_Business_Domain/` | Insurance domain, rules, product/policy/claim workflows, premium, pricing, coverage, duration, payment |
| `03_API/` | Auth/Product/Plan/Pricing/Policy/Claim/Payment APIs + API flow |
| `04_Database/` | ER summary, schema, entities, data flow, seed data |
| `05_Frontend/` | Routing, layout, state, hooks, components, guards, API integration, UI workflows |
| `06_Backend/` | Controllers, services, DTOs, JWT, security, validation, exceptions, repositories, package structure, premium service, performance, caching, logging |
| `07_Design_Patterns/` | Strategy, Factory, Adapter, Builder, Dependency Injection, SOLID, Decision Records |
| `08_Workflows/` | End-to-end flows (register, quote, purchase, pay, claim, admin) |
| `09_Diagrams/` | Mermaid sequence/class/ER/activity/flowcharts |
| `10_Evaluation/` | Summary, checklists, interview Q&A, roadmap |
| `11_Developer_Guide/` | Setup, Run, Build, Environment, Deployment, Troubleshooting |
| `12_Knowledge_Base/` | 34 concept cards (backend/domain + frontend/patterns) |

## Standards

- `CONTRIBUTING.md` defines the mandatory doc template, the knowledge-card
  template, the single-source-of-truth map, and the **code-verified Fact Sheet**
  every doc must agree with.
- Prefer linking across this tree over duplicating content; each topic has one
  authoritative file.

## Quick facts (verify against code before trusting stale sources)

- Backend: Spring Boot 4.0.6 / Java 17 on port **8081**
- Frontend: React 19.2.6 / Vite on port **5173**
- DB: MySQL `insurance_db`, `ddl-auto=update`, 16 entities / 17 tables
- Seed admin: `admin@insurance.com` / `Admin@123`
- Access token default 15 min (60 s in the committed local override)

## Related

- Root `../README.md` — repository overview
- `../demo-data/` — SQL, testing flows, evaluator demo
- `../CHANGELOG.md` — history

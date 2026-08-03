# Project Overview

> The single entry point that explains what this project is, who it is for, and
> why it exists.

## Purpose

Onboard anyone — a recruiter, an interviewer, or a new developer — to the
**InsuranceFlow** insurance policy and claim management system. This folder is
the first thing to read; everything else in `docs/` is reachable from here.

## Overview

InsuranceFlow is a full-stack web application for an insurance company that lets
customers browse insurance products, get instant premium quotes, purchase
policies, pay premiums, and raise & track claims — while giving internal staff a
queued claim-review workflow and admins full control over the catalog, pricing,
users, and final claim decisions.

- **Backend:** Spring Boot 4.0.6 REST API (Java 17) + MySQL 8
- **Frontend:** React 19 SPA (Vite 8, React Router 7, Bootstrap 5)
- **Roles:** `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`

## What's in this folder

| File | Content |
|---|---|
| `README.md` | This index |
| `Vision.md` | Business problem, goals, and success criteria |
| `Features.md` | Feature catalogue grouped by role |
| `Tech_Stack.md` | Technologies, versions, and why each was chosen |
| `Architecture_Overview.md` | 5-minute architecture summary (see also `01_System_Architecture/`) |

## Where to go next

| You want to… | Go to |
|---|---|
| Understand the system in 10 minutes | `../01_System_Architecture/High_Level_Architecture.md` |
| Evaluate the project / interview prep | `../10_Evaluation/Project_Summary.md` |
| Run it locally | `../11_Developer_Guide/Setup.md` |
| See every feature per role | `Features.md` |
| See the demo seed data & walkthrough | `../../demo-data/04-evaluator-demo.md` |

## Repository layout (top level)

```
capstone-project/
├── docs/                                  # THIS documentation (single source of truth)
├── demo-data/                             # Seed SQL + API test payloads + demo guides
├── screenshots/                           # UI screenshots by role
├── insurance-policy-claim-management-system/     # Spring Boot backend
├── insurance-policy-claim-management-app-ui/     # React frontend
├── CHANGELOG.md                           # Project changelog
└── README.md                              # Repo landing page
```

## Related

- `../CONTRIBUTING.md` — documentation standards and fact sheet
- `../12_Knowledge_Base/` — concept reference cards

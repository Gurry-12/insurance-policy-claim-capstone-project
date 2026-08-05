# Project Overview

> The single entry point that explains what this project is, who it is for, and why it exists.

---

## Purpose
Onboard anyone — a recruiter, an interviewer, or a new developer — to the **InsuranceFlow** insurance policy and claim management system. This folder is the first thing to read; everything else in `docs/` is reachable from here.

---

## Overview
InsuranceFlow is a full-stack web application for an insurance company that lets customers browse insurance products, get instant premium quotes, purchase policies, pay premiums, and raise & track claims — while giving internal staff a queued claim-review workflow and admins full control over the catalog, pricing, users, and final claim decisions.

- **Backend:** Spring Boot 4.0.6 REST API (Java 17) + MySQL 8 + Redis
- **Frontend:** React 19 SPA (Vite 8, React Router 7, Bootstrap 5.3)
- **Roles:** `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER`

---

## Business Context
Modern insurance providers need a seamless, digital-first approach to sell policies and process claims. Manual paperwork, phone-based quoting, and opaque claim resolutions cost companies money and damage customer trust. InsuranceFlow exists to digitize the entire lifecycle of an insurance policy—from instant programmatic quoting to verifiable, trackable claim decisions—providing a superior self-service customer experience and an efficient workspace for internal staff.

---

## Folder Contents

| File | Content |
|---|---|
| `README.md` | This index. |
| `Vision.md` | Business problem, goals, non-goals, and major design decisions. |
| `Features.md` | Feature catalogue grouped by role and visualized as a user journey. |
| `Tech_Stack.md` | Technologies, versions, and plain-English architectural rationale. |
| `Architecture_Overview.md` | 5-minute architecture summary with diagrams and security posture. |

---

## Where to Go Next

| You want to… | Go to |
|---|---|
| Understand the system in 10 minutes | `Architecture_Overview.md` |
| Evaluate the project / interview prep | `../10_Evaluation/Project_Summary.md` |
| Run it locally | `../11_Developer_Guide/Setup.md` |
| See every feature per role | `Features.md` |
| See the demo seed data & walkthrough | `../../demo-data/04-evaluator-demo.md` |

---

## Related Documents
- `../CONTRIBUTING.md` — Documentation standards and fact sheet.
- `../12_Knowledge_Base/` — Concept reference cards.

# Architecture Overview

This section contains comprehensive documentation, structural diagrams, and behavioral models of the Insurance Policy Claim Management System backend.

## 🗂️ Documentation Index

*   [System Architecture & Design Patterns](system_architecture.md) — Tech stack, architectural layers, directory layouts, and design patterns.
*   [UML Class Diagrams](class_diagrams.md) — Comprehensive structural breakdown of entities, controllers, services, repositories, DTOs, security, and handlers.
*   [UML Sequence Diagrams](sequence_diagrams.md) — Execution traces of security, authentication, policies, payments, and claims lifecycles.
*   [UML Flow Diagrams](flow_diagrams.md) — Control flow charts, validation lifecycle, response schemas, and Cloudinary upload flows.
*   [Entity Relationship & Database Schema Diagrams](er_diagrams.md) — Entity maps, schema declarations, tables, and foreign keys.
*   [Spring Boot Security & Filter Chain Architectures](security_diagrams.md) — JWT validation, RBAC, access boundaries, and Web Security Filter Chains.
*   [Request-Response Lifecycle Engine](request_lifecycle.md) — Step-by-step request tracking from client connection to JSON representation.
*   [Domain-Driven Business Workflows](business_workflows.md) — User, product, policy, payment, and claim state machines.
*   [Package Dependency Matrix](package_dependency.md) — Clean Architecture layers, packages, and dependency directional mappings.

---

## 🔍 Validation & Implementation Audit

All diagrams, schemas, and flows documented within this package have been validated against the actual codebase located in the `/src` tree. 

### Key Discoveries & Updates:
1. **deadlock in Claim Assignment**: Found and resolved a status sequence deadlock where `assignStaff` required the claim to already be `UNDER_REVIEW` but `underReviewClaim` required it to be in `SUBMITTED` state without any assignee. The flow was corrected so that staff can assign themselves to `SUBMITTED` claims first, then transition them to `UNDER_REVIEW`.
2. **Base64 Authentication Flow**: Aligned the authentication sequence diagrams to show how Base64-encoded password payloads transmitted from the React/btoa frontend are decoded at the REST controllers before passing them to BCrypt matching or encoding.
3. **Staff Speciality Scoping**: Verified that all listing, updating, recording, and transition endpoints for Policies, Claims, and Payments enforce the `ProductType` speciality check matching the active `INTERNAL_STAFF` context.

# Role Based Access

## What It Is
- The access-control model built on three roles: `ROLE_ADMIN`, `ROLE_INTERNAL_STAFF`, `ROLE_CUSTOMER` (enum `Role`).
- Roles are stored as strings on `AppUser` (`@Enumerated(EnumType.STRING)`) and exposed to Spring Security as authorities through `AppUserDetails`.
- Access rules are expressed both as URL matchers (`hasRole` / `hasAnyRole`) and as service-layer branch logic (`isCustomer`, `isStaff`, `hasRole("ADMIN")`).

## Why It Is Used
- Clear separation of duties: customers manage their own policies/claims/payments; internal staff process cases matching their speciality; the admin makes final decisions and manages catalog data.
- Matches the business workflow documented in the domain rules (e.g., only admin may record the final claim decision).
- Centralizes the role matrix in `SecurityConfig` while the service layer handles per-record checks.

## Where It Is Used in This Project
- `enums/Role.java`: the three role constants.
- `config/SecurityConfig.java`: e.g. `POST /api/policies/purchase` → `ROLE_CUSTOMER`, `PATCH /api/claims/*/review` → `ROLE_INTERNAL_STAFF`, `PATCH /api/claims/*/final-decision` → `ROLE_ADMIN`, `/api/admin/**` → `ROLE_ADMIN`.
- `security/AppUserDetails.java` + `security/CustomUserDetailsService.java`: convert the stored role into Spring `GrantedAuthority`s.
- `serviceimpl/AuthServiceImpl.java`: registration always assigns `ROLE_CUSTOMER`.
- `config/DataInitializer.java`: seeds the admin (`admin@insurance.com`) when `app.security.seed-admin.enabled=true`.
- `serviceimpl/ClaimServiceImpl.java`, `PolicyServiceImpl.java`, `PremiumPaymentServiceImpl.java`: role-specific behavior for staff and customers.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/Role.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/security/AppUserDetails.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/DataInitializer.java

## Related Docs
- ../01_System_Architecture/Security_Architecture.md
- ../06_Backend/Security.md
- ../02_Business_Domain/Business_Rules.md
- ../04_Database/Table_Descriptions.md

## Common Interview Questions
1. How is a role turned into a Spring authority? — `CustomUserDetailsService` loads the user and `AppUserDetails.getAuthorities()` returns a single `SimpleGrantedAuthority` derived from the `Role` enum.
2. What can a customer not do? — Customers cannot manage the catalog, review claims, or make final decisions; they are restricted to their own data via URL matchers and ownership checks.
3. How is the seeded admin created? — `DataInitializer` creates the `admin@insurance.com` account when `app.security.seed-admin.enabled` is true.
4. How are staff scoped beyond their role? — Each staff user has a `StaffSpeciality` (`ProductType`); the service layer rejects operations on products outside that speciality.
5. Why store roles as `STRING` rather than ordinal? — String persistence is readable and stable if new roles are inserted; ordinals break when the enum order changes.

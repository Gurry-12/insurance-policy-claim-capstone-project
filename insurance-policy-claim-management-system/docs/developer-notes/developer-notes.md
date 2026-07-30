# Developer Notes

## Purpose

This document contains "gotchas", internal mechanics, and step-by-step guides for developers actively modifying the Insurance Policy Claim Management System.

---

## Gotcha: SecurityContext and Email

The system uses the user's `email` as the `Principal` name in the JWT.

```java
// To get the currently logged in user's email:
String email = SecurityContextHolder.getContext().getAuthentication().getName();
```

**Warning:** Do not assume `getName()` returns a username or ID. It returns the exact string from the JWT `sub` (subject) claim, which is the email address.

---

## Gotcha: Staff Speciality

When writing logic for `INTERNAL_STAFF`, you MUST ALWAYS check their speciality.

```java
// Get the current user's speciality from DB
ProductType staffSpeciality = currentUser.getStaffSpeciality() != null 
    ? currentUser.getStaffSpeciality().getProductSpeciality() 
    : null;

// Compare with the product type of the resource
ProductType resourceType = ...; 

if (staffSpeciality == null || !staffSpeciality.equals(resourceType)) {
    throw new AccessDeniedException(MessageConstants.Security.STAFF_SPECIALITY_ACCESS_DENIED);
}
```
**Consequence of forgetting:** A health insurance clerk might approve a vehicle insurance claim.

---

## Gotcha: Optimistic Locking (`@Version`)

The `Policy` and `Claim` entities have a `@Version Long version` field.
This field is managed entirely by Hibernate.

**Do NOT:**
- Add `version` to Request DTOs
- Add `version` to Response DTOs
- Manually increment or set `version`

**What you must handle:**
If a concurrent update happens, a `ObjectOptimisticLockingFailureException` is thrown. The `GlobalExceptionHandler` turns this into a 409 Conflict. Ensure your frontend can handle 409s gracefully (e.g., "The record was updated by someone else. Please refresh.").

---

## Guide: How to Add a New Entity

1. Create the entity class in `model/`.
2. Add JPA annotations (`@Entity`, `@Table`, `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)`).
3. If it links to another entity, use `@ManyToOne(fetch = FetchType.LAZY)`.
4. Create a repository interface extending `JpaRepository<NewEntity, Long>`.
5. (Optional) Extend `JpaSpecificationExecutor` if you need complex dynamic filtering.
6. The table will be automatically created on the next Spring Boot startup because of `spring.jpa.hibernate.ddl-auto=update`.

---

## Guide: How to Add a New Status

Let's say business wants a `PARTIALLY_APPROVED` claim status.

1. Add it to `enums/ClaimStatus.java`.
2. Update `ClaimServiceImpl` wherever status validation happens (e.g., final decision logic).
3. Update `ClaimRepository` if there are queries explicitly checking statuses.
4. **No DB migration needed:** Enums are stored as `VARCHAR` via `@Enumerated(EnumType.STRING)`.

---

## Guide: How to Add a New API Endpoint

1. **DTO:** Create Request/Response DTOs in `dto/` packages. Add `@Valid` annotations.
2. **Controller:** Add mapping (`@GetMapping`, `@PostMapping`), set `@PreAuthorize` rules.
3. **Service Interface:** Define the method signature.
4. **Service Impl:** Implement logic. Add `@Transactional` if modifying DB. Perform ownership/speciality checks.
5. **Constants:** Add any new error/success messages to `MessageConstants.java`.

---

## Known Missing Features (Not Implemented)

If you are picking up this project, these are known gaps that may need implementation:

1. **Policy Auto-Expiry:** There is no cron job/scheduler that automatically changes a policy status to `EXPIRED` when `endDate < today`.
2. **Admin Initialization:** No boot script exists to insert the first Admin user. Must be done via SQL script currently.
3. **Database Migrations:** The project relies on Hibernate's `ddl-auto=update`. For a true production setup, this should be replaced with **Flyway** or **Liquibase**.
4. **OTP Cleanup:** The `otp_verifications` table grows indefinitely. Needs a scheduled job to delete expired/used OTPs older than X days.
5. **Soft Deletes:** Deleting products/plans cascades to children. A true soft-delete mechanism (`@SQLDelete`) might be preferable for audit preservation.

---

## Safe Database Modification (DDL Update)

Because `ddl-auto=update` is used:
- Adding columns/tables is safe.
- Renaming a column will create a NEW column and leave the old one (data must be manually migrated).
- Deleting a column in Java does NOT delete it in the DB.
- Changing column types might fail depending on the dialect.

**Rule of thumb:** If you rename a field, be prepared to drop and recreate the local database or manually write `ALTER TABLE` statements.

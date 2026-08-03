# Validation

## Purpose

This document is the single source of truth for input validation: the bean-validation annotations applied to every request DTO, the exact regex patterns, and the service-level business-rule checks that sit outside bean validation. Error aggregation behavior is defined in Exception_Handling.md; this document focuses on what is validated and where.

## Overview

Two complementary layers guard all writes: declarative bean validation (`jakarta.validation` annotations evaluated by `@Valid` in controllers) for structural/format rules, and service-side checks in the `serviceimpl` classes for rules that need database context (existence, status, amounts relative to the plan). Bean validation failures produce `ValidationErrorResponseDTO`; service rule failures throw domain exceptions and produce `ErrorResponseDTO`.

## Business Context

Format rules (email shape, mobile E.164 pattern, PIN code, password strength, letters-and-spaces names) are identical across resources, so they are centralized in `MessageConstants.Validation` and referenced by every DTO. This guarantees the front end receives the same message text regardless of which endpoint rejects a value. Amount and duration positivity rules protect the premium calculation engine from nonsensical inputs before they reach the calculator.

## Technical Design

### Shared regexes and constants

| Rule | Pattern | Message constant |
| --- | --- | --- |
| Letters and spaces only (names, city, state, nominee fields, product name) | `^[a-zA-Z\s]*$` | `LETTERS_SPACES_ONLY` |
| Password strength | `^(?=.*[A-Za-z])(?=.*\d).{8,64}$` | `PASSWORD_PATTERN` |
| Mobile (E.164) | `^\+[1-9]\d{7,14}$` | `MOBILE_PATTERN` |
| PIN code | `^[1-9][0-9]{5}$` | `PIN_CODE_VALID` |

Password strength requires at least one letter and one digit, 8-64 characters. Note: `CreateStaffRequestDTO` currently validates password as `@NotBlank` only (the stronger pattern is commented out).

### Bean-validation rules per DTO

| DTO | Annotations |
| --- | --- |
| `LoginRequestDTO` | `@Email` + `@NotBlank` email, `@NotBlank` password |
| `VerifyOtpRequest` | `@Email` + `@NotBlank` email, `@NotBlank` emailOtp, `@NotBlank` phoneOtp |
| `ResendOtpRequestDTO` | `@Email` + `@NotBlank` email, `@NotBlank` phone |
| `ForgotPasswordRequestDTO` | `@Email` + `@NotBlank` email |
| `ResetPasswordRequestDTO` | `@Email` + `@NotBlank` email, `@NotBlank` emailOtp, `@NotBlank` phoneOtp, `@NotBlank` + `@Pattern(PASSWORD_PATTERN)` newPassword |
| `UserRequestDTO` | `@Pattern(LETTERS_SPACES_ONLY)` + `@NotBlank` + `@Size(2..100)` fullName, `@Email` + `@NotBlank` email, `@NotBlank` + `@Pattern(MOBILE_PATTERN)` mobileNumber, `@NotBlank` + `@Pattern(PASSWORD_PATTERN)` password |
| `CreateStaffRequestDTO` | fullName (letters + `@Size(2..100)`), email, `@NotBlank` password (pattern commented out), `@Pattern(MOBILE_PATTERN)` mobileNumber, `@NotNull` productSpeciality |
| `UserStatusUpdateRequestDTO` | `@NotNull` isActive, `@NotBlank` remarks |
| `CustomerRequestDTO` | `@Past` dateOfBirth, `@NotBlank` address, city/state/nomineeName/nomineeRelation with `@Pattern(LETTERS_SPACES_ONLY)` + `@NotBlank`, `@Pattern(PIN_CODE_VALID)` pinCode |
| `ProductRequestDTO` | `@Pattern(LETTERS_SPACES_ONLY)` + `@NotBlank` productName, `@NotNull` productType, `@NotBlank` description, `@NotNull` activeStatus |
| `InsuranceRequestDTO` | `@Pattern(LETTERS_SPACES_ONLY)` + `@NotBlank` productName, `@NotBlank` productType, `@NotBlank` description |
| `PlanRequestDTO` | `@NotNull` productId, `@Pattern(LETTERS_SPACES_ONLY)` + `@NotBlank` planName, `@NotNull` allowedDurations, `@NotNull` supportedPremiumType, `@NotBlank` termsAndConditions, `@NotNull` activeStatus |
| `CoverageOptionRequestDTO` | `@NotNull` + `@Positive` coverageAmount, `@NotBlank` label, `@NotNull` displayOrder, `@NotNull` activeStatus |
| `CoverageRegenerationRequestDTO` | `@NotNull` + `@Positive` minCoverage, maxCoverage, incrementStep |
| `PlanWizardRequestDTO` | `@Valid` on all three members; `@NotNull` planDetails and pricingRule; `@NotEmpty` coverageOptions |
| `PricingRuleRequestDTO` | `@PositiveOrZero` baseRiskRate, processingFee, gst; other fields optional |
| `PricingPreviewRequestDTO` | `@NotNull` productId, `@NotNull` + `@Positive` coverageAmount, `@NotNull` + `@Positive` duration, `@NotNull` premiumType, `@NotNull` pricingRuleId |
| `PolicyPurchaseRequestDTO` | `@NotNull` quoteId; paymentReferenceId optional |
| `PolicyIssueRequestDTO` | `@NotNull` customerId, `@NotNull` quoteId, `@NotNull` + `@PastOrPresent` startDate |
| `PaymentRequestDTO` | `@Positive` amount, `@NotNull` paymentMode; policyId and paymentStatus currently unannotated |
| `ClaimRequestDTO` | `@NotNull` policyId, `@NotNull` + `@Positive` claimAmount, `@NotBlank` claimReason, `@NotNull` incidentDate |
| `ClaimReviewRequestDTO` | `@NotNull` recommendedStatus; remarks optional |
| `ClaimDocumentRequestDTO` | `@NotBlank` documentName, `@NotBlank` documentType; documentReference optional |
| `PremiumCalculationRequest` | `@NotNull` planId, `@NotNull` + `@Positive` coverageAmount, `@NotNull` + `@Positive` duration, `@NotNull` premiumType |
| `AdminPremiumCalculationRequest` | `@NotNull` customerId, `@NotNull` planId, `@NotNull` + `@Positive` coverageAmount, `@NotNull` + `@Positive` duration, `@NotNull` premiumType |
| `QuotePurchaseRequest` | `@NotNull` quoteId |

### Service-level rule checks (beyond bean validation)

| Check | Enforced in | Failure type |
| --- | --- | --- |
| Plan exists and is active, and its product is active | `PremiumCalculationServiceImpl`, `PolicyServiceImpl` | `IllegalArgumentException` (400) / not-found |
| Coverage amount exactly matches an active coverage option of the plan | `PremiumCalculationServiceImpl` | `IllegalArgumentException` (400) |
| Duration in the plan's allowed durations and premium type supported | `PremiumCalculationServiceImpl` | `IllegalArgumentException` (400) |
| At least one active pricing rule exists for the plan | `PremiumCalculationServiceImpl` | `BadRequestException` |
| No existing policy for the same plan in an active status | `PolicyServiceImpl` | `BadRequestException` |
| No existing policy for the same plan in an active status | `PolicyServiceImpl` | `BadRequestException` (via repository existence check) |
| Quote belongs to caller, is `CREATED`, and not expired | `PremiumCalculationServiceImpl` | `BadRequestException` |
| Payment success required before issuance | `PolicyServiceImpl` | `BadRequestException` |
| Claim amount within remaining coverage of the policy | `ClaimServiceImpl` | `BadRequestException` |
| Claim review requires an assigned staff member and valid status transition | `ClaimServiceImpl` | `BadRequestException` |
| Duplicate email/mobile uniqueness | `AuthServiceImpl` (registration), `UserServiceImpl` (staff) | `DuplicateResourceException` |

## Workflow

1. Spring validates the request DTO because the controller parameter is annotated `@Valid`; nested members are validated because they carry `@Valid`.
2. Failures are collected into the `fieldErrors` map by `GlobalExceptionHandler` and returned as `400 VALIDATION_FAILED`.
3. Passing the bean-validation stage, the service performs database-backed rule checks and throws domain exceptions when a rule is violated.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/` (all request DTOs with annotations)
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/PremiumCalculationRequest.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/AdminPremiumCalculationRequest.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/QuotePurchaseRequest.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/util/MessageConstants.java` (nested `Validation` constants)
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PremiumCalculationServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/PolicyServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/ClaimServiceImpl.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/exception/GlobalExceptionHandler.java`

Related: [Exception Handling](Exception_Handling.md), [DTOs](DTOs.md)

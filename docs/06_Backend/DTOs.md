# DTOs (Data Transfer Objects)

## Purpose

This document is the single source of truth for the DTO layer: the request DTOs, response DTOs, and wrapper types used by the REST API, with exact field lists. Field-level validation rules are summarized here and detailed in Validation.md; JSON-sensitive handling (which fields are excluded or conditionally included) is defined here because it is a DTO concern.

## Overview

DTOs live in `com.insurance.demo.dto` and its `request` / `response` subpackages. Request DTOs are written in; response DTOs are written out. The root `dto` package holds the calculation and quote payloads shared by the premium flow. No JPA entity is ever exposed directly; every outbound value passes through a response DTO, and the shared `ModelMapper` bean maps between entities and DTOs.

## Business Context

The DTO boundary is what keeps the HTTP contract stable while the domain model evolves. It also provides the security boundary: sensitive values such as the refresh token live in DTO fields marked `@JsonIgnore` so they can be handed to the controller (to be set as an HTTP-only cookie) without ever appearing in the JSON body. Conditional inclusion (`@JsonInclude(NON_NULL)`) prevents internal identifiers from leaking into payloads where they are not relevant, e.g. assigned-staff fields on a claim that has not been assigned.

## Technical Design

### Uniform wrappers

| DTO | Fields | Notes |
| --- | --- | --- |
| `ApiResponseDTO<T>` | `message`, `success`, `data`, `timeStamp` | Wrapper for every successful controller return |
| `PageResponseDTO<T>` | `content`, `pageNumber`, `pageSize`, `totalRecords`, `totalPages`, `lastPage`, `sortingType` | Pagination payload carried inside `ApiResponseDTO.data` |
| `ErrorResponseDTO` | `timestamp`, `statusCode`, `errorType`, `message`, `requestPath` | Uniform error body produced by the global handler |
| `ValidationErrorResponseDTO` | `timestamp`, `statusCode`, `errorType`, `message`, `requestPath`, `fieldErrors` | Error body plus `Map<String,String>` of per-field violations |

### Request DTOs (`dto/request`)

| DTO | Fields | Used by |
| --- | --- | --- |
| `LoginRequestDTO` | `email`, `password` | Auth login |
| `VerifyOtpRequest` | `email`, `emailOtp`, `phoneOtp` | Auth OTP verification |
| `ResendOtpRequestDTO` | `email`, `phone` | Auth OTP resend |
| `ForgotPasswordRequestDTO` | `email` | Auth forgot password |
| `ResetPasswordRequestDTO` | `email`, `emailOtp`, `phoneOtp`, `newPassword` | Auth reset password |
| `UserRequestDTO` | `fullName`, `email`, `password`, `mobileNumber` | Customer registration |
| `CreateStaffRequestDTO` | `fullName`, `email`, `password`, `mobileNumber`, `productSpeciality` | Admin staff creation |
| `UserStatusUpdateRequestDTO` | `isActive`, `remarks` | Admin user status change |
| `CustomerRequestDTO` | `dateOfBirth`, `address`, `city`, `state`, `pinCode`, `nomineeName`, `nomineeRelation` | Customer profile update |
| `ProductRequestDTO` | `productName`, `productType`, `description`, `activeStatus` | Product create/update |
| `InsuranceRequestDTO` | `productName`, `productType`, `description` | Product create/update (alternate payload) |
| `PlanRequestDTO` | `productId`, `planName`, `allowedDurations`, `supportedPremiumType`, `termsAndConditions`, `activeStatus` | Plan create/update |
| `CoverageOptionRequestDTO` | `coverageAmount`, `label`, `displayOrder`, `activeStatus` | Coverage option create/update |
| `CoverageRegenerationRequestDTO` | `minCoverage`, `maxCoverage`, `incrementStep` | Coverage option regeneration |
| `PlanWizardRequestDTO` | `planDetails` (`PlanRequestDTO`), `coverageOptions` (`List<CoverageOptionRequestDTO>`), `pricingRule` (`PricingRuleRequestDTO`) | Plan wizard (nested `@Valid`) |
| `PricingRuleRequestDTO` | `planId`, `baseRiskRate`, `processingFee`, `gst`, `effectiveFrom`, `effectiveTo`, `remarks` | Pricing rule create/update |
| `PricingPreviewRequestDTO` | `productId`, `coverageAmount`, `duration`, `premiumType`, `pricingRuleId` | Pricing preview |
| `PolicyPurchaseRequestDTO` | `quoteId`, `paymentReferenceId` | Policy purchase |
| `PolicyIssueRequestDTO` | `customerId`, `quoteId`, `startDate` | Policy issuance |
| `PaymentRequestDTO` | `policyId`, `amount`, `paymentMode`, `paymentStatus` | Premium payment |
| `ClaimRequestDTO` | `policyId`, `claimAmount`, `claimReason`, `incidentDate` | Claim filing |
| `ClaimReviewRequestDTO` | `recommendedStatus`, `remarks` | Claim review/recommendation |
| `ClaimDocumentRequestDTO` | `documentName`, `documentType`, `documentReference` | Claim document metadata |

### Calculation and quote payloads (`dto` root)

| DTO | Fields | Notes |
| --- | --- | --- |
| `PremiumCalculationRequest` | `planId`, `coverageAmount`, `duration`, `premiumType` | Authenticated customer quote request |
| `AdminPremiumCalculationRequest` | `customerId`, `planId`, `coverageAmount`, `duration`, `premiumType` | Admin quote generation for a customer |
| `QuotePurchaseRequest` | `quoteId` | Quote-to-policy purchase |
| `PremiumQuote` | `quoteId`, `selectedCoverage`, `duration`, `premiumType`, `basePremium`, `annualPremium`, `processingFee`, `gst`, `totalCommitment`, `discountPercentage`, `discountAmount`, `oneTimeDiscount`, `totalPremium`, `expiresAt`, `status` | Full premium quote breakdown; `@Builder`-generated |

### Response DTOs (`dto/response`)

| DTO | Fields | Notes |
| --- | --- | --- |
| `LoginResponseDTO` | `userId`, `fullName`, `email`, `role`, `token`, `tokenType`, `refreshToken` | `refreshToken` is `@JsonIgnore` (cookie only) |
| `RefreshResponseDTO` | `accessToken`, `tokenType`, `refreshToken` | `refreshToken` is `@JsonIgnore` (cookie only) |
| `ResendOtpResponseDTO` | `email`, `phone` | OTP resend confirmation |
| `PublicStatsResponseDTO` | `activeProducts`, `activePlans`, `totalPolicies`, `claimsProcessed` | Public portal statistics |
| `UserResponseDTO` | `id`, `fullName`, `email`, `mobileNumber`, `role`, `isActive`, `emailVerified`, `phoneVerified`, `createdDate`, `updatedDate`, `productSpeciality` | `productSpeciality` is `@JsonInclude(NON_NULL)` (staff only) |
| `CustomerResponseDTO` | `customerId`, `userId`, `fullName`, `email`, `mobileNumber`, `dateOfBirth`, `address`, `city`, `state`, `pinCode`, `nomineeName`, `nomineeRelation`, `createdDate` | Customer profile |
| `InsuranceResponseDTO` | `productId`, `productName`, `productType`, `description`, `isActive`, `createdDate` | Product detail |
| `ProductResponseDTO` | `productId`, `productName`, `productType`, `description`, `isActive`, `createdDate` | Product detail |
| `PlanResponseDTO` | `planId`, `productId`, `productName`, `planName`, `planVersion`, `allowedDurations`, `supportedPremiumType`, `coverageOptions`, `termsAndConditions`, `isActive`, `createdDate` | Plan detail with nested coverage options |
| `PlanWizardResponseDTO` | `policyPlanId`, `planName`, `coverageOptionIds`, `pricingRuleId` | Wizard completion summary |
| `CoverageOptionResponseDTO` | `id`, `coverageAmount`, `label`, `displayOrder`, `isActive` | Coverage option |
| `PricingRuleResponseDTO` | `id`, `planId`, `baseRiskRate`, `processingFee`, `gst`, `effectiveFrom`, `effectiveTo`, `status`, `createdDate`, `updatedDate` | Pricing rule |
| `PolicyResponseDTO` | `policyId`, `policyNumber`, `customerId`, `customerName`, `planId`, `planName`, `startDate`, `endDate`, `policyStatus`, `totalPremiumPaid`, `productType`, `selectedCoverage`, `premiumType`, `policyDuration`, `premiumRateUsed`, `processingFeeUsed`, `gstUsed`, `calculatedPremium`, `planVersion`, `pricingRuleId`, `quoteId`, `purchaseDate`, `createdDate`, `remainingClaimAmount` | Policy detail |
| `PaymentResponseDTO` | `paymentId`, `policyId`, `policyNumber`, `amount`, `paymentMode`, `transactionReference`, `paymentStatus`, `paymentDate` | Premium payment record |
| `ClaimResponseDTO` | `claimId`, `claimNumber`, `policyId`, `policyNumber`, `claimAmount`, `claimReason`, `incidentDate`, `claimStatus`, `staffRemarks`, `adminRemarks`, `customerName`, `createdDate`, `updatedDate`, `documents`, `assignedStaffId`, `assignedStaffName` | `assignedStaffId`/`assignedStaffName` are `@JsonInclude(NON_NULL)` |
| `ClaimHistoryResponseDTO` | `historyId`, `previousStatus`, `newStatus`, `remarks`, `updatedBy`, `updatedDate` | Claim status history entry |
| `ClaimDocumentResponseDTO` | `documentName`, `documentType`, `documentReference` | Claim document metadata |

### JSON exposure rules

- `@JsonIgnore` is applied to `refreshToken` in `LoginResponseDTO` and `RefreshResponseDTO`; the controller reads it directly to set the refresh cookie.
- `@JsonInclude(NON_NULL)` is applied to `productSpeciality` (`UserResponseDTO`) and `assignedStaffId`/`assignedStaffName` (`ClaimResponseDTO`), so absent values are omitted rather than serialized as `null`.

## Workflow

1. Request DTOs are populated from the JSON body and validated with `@Valid` in the controller (Validation.md describes the annotations).
2. Services map request DTOs onto entities and entities onto response DTOs via the shared `ModelMapper` bean.
3. Controllers wrap response DTOs in `ApiResponseDTO<T>`; validation and domain failures are converted by `GlobalExceptionHandler` into `ErrorResponseDTO`/`ValidationErrorResponseDTO`.

## Code References

- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/` (23 request DTOs)
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/` (21 response DTOs)
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/PremiumCalculationRequest.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/AdminPremiumCalculationRequest.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/PremiumQuote.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/QuotePurchaseRequest.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/AppConfig.java` (shared `ModelMapper` bean)

Related: [Validation](Validation.md), [Database](../04_Database), [API Response Wrappers](../03_API/API_Flow.md#response-wrappers)

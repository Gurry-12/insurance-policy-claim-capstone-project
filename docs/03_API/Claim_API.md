# Claim API

> Endpoints under `/api/claims` for raising, tracking, reviewing, and finally deciding insurance claims, plus document upload under `/api/document/upload/{claimId}`.

## Purpose

Reference for the claim lifecycle: raising a claim with multipart document upload, customer and staff listings, the staff review chain (under-review → assign → review), the admin final decision, status history, and the document upload endpoint. Includes the role matrix, `ClaimRequestDTO`, `ClaimReviewRequestDTO`, `ClaimResponseDTO`, and `ClaimHistoryResponseDTO`.

## Overview

Claims follow a state machine: `SUBMITTED → UNDER_REVIEW → RECOMMENDED_FOR_APPROVAL/REJECTION → APPROVED/REJECTED`. Customers raise claims with at least one supporting document; internal staff evaluate and recommend; an admin makes the final decision. Base URL: `http://localhost:8081/api`.

## Business Context

Claims are only valid against `ACTIVE` policies, with the claim amount capped by remaining coverage and the incident date inside the policy period. Staff only work claims matching their `productSpeciality`. Rules are detailed in `../02_Business_Domain/Claim.md` and `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Endpoint matrix and role matrix

| Method | Path | Role | Response envelope |
|---|---|---|---|
| POST | `/api/claims/raise` | CUSTOMER | `ApiResponseDTO<ClaimResponseDTO>` (`201 Created`) |
| GET | `/api/claims/my-claims` | CUSTOMER | `ApiResponseDTO<List<ClaimResponseDTO>>` |
| GET | `/api/claims` | ADMIN, INTERNAL_STAFF | `ApiResponseDTO<PageResponseDTO<ClaimResponseDTO>>` |
| GET | `/api/claims/{claimId}` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<ClaimResponseDTO>` |
| GET | `/api/claims/{claimId}/history` | ADMIN, INTERNAL_STAFF, CUSTOMER | `ApiResponseDTO<PageResponseDTO<ClaimHistoryResponseDTO>>` |
| PATCH | `/api/claims/{claimId}/under-review` | INTERNAL_STAFF | `ApiResponseDTO<ClaimResponseDTO>` |
| PATCH | `/api/claims/{claimId}/assign` | INTERNAL_STAFF | `ApiResponseDTO<ClaimResponseDTO>` |
| PATCH | `/api/claims/{claimId}/review` | INTERNAL_STAFF | `ApiResponseDTO<ClaimResponseDTO>` |
| PATCH | `/api/claims/{claimId}/final-decision` | ADMIN | `ApiResponseDTO<ClaimResponseDTO>` |
| POST | `/api/document/upload/{claimId}` | CUSTOMER | `ApiResponseDTO<List<ClaimDocumentResponseDTO>>` |

### Raise a claim — multipart/form-data

`POST /api/claims/raise` consumes `multipart/form-data` with two parts:

| Part | Type | Notes |
|---|---|---|
| `claim` | JSON string (`ClaimRequestDTO`) | `Content-Type` of the part is `application/json` |
| `files` | one or more files | JPEG/PNG/PDF, max 5 MB each, at least one required |

`ClaimRequestDTO`:

```json
{
  "policyId": 2,
  "claimAmount": 45000.00,
  "claimReason": "Rear bumper dent in parking lot collision",
  "incidentDate": "2026-08-01"
}
```

Validation: `policyId`, `claimAmount` (positive), `incidentDate` required; `claimReason` required non-blank.

cURL example:

```bash
curl -X POST http://localhost:8081/api/claims/raise \
  -H "Authorization: Bearer <customer-token>" \
  -F "claim={\"policyId\":2,\"claimAmount\":45000,\"claimReason\":\"Rear bumper dent\",\"incidentDate\":\"2026-08-01\"}" \
  -F "files=@incident_photo.jpg"
```

### Raise-claim validation

- Policy must be `ACTIVE`.
- `claimAmount` ≤ remaining coverage (`selectedCoverage` − already-outstanding claims).
- `incidentDate` within the policy period and not in the future.
- At least one supporting document required (stored via Cloudinary).

### Review — `ClaimReviewRequestDTO`

Used by both staff review and admin final decision:

```json
{
  "recommendedStatus": "RECOMMENDED_FOR_APPROVAL",
  "remarks": "All documentation verified. Claim is valid."
}
```

- Staff `review`: `recommendedStatus` must be `RECOMMENDED_FOR_APPROVAL` or `RECOMMENDED_FOR_REJECTION`; the claim must be assigned to the calling staff member and in `UNDER_REVIEW`.
- Admin `final-decision`: `recommendedStatus` must be `APPROVED` or `REJECTED`; the claim must be in a `RECOMMENDED_*` state. Final decisions cannot be reversed.

### Response — `ClaimResponseDTO`

```json
{
  "claimId": 1,
  "claimNumber": "CLM-2N4P6Q9R",
  "policyId": 1,
  "policyNumber": "POL-HLTH-00001",
  "claimAmount": 45000.00,
  "claimReason": "Rear bumper dent in parking lot collision",
  "incidentDate": "2026-08-01",
  "claimStatus": "SUBMITTED",
  "staffRemarks": null,
  "adminRemarks": null,
  "customerName": "Rajesh Sharma",
  "createdDate": "2026-08-03T10:00:00",
  "updatedDate": "2026-08-03T10:00:00",
  "documents": [
    {
      "documentName": "incident_photo.jpg",
      "documentType": "image/jpeg",
      "documentReference": "https://res.cloudinary.com/..."
    }
  ],
  "assignedStaffId": null,
  "assignedStaffName": null
}
```

`assignedStaffId`/`assignedStaffName` are omitted (`@JsonInclude(NON_NULL)`) until a claim is assigned.

### History — `ClaimHistoryResponseDTO`

```json
{
  "historyId": 1,
  "previousStatus": "SUBMITTED",
  "newStatus": "UNDER_REVIEW",
  "remarks": "Claim under review",
  "updatedBy": "staff@insurance.com",
  "updatedDate": "2026-08-03T10:05:00"
}
```

### Document upload — `ClaimDocumentResponseDTO`

`POST /api/document/upload/{claimId}` accepts `multipart/form-data` with a `files` part and returns:

```json
{
  "message": "Supporting documents uploaded successfully.",
  "success": true,
  "data": [
    {
      "documentName": "report.pdf",
      "documentType": "application/pdf",
      "documentReference": "https://res.cloudinary.com/..."
    }
  ],
  "timeStamp": "2026-08-03T10:10:00"
}
```

### Claim status lifecycle

```
SUBMITTED → UNDER_REVIEW → RECOMMENDED_FOR_APPROVAL → APPROVED
                                  or
                        RECOMMENDED_FOR_REJECTION → REJECTED
```

`ClaimStatus` values: `SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`, `APPROVED`, `REJECTED`.

### List query params

- `GET /api/claims`: `pageNumber`, `pageSize`, `sortBy` (default `createdDate`), `sortDirection` (default `desc`), optional `customerId`, `status`, `minClaimAmount`, `maxClaimAmount`.
- `GET /api/claims/{claimId}/history`: `pageNumber`, `pageSize`, `sortBy` (default `id`), `sortDirection` (default `desc`), optional `updatedBy`, `status`.

Internal staff see only claims whose policy product type matches their `productSpeciality`.

## Workflow

1. Customer raises a claim with documents: `POST /api/claims/raise`.
2. Customer tracks: `GET /api/claims/my-claims`, `GET /api/claims/{claimId}/history`.
3. Staff moves it to review: `PATCH /api/claims/{claimId}/under-review`.
4. Staff assigns it to self: `PATCH /api/claims/{claimId}/assign`.
5. Staff recommends: `PATCH /api/claims/{claimId}/review`.
6. Admin finalizes: `PATCH /api/claims/{claimId}/final-decision`.
7. Customer may attach more documents: `POST /api/document/upload/{claimId}`.

## Code References

| Concern | Path |
|---|---|
| Claim controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/ClaimController.java` |
| Document controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/ClaimDocumentController.java` |
| Request DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/{ClaimRequestDTO,ClaimReviewRequestDTO}.java` |
| Response DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/{ClaimResponseDTO,ClaimHistoryResponseDTO,ClaimDocumentResponseDTO}.java` |
| Claim status enum | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/enums/ClaimStatus.java` |
| Sample payloads | `demo-data/api-test-payloads/10-claims.md` |

## Diagrams

Claim state machine and audit-trail design are documented in `../04_Database/Table_Descriptions.md` and `../08_Workflows/Claim_Lifecycle.md`.

## Best Practices

- Mandatory documents at raise time prevents non-evidenced claims.
- The staff recommendation + admin final-decision split enforces separation of duties.
- Every transition is recorded in `ClaimStatusHistory`, producing a full audit trail.

## Future Improvements

- Consider document-type whitelist and file-size configuration centralization.
- Link to `../10_Evaluation/Future_Enhancements.md`.

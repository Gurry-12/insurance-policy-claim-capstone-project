# Claim Workflow

> The end-to-end claim lifecycle: raising a claim with documents, eligibility validation, staff assignment and review by speciality, admin final decision, and the full audit trail.

## Purpose

Describes how a claim is created, validated, routed, decided, and audited. Enforcement rules are authoritative in `Business_Rules.md` (section 5–6); API details are in `../03_API/Claim_API.md`; the end-to-end operational flow in `../08_Workflows/Claim_Flow.md`.

## Overview

A customer raises a claim against an **ACTIVE** policy with claim amount, reason, incident date, and at least one supporting document. The claim enters `SUBMITTED`, is assigned to an internal-staff member whose `productSpeciality` matches the product type, moves to `UNDER_REVIEW`, receives a staff recommendation (`RECOMMENDED_FOR_APPROVAL` / `RECOMMENDED_FOR_REJECTION`), and is finally decided by an admin (`APPROVED` / `REJECTED`). Every transition is appended to `ClaimStatusHistory`.

## Business Context

Claim payouts are the highest-risk financial operation in the system. The maker-checker design separates the staff who investigate (and recommend) from the admin who authorises payout, preventing a single actor from both investigating and approving. The immutable history timeline gives customers and regulators full transparency.

## Technical Design

### Entity: `Claim`

| Field | Notes |
|---|---|
| `claimNumber` | Unique, `CLM-<8 hex>` (`util/ClaimNumberGenerator.java`) |
| `claimAmount` | Positive, `precision 15 scale 2` |
| `claimReason` | Required |
| `incidentDate` | Required; stored `atStartOfDay()` |
| `claimStatus` | `ClaimStatus` string enum |
| `staffRemarks` / `adminRemarks` | Written by staff review and admin decision respectively |
| `assignedStaff` | `@ManyToOne AppUser` set on assignment |
| `claimDocuments` | One-to-many `ClaimDocument` |
| `claimStatusHistories` | One-to-many `ClaimStatusHistory` |
| `version` | Optimistic lock |

### Claim state machine

| From | To | Actor | Action |
|---|---|---|---|
| — | `SUBMITTED` | Customer | `POST /api/claims/raise` (multipart: claim JSON + files); documents uploaded to Cloudinary; history `SUBMITTED` |
| `SUBMITTED` | `SUBMITTED` (assigned) | Staff | `PATCH /api/claims/{id}/assign` — staff speciality matches product type; assign to self |
| `SUBMITTED` | `UNDER_REVIEW` | Staff | `PATCH /api/claims/{id}/under-review` — staff sets `staffRemarks = "Claim under review"` |
| `UNDER_REVIEW` | `RECOMMENDED_FOR_APPROVAL` | Staff | `PATCH /api/claims/{id}/review` with `recommendedStatus = RECOMMENDED_FOR_APPROVAL` + remarks (must be the assigned staff) |
| `UNDER_REVIEW` | `RECOMMENDED_FOR_REJECTION` | Staff | Same endpoint with `RECOMMENDED_FOR_REJECTION` |
| `RECOMMENDED_FOR_APPROVAL` | `APPROVED` | Admin | `PATCH /api/claims/{id}/final-decision` — sets `adminRemarks`; terminal |
| `RECOMMENDED_FOR_REJECTION` | `REJECTED` | Admin | Same endpoint; terminal |

Not permitted (enforced):

- Staff cannot set final `APPROVED`/`REJECTED`; admin cannot set `RECOMMENDED_*` statuses.
- No transition into `UNDER_REVIEW` except from `SUBMITTED`.
- No recommendation except from `UNDER_REVIEW`.
- No final decision except from a `RECOMMENDED_*` state.
- No changes after a terminal state (`APPROVED`/`REJECTED`).
- No claim on a non-`ACTIVE` policy; no claim by a non-owner.

### Claim eligibility (raise-time)

1. ≥ 1 non-empty file, PDF or image, ≤ 5 MB each (raise path).
2. `claimAmount > 0`.
3. Policy owned by the customer and in `ACTIVE` status.
4. `claimAmount ≤ selectedCoverage − Σ(claims with status != REJECTED)` (covers open and approved claims; rejected claims free up headroom).
5. `incidentDate` not in the future and within `[startDate, endDate]`.

Full statements with enforcement points: `Business_Rules.md` sections 5 and 6.

### Documents via Cloudinary

- Files are uploaded with `CloudinaryServiceImpl.uploadFile` into folder `insurance_claims`; the response `secure_url` is stored as `documentReference` on `ClaimDocument`, along with original file name, content type, and upload time.
- The claim must exist before upload; upload is only allowed by the claim owner (`UPLOAD_OWN_CLAIMS_ONLY`).
- The standalone upload endpoint (`POST /api/document/upload/{claimId}`, customer) enforces JPEG/PNG/PDF and ≤ 10 MB per file.

### Audit trail

`ClaimStatusHistory` records `previousStatus`, `newStatus`, `remarks`, `updatedBy`, `updatedDate` on every transition, including assignment (`SUBMITTED → SUBMITTED`, "Staff member assigned"). Exposed via `GET /api/claims/{id}/history` with filtering by `updatedBy` and `status`.

## Workflow

1. **Raise** — `POST /api/claims/raise` (`multipart/form-data`, parts `claim` + `files`). Validation per `Business_Rules.md` 5.x → save `SUBMITTED` with `claimNumber = CLM-…` → upload documents → record history.
2. **Assign** — staff claims the case: `PATCH /api/claims/{id}/assign` (must be `SUBMITTED`, speciality must match).
3. **Under review** — `PATCH /api/claims/{id}/under-review` moves to `UNDER_REVIEW`.
4. **Recommend** — `PATCH /api/claims/{id}/review` sets a recommendation + `staffRemarks`.
5. **Decide** — `PATCH /api/claims/{id}/final-decision` (admin) sets `APPROVED`/`REJECTED` + `adminRemarks`.
6. **Track** — customers, staff (speciality-scoped), and admin can view claim details, documents, and the history timeline.

## Code References

- `serviceimpl/ClaimServiceImpl.java` — raise, assign, under-review, review, final decision, queries, history.
- `serviceimpl/ClaimDocumentServiceImpl.java` — document upload and Cloudinary linkage.
- `serviceimpl/CloudinaryServiceImpl.java` — Cloudinary upload/destroy.
- `model/Claim.java`, `model/ClaimDocument.java`, `model/ClaimStatusHistory.java`, `enums/ClaimStatus.java`.
- `util/ClaimNumberGenerator.java` — `CLM-<8 hex>`.

All under `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/`.

## Diagrams

- Claim state machine: `../09_Diagrams/Activity_Diagrams/`.
- Cloudinary upload flow: `../09_Diagrams/Flowcharts/`.
- Raise/review/decision sequences: `../09_Diagrams/Sequence_Diagrams/`.

## Best Practices

- Maker-checker separation of duties: staff recommend, admin decides.
- Immutable, append-only `ClaimStatusHistory` supports full transparency and audit.
- File validation happens in the service (not only the controller), and originals are stored externally on Cloudinary with metadata in the database.
- Optimistic locking on `Claim` prevents lost updates during concurrent transitions.

## Future Improvements

- Auto-expire policies at `endDate` so claims cannot be raised on lapsed contracts (currently enforced by the `ACTIVE` check).
- Claim amount accounting for approved-only payouts (approved claims currently count against headroom).
- See `../10_Evaluation/Future_Enhancements.md`.

# Claim Management Feature Deep Dive

> **What:** Line-by-line execution flow for Raising a Claim, Uploading Documents, and Staff Review processing.
> **Why:** The most complex user flow in the system, involving multi-step file uploads (Multipart Form Data), custom dynamic validations based on policy coverage, and state-machine transitions (Submitted → Under Review → Recommended → Approved/Rejected).

---

## 1. Raise Claim Flow (Customer)

**Entry Point:** `/customer/claims/raise`

### Component Mount & Dynamic Validation Setup

```text
`<RaiseClaimPage />` mounts.
↓
`useEffect` fetches Customer's Policies (`getMyPolicies()`).
↓
User selects a Policy from the `<ModernSelect>` dropdown.
↓
`handleChange` detects `name === "policyId"`.
↓
Triggers `getPolicyById(value)` to fetch exact policy limits.
↓
State updates: `setSelectedPolicyDetails(details)`.
↓
React `useEffect` tracking `[claim.claimAmount, claim.incidentDate, selectedPolicyDetails]` fires:
  1. Validates `claimAmount` against `selectedPolicyDetails.remainingClaimAmount`.
  2. If `amount > remaining`, sets real-time error: "Cannot exceed remaining coverage".
  3. Validates `incidentDate` against `selectedPolicyDetails.startDate`.
  4. If `incidentDate < startDate`, sets real-time error.
```

### Document Selection & Form Data Preparation

```text
User selects Document Category (`selectedDocType`).
↓
User drops/selects files (JPG, PNG, PDF).
↓
`handleFileChange` executes:
  1. Validates file extension against `allowedTypes`.
  2. Validates `file.size < 5MB`.
  3. Appends valid files to `files` state array, mapped to `docType`.
↓
User clicks "Submit Claim".
↓
`handleSubmit(e)` fires.
↓
`FormData` object constructed (multipart/form-data):
  1. Claim data appended as a `Blob` of type `application/json`.
  2. Files renamed safely (`${docType}_${safeName}${extension}`).
  3. Appended to FormData as `files`.
↓
`raiseClaim(formData)` calls Axios POST `/claims/raise`.
↓
Backend creates Claim in `SUBMITTED` status and uploads files.
↓
Returns 200 OK.
↓
`navigate("/customer/claims")`.
```

---

## 2. Upload Additional Documents Flow

**Entry Point:** `/customer/claims/upload/:claimId`

### Fetching Context

```text
`<UploadDocumentsPage />` mounts.
↓
Extracts `claimId` from URL.
↓
`useEffect` fetches Claim details.
↓
Extracts `policyId` from Claim.
↓
Fetches Policy details.
↓
Extracts `productType` to determine which document categories are valid (`PRODUCT_DOCUMENT_CATEGORIES[productType]`).
↓
Sets `productType` state to drive dropdown options.
```

### Drag & Drop Execution

```text
User drags file over drop zone.
↓
`handleDragOver` -> `setIsDragging(true)` (UI turns blue).
↓
User drops file.
↓
`handleDrop(e)` extracts `e.dataTransfer.files`.
↓
Validates that a Category is selected.
↓
Appends to `files` state.
↓
On submit, follows similar `FormData` construction as Raise Claim (max 10MB per file).
↓
`uploadDocuments(claimId, formData)` calls Axios POST `/claims/{id}/documents`.
```

---

## 3. Staff Claim Review Flow

**Entry Point:** `/staff/claims/:id`

### Fetching & Locking

```text
`<StaffClaimDetailPage />` mounts.
↓
`Promise.all` fetches:
  1. `getClaimById(id)`
  2. `getClaimHistory(id)`
↓
Component identifies `claimStatus`.
↓
If `claimStatus === 'SUBMITTED'` and `assignedStaffName === null`:
  └─ UI renders "Start Review" button.
↓
Staff clicks "Start Review".
↓
`handleUnderReview()` executes:
  1. `assignClaim(id)` (POST `/claims/{id}/assign`)
  2. `markUnderReview(id)` (PUT `/claims/{id}/status?status=UNDER_REVIEW`)
↓
If success:
  └─ Claim is locked to `user.name`.
If HTTP 400 "already under review":
  └─ Optimistic locking caught it (another staff clicked milliseconds faster). Toast error shown.
```

### Recommendation Execution

```text
Staff reviews Documents via `<DocumentPreviewModal>`.
↓
Staff clicks "Add Recommendation".
↓
`<Modal>` opens.
↓
Staff types `remark` and clicks "Recommend Approval" (or Rejection).
↓
`handleRecommendation('approve')` executes.
↓
Calls Axios PUT `/claims/{id}/review` with:
  `{ recommendedStatus: "RECOMMENDED_FOR_APPROVAL", remarks: "..." }`
↓
Backend transitions State Machine: `UNDER_REVIEW` → `RECOMMENDED_FOR_APPROVAL`.
↓
Updates UI History Timeline.
```

### Admin Final Approval Flow (Brief)

```text
Admin views Claim (same detail page component structure).
↓
Admin clicks "Approve Claim".
↓
Calls Axios PUT `/claims/{id}/approve` (or reject) with Remarks.
↓
Backend transitions State Machine: `RECOMMENDED_FOR_APPROVAL` → `APPROVED`.
↓
Backend trigger: Triggers payout process / deducts from Policy `remainingClaimAmount`.
```

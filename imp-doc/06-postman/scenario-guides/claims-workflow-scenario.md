# Phase 5: The Claims Workflow

## 5.1 Customer Raises a Claim
**Endpoint:** `POST {{baseUrl}}/api/claims/raise`  
**Role:** CUSTOMER (`{{customerToken_1}}`)  
**Headers:** `Content-Type: multipart/form-data`  
**Form Data:**
- `claim` (Text/JSON):
```json
{
  "policyId": 1,
  "claimAmount": 45000,
  "claimReason": "Hospitalization due to Dengue fever",
  "incidentDate": "2024-08-10"
}
```
- `files` (File): *Attach a dummy PDF or Image.*
*Expected: Claim created in `SUBMITTED` status.*

## 5.2 Staff Assigns Claim to Self
**Endpoint:** `PATCH {{baseUrl}}/api/claims/1/assign`  
**Role:** INTERNAL_STAFF (`{{staffToken_health}}`)  
**Headers:** No Body
*Expected: `assignedStaff` set to current staff member.*

## 5.3 Staff Moves Claim to Under Review
**Endpoint:** `PATCH {{baseUrl}}/api/claims/1/under-review`  
**Role:** INTERNAL_STAFF (`{{staffToken_health}}`)  
**Headers:** No Body
*Expected: Status changes to `UNDER_REVIEW`.*

## 5.4 Staff Recommends Approval
**Endpoint:** `PATCH {{baseUrl}}/api/claims/1/review`  
**Role:** INTERNAL_STAFF (`{{staffToken_health}}`)  
**Body:**
```json
{
  "recommendedStatus": "RECOMMENDED_FOR_APPROVAL",
  "remarks": "Documents verified. Hospitalization bills are genuine."
}
```

## 5.5 Admin Final Decision (Approval)
**Endpoint:** `PATCH {{baseUrl}}/api/claims/1/final-decision`  
**Role:** ADMIN (`{{adminToken}}`)  
**Body:**
```json
{
  "recommendedStatus": "APPROVED",
  "remarks": "Final approval granted based on staff verification."
}
```

## 5.6 Variation: Staff Recommends Rejection
**Endpoint:** `PATCH {{baseUrl}}/api/claims/2/review`  
**Role:** INTERNAL_STAFF
```json
{
  "recommendedStatus": "RECOMMENDED_FOR_REJECTION",
  "remarks": "Incident date falls outside the active policy period. Suspected fraud."
}
```

## 5.7 Variation: Admin Final Decision (Rejection)
**Endpoint:** `PATCH {{baseUrl}}/api/claims/2/final-decision`  
**Role:** ADMIN
```json
{
  "recommendedStatus": "REJECTED",
  "remarks": "Rejected as per policy terms."
}
```

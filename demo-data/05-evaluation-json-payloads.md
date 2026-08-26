# 🧪 Ready-to-Use JSON Payloads for Live Evaluation

> **Target Server:** `http://localhost:8081`  
> **Swagger UI:** `http://localhost:8081/swagger-ui/index.html`  
> **Purpose:** Pre-validated, exact JSON request bodies for live demonstration during the viva evaluation.

---

## 1. Authentication & OTP Verification

### A. Customer Registration
`POST /api/auth/register`
```json
{
  "fullName": "Vikram Malhotra",
  "email": "vikram.malhotra@example.com",
  "password": "Password@123",
  "mobileNumber": "+919876501234"
}
```

### B. Verify OTP (Activates Account)
`POST /api/auth/verify-otp`
> For seeded pending user `meena.iyer@example.com`, use OTP `555555`.
```json
{
  "email": "meena.iyer@example.com",
  "emailOtp": "555555",
  "phoneOtp": "555555"
}
```

### C. Login (Customer / Staff / Admin)
`POST /api/auth/login`
```json
{
  "email": "rajesh.sharma@example.com",
  "password": "Customer@123"
}
```
*(Admin: `admin@insurance.com` / `Admin@123`)*  
*(Staff: `kavita.nair@insurance.com` / `Staff@123`)*

---

## 2. Customer KYC Profile

### Complete Customer Profile
`POST /api/customers` *(Bearer Token: Customer)*
```json
{
  "dateOfBirth": "1990-05-15",
  "address": "Flat 402, Sunshine Towers, MG Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "nomineeName": "Pooja Malhotra",
  "nomineeRelation": "Spouse"
}
```

---

## 3. Catalog Management (Admin Only)

### A. Create Insurance Product
`POST /api/products` *(Bearer Token: Admin)*
```json
{
  "productName": "Home Insurance",
  "productType": "INSURANCE",
  "description": "Comprehensive protection against fire, earthquake, and burglary for residential properties."
}
```

### B. Create Policy Plan via Wizard (Plan + Options + Pricing)
`POST /api/plans/wizard` *(Bearer Token: Admin)*
```json
{
  "planDetails": {
    "productId": 1,
    "planName": "Health Super Shield",
    "allowedDurations": [1, 2, 3, 5],
    "supportedPremiumType": "ANNUAL",
    "termsAndConditions": "Covers hospitalization, ICU charges, and day-care procedures. 30-day waiting period applies.",
    "activeStatus": true
  },
  "coverageOptions": [
    {
      "coverageAmount": 500000.00,
      "label": "5 Lakh Base Cover",
      "displayOrder": 1,
      "activeStatus": true
    },
    {
      "coverageAmount": 1000000.00,
      "label": "10 Lakh Gold Cover",
      "displayOrder": 2,
      "activeStatus": true
    }
  ],
  "pricingRule": {
    "baseRiskRate": 0.0045,
    "processingFee": 300.00,
    "gst": 18.00,
    "effectiveFrom": "2026-08-01T00:00:00",
    "remarks": "Standard Health Super Shield launch pricing"
  }
}
```

---

## 4. Actuarial Pricing, Quote & Policy Purchase

### A. Calculate Instant Premium (Generate Quote)
`POST /api/premium/calculate` *(Bearer Token: Customer)*
```json
{
  "planId": 1,
  "coverageAmount": 1000000.00,
  "duration": 1,
  "premiumType": "ANNUAL"
}
```
**Expected Return:**
- `basePremium: ₹4,000.00`
- `taxableAmount: ₹4,250.00`
- `gst: ₹765.00`
- `totalPremium: ₹5,015.00`
- `quoteId: <Returned Quote ID>`

### B. Purchase Policy from Quote (Creates PENDING_PAYMENT)
`POST /api/policies/purchase` *(Bearer Token: Customer)*
```json
{
  "quoteId": 1
}
```

### C. Pay Premium (Activates Policy)
`POST /api/payments` *(Bearer Token: Customer)*
```json
{
  "policyId": 3,
  "amount": 2655.00,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```

---

## 5. Claim Lifecycle & Maker-Checker Workflow

### A. Raise Claim (Multipart Form-Data)
`POST /api/claims/raise` *(Bearer Token: Customer)*
- **Header:** `Content-Type: multipart/form-data`
- **Part 1 (`claim` - application/json):**
```json
{
  "policyId": 1,
  "claimAmount": 45000.00,
  "claimReason": "Hospitalization for acute viral infection",
  "incidentDate": "2026-08-10"
}
```
- **Part 2 (`files` - binary file):** Attach any sample PDF or JPEG image (`hospital_bill.pdf`).

---

### B. Staff Moves Claim to Review Queue
`PATCH /api/claims/3/under-review` *(Bearer Token: Staff)*
*(No Request Body required)*

---

### C. Staff Assigns Claim to Self
`PATCH /api/claims/3/assign` *(Bearer Token: Staff)*
*(No Request Body required)*

---

### D. Staff Recommends Approval (Maker Step)
`PATCH /api/claims/3/review` *(Bearer Token: Staff)*
```json
{
  "recommendation": "RECOMMENDED_FOR_APPROVAL",
  "staffRemarks": "All hospital discharge summaries and tax invoices verified with network hospital. Recommended for full approval."
}
```

---

### E. Admin Final Decision (Checker Step)
`PATCH /api/claims/3/final-decision` *(Bearer Token: Admin)*
```json
{
  "decision": "APPROVED",
  "adminRemarks": "Claim approved under policy coverage terms. Settlement processed."
}
```

---

## 6. Staff & Admin Quick Lookups

### Filter Claims by Speciality (Health / Motor)
`GET /api/claims/page?pageNumber=0&pageSize=10&claimStatus=UNDER_REVIEW` *(Staff)*

### View Claim History & Audit Trail
`GET /api/claims/1/history` *(All Roles)*

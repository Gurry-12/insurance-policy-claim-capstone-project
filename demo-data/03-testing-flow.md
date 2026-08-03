# API Testing Flow

End-to-end happy-path walkthrough with `curl`, using the seeded demo data
(`demo-data/sql/`). Backend runs on **`http://localhost:8081`**, all endpoints
under `/api`.

## 0. Prerequisites
1. MySQL running; `insurance_db` exists.
2. Import the seed scripts **after the first app boot** (so Hibernate has created the schema):
   ```bash
   mysql -u <user> -p insurance_db < demo-data/sql/01-users-and-customers.sql
   mysql -u <user> -p insurance_db < demo-data/sql/02-catalog.sql
   mysql -u <user> -p insurance_db < demo-data/sql/03-policies-claims.sql
   ```
   If the app is already running, restart it (or just re-login) after importing.
3. Start the backend: `./mvnw spring-boot:run` (needs `env.properties` for DB creds etc.).

> **Login cookies:** login sets an HttpOnly `refresh_token` cookie. Use a cookie jar so
> `refresh`/`logout` work: add `-c cookies.txt -b cookies.txt` to every curl call.

## 1. Role matrix (seeded users)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@insurance.com` | `Admin@123` |
| Customer | `rajesh.sharma@example.com` | `Customer@123` |
| Customer | `priya.verma@example.com` | `Customer@123` |
| Customer | `amit.patel@example.com` | `Customer@123` |
| Internal Staff (HEALTH) | `kavita.nair@insurance.com` | `Staff@123` |
| Internal Staff (MOTOR) | `sanjay.gupta@insurance.com` | `Staff@123` |
| Pending customer (unverified) | `meena.iyer@example.com` | `Customer@123` |

## 2. Login helper (run once per role, reuse the token)
```bash
curl -s -c cookies.txt http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh.sharma@example.com","password":"Customer@123"}'
```
Grab `data.token` from the response and export it:
```powershell
$ADMIN  = "<admin token>"
$CUST   = "<customer token>"
$STAFF  = "<staff token>"
```

## 3. Public stats (no auth)
```bash
curl -s http://localhost:8081/api/public/stats
```
Expected: `activeProducts=5`, `activePlans=6`, `totalPolicies=4`, `claimsProcessed=3`.

## 4. Customer: complete profile (once)
```bash
curl -s -X POST http://localhost:8081/api/customers \
  -H "Authorization: Bearer $CUST" -H "Content-Type: application/json" \
  -d '{"dateOfBirth":"1990-01-15","address":"123 Main Street","city":"Mumbai","state":"Maharashtra","pinCode":"400001","nomineeName":"Sunita Sharma","nomineeRelation":"Spouse"}'
```

## 5. Customer: browse catalog
```bash
curl -s http://localhost:8081/api/products/active -H "Authorization: Bearer $CUST"
curl -s http://localhost:8081/api/plans/1/active       -H "Authorization: Bearer $CUST"
curl -s http://localhost:8081/api/plans/2              -H "Authorization: Bearer $CUST"
```

## 6. Customer: generate a quote (creates a Quote; returns `quoteId`)
Plan 2 (Critical Care Plus, ANNUAL, rate 0.0050, fee 300, GST 18%):
```bash
curl -s -X POST http://localhost:8081/api/premium/calculate \
  -H "Authorization: Bearer $CUST" -H "Content-Type: application/json" \
  -d '{"planId":2,"coverageAmount":1000000.00,"duration":3,"premiumType":"ANNUAL"}'
```
Expected maths: base = 1,000,000 × 0.005 = 5,000; + fee 300 = 5,300; GST 18% = 954;
**annualPremium / totalPremium = 6,254.00**. Note the returned `quoteId` (e.g. 5) — use it below.

## 7. Customer: purchase the policy from the quote (PENDING_PAYMENT)
```bash
curl -s -X POST http://localhost:8081/api/policies/purchase \
  -H "Authorization: Bearer $CUST" -H "Content-Type: application/json" \
  -d '{"quoteId":5}'
```

## 8. Customer: pay the premium (activates the policy)
The amount must exactly match the quote's total premium:
```bash
curl -s -X POST http://localhost:8081/api/payments \
  -H "Authorization: Bearer $CUST" -H "Content-Type: application/json" \
  -d '{"policyId":<new-policy-id>,"amount":6254.00,"paymentMode":"UPI","paymentStatus":"SUCCESS"}'
```

## 9. Customer: raise a claim (multipart)
Use an ACTIVE policy (e.g. seeded policy 1 owned by Rajesh):
```bash
curl -s -X POST http://localhost:8081/api/claims/raise \
  -H "Authorization: Bearer $CUST" \
  -F "claim={\"policyId\":1,\"claimAmount\":50000,\"claimReason\":\"Accidental injury hospitalisation\",\"incidentDate\":\"2026-08-01\"}" \
  -F "files=@hospital_bill.jpg"
```
> Files: JPEG/PNG/PDF, max 5 MB each, at least one required. Cloudinary must be
> configured (`env.properties`) or the upload fails.

## 10. Staff: process a seeded SUBMITTED claim (CLM-2N4P6Q9R, claim id 3)
```bash
curl -s -X PATCH http://localhost:8081/api/claims/3/under-review -H "Authorization: Bearer $STAFF"
curl -s -X PATCH http://localhost:8081/api/claims/3/assign        -H "Authorization: Bearer $STAFF"
curl -s -X PATCH http://localhost:8081/api/claims/3/review        -H "Authorization: Bearer $STAFF" \
  -H "Content-Type: application/json" \
  -d '{"recommendedStatus":"RECOMMENDED_FOR_APPROVAL","remarks":"All documentation verified."}'
```

## 11. Admin: final decision
```bash
curl -s -X PATCH http://localhost:8081/api/claims/3/final-decision -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"recommendedStatus":"APPROVED","remarks":"Approved. Settlement will be processed."}'
```

## 12. Admin: create a product + plan (wizard) + staff account
```bash
curl -s -X POST http://localhost:8081/api/products -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"productName":"Home Insurance","productType":"INSURANCE","description":"Home insurance covering structure and contents.","activeStatus":true}'

curl -s -X POST http://localhost:8081/api/plans/wizard -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"planDetails":{"productId":6,"planName":"Home Shield","allowedDurations":[1,2,3],"supportedPremiumType":"ANNUAL","termsAndConditions":"Covers structure and contents.","activeStatus":true},"coverageOptions":[{"coverageAmount":1000000.00,"label":"Base Cover","displayOrder":1,"activeStatus":true}],"pricingRule":{"baseRiskRate":0.0010,"processingFee":300.00,"gst":18.00,"effectiveFrom":"2026-08-03T00:00:00"}}'

curl -s -X POST http://localhost:8081/api/users/staff -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"fullName":"Rahul Krishnan","email":"rahul.krishnan@insurance.com","password":"Staff@123","mobileNumber":"+919888990011","productSpeciality":"TRAVEL"}'
```

## 13. Refresh / logout
```bash
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:8081/api/auth/refresh   # rotates cookie, returns fresh access token
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:8081/api/auth/logout
```

## 14. Offline OTP (register / verify-otp / reset-password)
- **Register a new customer:** `POST /api/auth/register` (see `api-test-payloads/01-auth.md`). OTPs are delivered to
  email (real mail) and phone. When Twilio is not configured, the phone OTP is logged to the
  **server console** (`Phone OTP for ... is 123456`). Both OTPs are stored in plaintext in the
  `otp_verifications` table:
  ```sql
  SELECT email_otp, phone_otp FROM otp_verifications WHERE user_id = <id> ORDER BY id DESC LIMIT 1;
  ```
- **Verify offline:** seeded pending customer `meena.iyer@example.com` with OTP `555555` / `555555`.
- **Reset password:** call `forgot-password`, read the OTPs from DB/console, then `reset-password`
  with `newPassword` (8-64 chars, letters + digits, e.g. `NewPass@123`).

## 15. Expected response wrappers
Success:
```json
{ "message": "...", "success": true, "data": { ... }, "timeStamp": "2026-08-03T12:00:00" }
```
Paged:
```json
{ "content": [ ... ], "pageNumber": 0, "pageSize": 10, "totalRecords": 4, "totalPages": 1,
  "lastPage": true, "sortingType": "asc" }
```
Error:
```json
{ "timestamp": "2026-08-03T12:00:00", "statusCode": 400, "errorType": "VALIDATION_FAILED",
  "message": "...", "requestPath": "/api/auth/login" }
```

## 16. Common gotchas
- **Access tokens expire after 60 s** (`app.security.jwt.expiration-ms=60000`). Re-login (or `POST /api/auth/refresh` with the cookie jar) before each call, or script a small helper that refreshes automatically.
- `coverageAmount` must **exactly match** an active coverage option; `duration` must be in the plan's
  allowed durations; `premiumType` must match the plan's supported type.
- Payment `amount` must exactly equal the quote total (6,254.00 in the walkthrough above).
- Policies on HEALTH products cannot duplicate an existing ACTIVE/PENDING policy on the same plan.
- A claim's `incidentDate` must fall within the policy period and not be in the future.
- Refresh-token rotation: a reused/old refresh token is treated as token-reuse and revokes the family.
- Server port is **8081**; the frontend dev proxy (`:5173`) forwards `/api` to it.

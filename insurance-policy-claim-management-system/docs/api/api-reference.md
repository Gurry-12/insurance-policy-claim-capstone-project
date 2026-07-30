# API Reference

## Purpose

This document explains how to explore, test, and interact with the REST API using Swagger/OpenAPI, and provides a quick reference to the authentication flow.

---

## Swagger UI / OpenAPI Documentation

The system uses `springdoc-openapi` to automatically generate API documentation from controller annotations.

**Swagger UI URL:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)  
**OpenAPI JSON URL:** [http://localhost:8081/v3/api-docs](http://localhost:8081/v3/api-docs)

### How to use Swagger UI

1. Open the Swagger UI URL in your browser while the application is running
2. You will see all endpoints grouped by Controller (Tags)
3. To test endpoints that require authentication, you must first get a JWT token

### How to Authenticate in Swagger UI

1. Go to **1. Authentication API** -> `POST /api/auth/login`
2. Click **Try it out**
3. Enter valid credentials:
   ```json
   {
     "email": "customer@example.com",
     "password": "your-password-here"
   }
   ```
4. Click **Execute** and copy the `token` string from the response
5. Scroll to the top of the page and click the green **Authorize** button
6. Paste the token into the input field (do NOT type "Bearer " — just the token string)
7. Click **Authorize** then **Close**
8. Now you can execute secured endpoints. The UI will automatically attach the `Authorization: Bearer <token>` header

---

## API Tags (Grouping)

Endpoints are grouped logically using `@Tag` annotations on controllers:

1. **Authentication API:** Login, Register, OTP verification
2. **User Management API:** Admin endpoints for user control
3. **Customer API:** Profile management
4. **Insurance Product API:** Product catalogs
5. **Policy Plan API:** Plan definitions
6. **Insurance Policy API:** Purchase and issuance
7. **Premium Payment API:** Payment recording
8. **Insurance Claim API:** Claim filing and processing
9. **Claim Document API:** File uploads

---

## Example: Full Purchase Flow

To test the system end-to-end, follow this sequence in Swagger:

1. **Register** (`POST /api/auth/register`)
2. **Verify OTP** (`POST /api/auth/verify-otp`) — you must check the console/database for the OTP if email isn't configured
3. **Login** (`POST /api/auth/login`) → Copy Token
4. **Authorize** (Click Authorize button at top)
5. **Complete Profile** (`POST /api/customers/profile`) — provide DOB, address, nominee
6. **View Active Plans** (`GET /api/plans/active`) → Copy a `planId`
7. **Purchase Policy** (`POST /api/policies/purchase`) — provide `planId` and `startDate`
8. **Make Payment** (`POST /api/payments`) — provide `policyId` and matching `amount`
9. **Raise Claim** (`POST /api/claims/raise`) — Requires `multipart/form-data` with document files

---

## Common API Status Codes

| Code | Meaning | When it happens |
|---|---|---|
| **200 OK** | Success | GET requests, Login, OTP verification |
| **201 Created** | Created | POST requests (Registration, Purchase, Raise Claim) |
| **400 Bad Request** | Validation failed | Missing DTO fields, business rule violation (e.g. invalid status) |
| **401 Unauthorized** | Auth failed | Missing token, expired token, wrong password |
| **403 Forbidden** | Access denied | Valid token, but role or ownership rules forbid access |
| **404 Not Found** | Resource missing | Invalid ID in path (e.g., policy not found) |
| **409 Conflict** | State conflict | Duplicate email, optimistic locking failure |
| **500 Server Error** | Internal crash | Null pointers, unhandled exceptions, SMTP failure |

---

## Pagination Standard

All `GET` endpoints that return lists use standard pagination query parameters:

```
GET /api/claims?pageNumber=0&pageSize=10&sortBy=createdDate&sortDirection=desc
```

Response format:
```json
{
  "message": "Claims retrieved successfully.",
  "success": true,
  "data": {
    "content": [ { ...claim object... } ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 45,
    "totalPages": 5,
    "last": false,
    "sortDirection": "desc"
  },
  "timestamp": "..."
}
```

---

## Related Documents

- [controllers/controllers-overview.md](../controllers/controllers-overview.md)
- [dto/dto-overview.md](../dto/dto-overview.md)

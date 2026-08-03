# Admin Users API — Request Payloads

Request bodies for user-management endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/users/staff

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | ADMIN (Bearer token) |
| Description | Create an internal staff account. `productSpeciality` is a `ProductType` value. Account is created inactive; activate via `PATCH /api/users/{id}/activate` after the staff verifies their OTP. |

**Body**

```json
{
  "fullName": "Rahul Krishnan",
  "email": "rahul.krishnan@insurance.com",
  "password": "Staff@123",
  "mobileNumber": "+919888990011",
  "productSpeciality": "TRAVEL"
}
```

## GET /api/users

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN (Bearer token) |
| Description | List all users (seeded: 7). |

**Body:** none

## GET /api/users/page

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN (Bearer token) |
| Description | Paginated users. Query: `?pageNumber=0&pageSize=10&sortBy=id&sortDirection=asc&role=ROLE_CUSTOMER&isActive=true`. |

**Body:** none

## GET /api/users/{id}

| Field | Value |
|---|---|
| Method | `GET` |
| Auth | ADMIN (Bearer token) |
| Description | Get user by id (seeded 1–7). |

**Body:** none

## PATCH /api/users/{id}/activate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Activate a user. Cannot self-activate; user must be email-verified first. Useful for activating a freshly created staff account. |

**Body:** none

## PATCH /api/users/{id}/deactivate

| Field | Value |
|---|---|
| Method | `PATCH` |
| Auth | ADMIN (Bearer token) |
| Description | Deactivate a user (blocks future logins). Cannot self-deactivate. |

**Body:** none

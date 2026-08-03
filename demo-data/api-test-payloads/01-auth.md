# Auth API — Request Payloads

Request bodies for the auth endpoints, keyed to the **seeded demo IDs**
(see `../sql/` and `../04-evaluator-demo.md`). Base URL: `http://localhost:8081/api`.

## POST /api/auth/register

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | PUBLIC (no token) |
| Description | Register a brand-new customer. OTPs are sent to email (real mail) and phone (logged to server console when Twilio is not configured; both OTPs are also visible in the `otp_verifications` table). |

**Body**

```json
{
  "fullName": "Neha Desai",
  "email": "neha.desai@example.com",
  "password": "Customer@123",
  "mobileNumber": "+919877889900"
}
```

## POST /api/auth/verify-otp

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | PUBLIC (no token) |
| Description | Activate an account with both OTPs. Use seeded user Meena Iyer (`meena.iyer@example.com`, OTP `555555` / `555555`) to test offline, or a freshly registered user. |

**Body**

```json
{
  "email": "meena.iyer@example.com",
  "emailOtp": "555555",
  "phoneOtp": "555555"
}
```

## POST /api/auth/resend-otp

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | PUBLIC (no token) |
| Description | Resend OTPs. Only works if the previous OTP has expired. |

**Body**

```json
{
  "email": "meena.iyer@example.com",
  "phone": "+919866778899"
}
```

## POST /api/auth/login

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | PUBLIC (no token) |
| Description | Login. Sets an HttpOnly `refresh_token` cookie and returns the JWT access token in the response body. Any seeded user works (see `04-evaluator-demo.md`). |

**Body**

```json
{
  "email": "rajesh.sharma@example.com",
  "password": "Customer@123"
}
```

## POST /api/auth/forgot-password

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | PUBLIC (no token) |
| Description | Request a password-reset OTP. Read the OTPs from the `otp_verifications` table (or console) before calling reset-password. |

**Body**

```json
{
  "email": "rajesh.sharma@example.com"
}
```

## POST /api/auth/reset-password

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | PUBLIC (no token) |
| Description | Reset password with both OTPs. `newPassword` must be 8–64 chars and contain letters + digits. |

**Body**

```json
{
  "email": "rajesh.sharma@example.com",
  "emailOtp": "<otp-from-db-or-console>",
  "phoneOtp": "<otp-from-db-or-console>",
  "newPassword": "NewPass@123"
}
```

## POST /api/auth/refresh

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | Cookie only (no Authorization header) |
| Description | Rotate the refresh token. Must send the `refresh_token` HttpOnly cookie (curl: `-b`/`-c` cookie jar). Response returns a new access token and rotates the cookie. |

**Body:** none

## POST /api/auth/logout

| Field | Value |
|---|---|
| Method | `POST` |
| Auth | Cookie only (no Authorization header) |
| Description | Revoke the refresh token and clear the `refresh_token` cookie. |

**Body:** none

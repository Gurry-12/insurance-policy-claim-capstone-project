# Authentication API

> Public endpoints under `/api/auth` for customer registration, OTP verification, login, password reset, and refresh-token rotation.

## Purpose

Reference for every authentication endpoint in the Insurance Policy & Claim Management System: request bodies, response shapes, validation rules, the HttpOnly refresh-token cookie contract, OTP delivery, and rate limiting. Read by frontend engineers, integration testers, and security reviewers.

## Overview

All endpoints under `/api/auth/**` are **PUBLIC** — `SecurityConfig` permits them without a JWT (`requestMatchers("/api/auth/**").permitAll()`). The base URL is `http://localhost:8081/api` (backend port **8081**, `/api` prefix).

Two credential systems coexist:

- **Access tokens**: short-lived (default 15 min via `app.security.jwt.expiration-ms`, locally 60 s for dev iteration) stateless JWT (HS256, jjwt) carried in `Authorization: Bearer <token>`. Claims include `roles`, `fullName`, `productSpeciality`, `tokenVersion`; the token version is checked per request so deactivated users are rejected immediately.
- **Refresh tokens**: opaque, stored in the `refresh_tokens` table, delivered exclusively as an HttpOnly cookie named `refresh_token`, rotated on every use, 7-day TTL.

## Business Context

Self-service onboarding is required for customers: they register, prove ownership of email and mobile via dual OTP, and only then can log in. Password resets follow the same dual-OTP proof. Staff and admin accounts are provisioned by an admin (`POST /api/users/staff`) and activate through the same OTP flow. Business rules around account activation, OTP attempts, and session lifecycle are in `../02_Business_Domain/Business_Rules.md`.

## Technical Design

### Endpoint matrix

All requests and responses use `application/json`. Auth-related requests are rate-limited per IP+email using Bucket4j (see `AppSecurityProperties`).

| Method | Path | Role | Response envelope | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | PUBLIC | `ApiResponseDTO<UserResponseDTO>` | `201 Created`; sends OTPs to email + phone |
| POST | `/api/auth/verify-otp` | PUBLIC | `ApiResponseDTO<UserResponseDTO>` | Activates the account |
| POST | `/api/auth/resend-otp` | PUBLIC | `ApiResponseDTO<ResendOtpResponseDTO>` | Only when the previous OTP expired |
| POST | `/api/auth/login` | PUBLIC | `ApiResponseDTO<LoginResponseDTO>` | Sets the `refresh_token` cookie |
| POST | `/api/auth/forgot-password` | PUBLIC | `ApiResponseDTO<String>` | Sends password-reset OTPs |
| POST | `/api/auth/reset-password` | PUBLIC | `ApiResponseDTO<String>` | Resets password with both OTPs |
| POST | `/api/auth/refresh` | Cookie only | `ApiResponseDTO<RefreshResponseDTO>` | Rotates the refresh cookie |
| POST | `/api/auth/logout` | Cookie only | `ApiResponseDTO<String>` | Revokes token, clears cookie |

### Request bodies

#### POST /api/auth/register

`UserRequestDTO`:

```json
{
  "fullName": "Neha Desai",
  "email": "neha.desai@example.com",
  "password": "Customer@123",
  "mobileNumber": "+919877889900"
}
```

Validation (from `UserRequestDTO.java`):

| Field | Rule |
|---|---|
| `fullName` | required, 2–100 chars, letters/spaces only (`^[a-zA-Z\s]*$`) |
| `email` | required, valid email |
| `password` | required, `^(?=.*[A-Za-z])(?=.*\d).{8,64}$` — 8–64 chars, at least one letter and one digit |
| `mobileNumber` | required, international format `^\+[1-9]\d{7,14}$` (e.g. `+919877889900`) |

#### POST /api/auth/verify-otp

`VerifyOtpRequest`:

```json
{
  "email": "neha.desai@example.com",
  "emailOtp": "123456",
  "phoneOtp": "654321"
}
```

Both OTPs are required and verified against the `otp_verifications` record.

#### POST /api/auth/resend-otp

`ResendOtpRequestDTO`:

```json
{
  "email": "meena.iyer@example.com",
  "phone": "+919866778899"
}
```

Rejected with `400` while a valid OTP is still active; resend cooldown is 60 s.

#### POST /api/auth/login

`LoginRequestDTO`:

```json
{
  "email": "rajesh.sharma@example.com",
  "password": "Customer@123"
}
```

Successful login returns `200` with an `ApiResponseDTO<LoginResponseDTO>` and sets the `refresh_token` cookie. The refresh token is `@JsonIgnore` in the DTO — it is **never** present in the JSON body.

```json
{
  "message": "User logged in successfully.",
  "success": true,
  "data": {
    "userId": 4,
    "fullName": "Rajesh Sharma",
    "email": "rajesh.sharma@example.com",
    "role": "ROLE_CUSTOMER",
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer"
  },
  "timeStamp": "2026-08-03T10:00:00"
}
```

The user must be active and email/phone verified before login succeeds.

#### POST /api/auth/forgot-password

`ForgotPasswordRequestDTO` — only `email`.

```json
{ "email": "rajesh.sharma@example.com" }
```

#### POST /api/auth/reset-password

`ResetPasswordRequestDTO`:

```json
{
  "email": "rajesh.sharma@example.com",
  "emailOtp": "123456",
  "phoneOtp": "654321",
  "newPassword": "NewPass@123"
}
```

`newPassword` follows the same rule as registration (8–64 chars, letters + digits).

#### POST /api/auth/refresh

No request body. Requires the `refresh_token` HttpOnly cookie; a missing or blank cookie returns `401` "Session expired. Please sign in again."

Response is `ApiResponseDTO<RefreshResponseDTO>`:

```json
{
  "message": "Session refreshed successfully.",
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer"
  },
  "timeStamp": "2026-08-03T10:10:00"
}
```

The rotated refresh token is written back into the cookie by the controller.

#### POST /api/auth/logout

No request body. Revokes the refresh token server-side and clears the `refresh_token` cookie.

### The refresh_token cookie contract

Set by `RefreshTokenCookieManager`:

| Attribute | Value | Rationale |
|---|---|---|
| Name | `refresh_token` | constant `COOKIE_NAME` |
| HttpOnly | `true` | not readable by JavaScript (XSS mitigation) |
| Path | `/api/auth` | cookie is only ever sent to refresh and logout |
| SameSite | `Lax` | not attached to cross-site POSTs (CSRF mitigation) |
| Secure | `app.security.jwt.refresh-cookie-secure` | `false` in dev, must be `true` over HTTPS |
| Max-Age | 7 days | `app.security.jwt.refresh-token-ttl-days` |

Refresh tokens are **rotated on every use**: each `login` and `refresh` issues a new token and writes it to the cookie. Reuse of a rotated (already consumed) token revokes the entire token family. A `CookieCsrfOriginFilter` additionally validates the `Origin` header on `POST /api/auth/refresh` and `POST /api/auth/logout`, returning `403` on mismatch.

**Client requirement**: browsers only store/send the cookie when requests are made with `withCredentials: true` (axios `withCredentials`), and the server's CORS configuration must allow the frontend origin (`http://localhost:5173`).

### OTP delivery

- 6-digit OTPs generated per user per channel.
- Email OTP via Gmail SMTP; SMS OTP via Twilio.
- In local development, when Twilio is not configured, the SMS OTP is logged to the server console; both OTPs are also readable from the `otp_verifications` table.
- OTP validity 5 minutes, max 5 attempts, resend cooldown 60 s.

### Rate limits

Per-IP+email Bucket4j buckets on all `/api/auth` mutating endpoints. Default capacity 5, refill 5/min (see `AppSecurityProperties.RateLimit`). Exceeding the bucket returns `429` with `errorType: "RATE_LIMITED"`.

### 401 handling and the refresh dance

| Scenario | HTTP | Message |
|---|---|---|
| Missing/expired/invalid access token | `401` | "Authentication failed. Please login again." |
| Missing refresh cookie on `/refresh` | `401` | "Session expired. Please sign in again." |
| Bad credentials | `401` | "Invalid credentials or account unavailable." |
| Rate limit exceeded | `429` | rate-limit message |

The SPA client (`src/api/axiosInstance.js`) reacts to `401` by running a **single-flight refresh**: it calls `POST /api/auth/refresh` once (cookie included) and replays the failed request a single time. If the refresh fails, the client dispatches `auth:unauthorized` and routes the user to `/login`. `403` dispatches `auth:forbidden`.

## Workflow

1. Register a customer: `POST /api/auth/register`.
2. Activate the account: `POST /api/auth/verify-otp` with both OTPs.
3. (Optional) resend expired OTPs: `POST /api/auth/resend-otp`.
4. Log in: `POST /api/auth/login`; store the access token in memory (`src/api/tokenStore.js`) and keep the refresh cookie.
5. On `401`, call `POST /api/auth/refresh` (cookie) and retry.
6. Log out: `POST /api/auth/logout`; clear the local session.
7. Forgotten password: `POST /api/auth/forgot-password`, then `POST /api/auth/reset-password`.

## Code References

| Concern | Path |
|---|---|
| Controller | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/AuthController.java` |
| Security rules | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java` |
| Refresh cookie | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RefreshTokenCookieManager.java` |
| Rate limits | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/RateLimitFilter.java`, `config/AppSecurityProperties.java` |
| CSRF origin check | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/CookieCsrfOriginFilter.java` |
| Request DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/{UserRequestDTO,VerifyOtpRequest,ResendOtpRequestDTO,LoginRequestDTO,ForgotPasswordRequestDTO,ResetPasswordRequestDTO}.java` |
| Response DTOs | `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/{LoginResponseDTO,RefreshResponseDTO,ResendOtpResponseDTO,UserResponseDTO}.java` |
| Sample payloads | `demo-data/api-test-payloads/01-auth.json` |

## Diagrams

Refresh-token lifecycle and the 401 refresh dance are covered in `../09_Diagrams/` and `../08_Workflows/Authentication_Flow.md`.

## Best Practices

- Refresh tokens never travel in JSON; HttpOnly + SameSite=Lax + path-scoped cookie is defense-in-depth.
- Rotation plus family revocation bounds the impact of a stolen cookie.
- Dual-channel OTP plus per-IP+email rate limiting mitigates account takeover and brute force.
- Token-version checking on every request immediately blocks deactivated users.

## Future Improvements

- Enable `refresh-cookie-secure` and HSTS once deployed behind TLS.
- Consider keyed rate-limit buckets per account in addition to IP.
- Link to `../10_Evaluation/Future_Enhancements.md`.

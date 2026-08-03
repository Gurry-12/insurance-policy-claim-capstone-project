# Authentication

## What It Is
- The process of verifying a claimed identity before any authorization decision. Here it is password-based (email + password) with mandatory dual-channel OTP verification (email + SMS) before an account becomes active.
- Passwords are stored as BCrypt hashes via a `BCryptPasswordEncoder` bean; login uses Spring Security's `DaoAuthenticationProvider`.
- Successful login issues an access JWT plus an opaque refresh token; there is no server-side session (stateless).

## Why It Is Used
- Protects the API: only verified, active users obtain tokens.
- Dual OTP (email + SMS) raises assurance at registration and password reset, and is rate-limited per IP + email using Bucket4j.
- Stateless tokens keep authentication scalable and auditable through `SecurityAuditLogger`.

## Where It Is Used in This Project
- `controller/AuthController.java`: `POST /api/auth/login`, `/register`, `/verify-otp`, `/resend-otp`, `/forgot-password`, `/reset-password`, `/refresh`, `/logout`.
- `serviceimpl/AuthServiceImpl.java`: `login`, `registerUser`, `verifyOtp`, `resendOtp`, `forgotPassword`, `resetPassword`, `refresh`, `logout`.
- `security/CustomUserDetailsService.java` + `security/AppUserDetails.java`: load user identity and authorities from the database.
- `config/SecurityConfig.java`: `DaoAuthenticationProvider` wired with `BCryptPasswordEncoder`.
- `verification/OtpService.java`: 6-digit OTPs, 5-minute expiry, max 5 attempts, 60-second resend cooldown, delivered via `EmailService` and `SmsService`.
- `security/JwtAuthenticationFilter.java`: re-establishes identity on each request from the bearer token.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/AuthController.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/AuthServiceImpl.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/verification/OtpService.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/config/SecurityConfig.java

## Related Docs
- ../03_API/Authentication_API.md
- ../06_Backend/Security.md
- ../01_System_Architecture/Security_Architecture.md
- ../06_Backend/JWT.md

## Common Interview Questions
1. Walk through the login flow. — Controller → `AuthServiceImpl.login` checks email exists, email/phone verified, and account active, then `AuthenticationManager` validates credentials with BCrypt; on success a JWT and refresh token are issued.
2. Why is a newly registered account inactive? — Until both the email and phone OTP are verified, `isActive=false` blocks login; `verifyOtp` activates the account.
3. How are passwords stored? — BCrypt hashes only; plain text is never persisted or logged.
4. What prevents brute-force on auth endpoints? — The `RateLimitFilter` applies Bucket4j buckets keyed by client IP + email to login, register, OTP, forgot/reset, and refresh paths.
5. What happens after a password reset? — `tokenVersion` is incremented, which invalidates existing access tokens, and all refresh tokens are revoked so the user must log in again.

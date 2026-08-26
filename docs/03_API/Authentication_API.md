> The secure gateway to InsuranceFlow, managing registration, login, dual-OTP verification, and token lifecycles.

---

## Purpose
This document details the Authentication API endpoints for InsuranceFlow. It handles the complete lifecycle of user identity, covering registration, login, JWT issuance, secure token refresh, and password management with dual-OTP (Email/SMS) verification.

---

## Overview
- **Registration & Verification**: Users register and verify identity via a 6-digit OTP sent to email and SMS.
- **Login & Tokens**: Login issues a short-lived access token (JWT) and a secure HTTP-only refresh token.
- **Token Refresh**: Seamless renewal of access tokens using the refresh token, with rotation on use.
- **Password Management**: Forgot/Reset password flows secured by OTP.
- **Rate Limiting**: Applied via Bucket4j per IP/email to prevent brute force attacks.

---

## Business Context
Security is paramount in an insurance system handling sensitive user data and policies. The authentication flow ensures strict identity verification using dual OTPs and secures API access via short-lived JWTs, minimizing the attack surface while maintaining a smooth user experience.

---

## Feature Flow
```mermaid
flowchart TD
    A[User Submits Credentials] --> B{Login or Register?}
    B -- Register --> C[Create Pending User]
    C --> D[Generate & Send OTP (Email/SMS)]
    D --> E[User Enters OTP]
    E --> F{OTP Valid?}
    F -- Yes --> G[Activate Account]
    F -- No --> H[Reject Registration]
    
    B -- Login --> I[Verify Credentials]
    I --> J{Valid?}
    J -- No --> K[Reject Login]
    J -- Yes --> L[Issue Access JWT & HTTP-Only Refresh Token]
```

---

## System Flow
```mermaid
flowchart TD
    A[React Client] --> B[AuthController]
    B --> C[AuthService]
    C --> D[UserRepository]
    C --> E[OtpService (Email/SMS)]
    C --> F[JwtTokenProvider]
    C --> G[RefreshTokenService]
    G --> H[(MySQL Database)]
    F --> I[(Redis - Blacklist/Cache)]
```

---

## Sequence Diagram
> [!NOTE]
> Please refer to `../02_Business_Domain/Authentication_Flow.md` for the comprehensive authentication sequence diagrams.

---

## Database Design
- **Users Table**: Stores identity, hashed passwords, roles, and status (PENDING/ACTIVE).
- **Refresh_Tokens Table**: Stores opaque hashed tokens mapped to users, with expiry and rotation tracking.

---

## API Documentation

### 1. Register User
| Field | Value |
|---|---|
| Purpose | Initiates user registration. Account created in PENDING state. |
| Method | POST |
| URL | `/api/auth/register` |
| Auth Required | No |
| Request Body | `{ "email": "x@x.com", "password": "...", "phone": "..." }` |
| Response | `ApiResponseDTO` with user details |
| Validation | Valid email, strong password (regex), valid phone number |
| Possible Errors | `400 Email already in use` |
| Business Logic | Hashes password, saves user as PENDING, generates 6-digit OTP, sends via Email & SMS. |
| Frontend Screen | Register Page |

### 2. Verify OTP
| Field | Value |
|---|---|
| Purpose | Verifies the OTP sent during registration or password reset. |
| Method | POST |
| URL | `/api/auth/verify-otp` |
| Auth Required | No |
| Request Body | `{ "email": "x@x.com", "emailOtp": "123456", "phoneOtp": "654321" }` |
| Response | `ApiResponseDTO` with activated user details |
| Validation | Both emailOtp and phoneOtp must be 6 digits |
| Possible Errors | `400 Invalid OTP`, `400 OTP Expired`, `400 Max attempts reached` |
| Business Logic | Verifies both email OTP and phone OTP. Sets emailVerified=true, phoneVerified=true, isActive=true on the AppUser. |
| Frontend Screen | OTP Verification Modal |

### 3. Resend OTP
| Field | Value |
|---|---|
| Purpose | Generates and sends a new OTP. |
| Method | POST |
| URL | `/api/auth/resend-otp` |
| Auth Required | No |
| Request Body | `{ "email": "x@x.com", "phone": "+91XXXXXXXXXX" }` |
| Response | `ApiResponseDTO` with OTP sent confirmation |
| Validation | Valid email format, valid phone number |
| Possible Errors | `404 User not found`, `429 Rate limit exceeded` |
| Business Logic | Invalidates old OTP, generates new 6-digit OTP for both email and phone, resets attempt count. |
| Frontend Screen | OTP Verification Modal |

### 4. Login
| Field | Value |
|---|---|
| Purpose | Authenticates user and issues tokens. |
| Method | POST |
| URL | `/api/auth/login` |
| Auth Required | No |
| Request Body | `{ "email": "x@x.com", "password": "..." }` |
| Response | `ApiResponseDTO` containing Access JWT in body and Refresh Token in HTTP-only Cookie. |
| Validation | Non-empty fields |
| Possible Errors | `401 Bad credentials`, `403 Account not verified` |
| Business Logic | Authenticates via AuthenticationManager, generates 15-min JWT, generates 7-day refresh token, attaches secure cookie. |
| Frontend Screen | Login Page |

### 5. Refresh Token
| Field | Value |
|---|---|
| Purpose | Renews the access token using a valid refresh token. |
| Method | POST |
| URL | `/api/auth/refresh` |
| Auth Required | No (Relies on Cookie) |
| Request Body | None |
| Response | `ApiResponseDTO` with new Access JWT, new Refresh Token Cookie. |
| Validation | Valid HTTP-Only Cookie present |
| Possible Errors | `401 Refresh token expired`, `401 Invalid token` |
| Business Logic | Validates refresh token from cookie, checks DB. Rotates token (invalidates old, issues new), generates new JWT. |
| Frontend Screen | Handled silently by Axios Interceptor |

### 6. Logout
| Field | Value |
|---|---|
| Purpose | Ends the user session. Revokes the current refresh token and blacklists the access token. |
| Method | POST |
| URL | `/api/auth/logout` |
| Auth Required | Yes |
| Request Body | None |
| Response | `ApiResponseDTO` |
| Business Logic | Revokes current refresh token in DB, blacklists current access JWT in Redis (best-effort), clears HttpOnly cookie. |
| Frontend Screen | Navbar/Sidebar Logout Button |

### 7. Logout All Sessions
| Field | Value |
|---|---|
| Purpose | Revokes all active refresh tokens for the authenticated user. Forces logout on all devices. |
| Method | POST |
| URL | `/api/auth/logout-all` |
| Auth Required | Yes |
| Request Body | None |
| Response | `ApiResponseDTO` |
| Business Logic | Revokes all `RefreshToken` records for the user in DB. Increments `tokenVersion` to invalidate any outstanding JWTs. |
| Frontend Screen | Security Settings Page |

### 8. Forgot Password
| Field | Value |
|---|---|
| Purpose | Initiates the password reset flow by sending an OTP. |
| Method | POST |
| URL | `/api/auth/forgot-password` |
| Auth Required | No |
| Request Body | `{ "email": "x@x.com" }` |
| Response | `ApiResponseDTO` |
| Validation | Valid email |
| Possible Errors | `404 Email not found` |
| Business Logic | Generates and sends OTP to the user's email and phone. |
| Frontend Screen | Forgot Password Page |

### 9. Reset Password
| Field | Value |
|---|---|
| Purpose | Sets a new password after OTP verification. |
| Method | POST |
| URL | `/api/auth/reset-password` |
| Auth Required | No |
| Request Body | `{ "email": "x@x.com", "newPassword": "..." }` |
| Response | `ApiResponseDTO` |
| Validation | Password strength regex |
| Possible Errors | `403 OTP not verified yet` |
| Business Logic | Checks if reset flow is authorized (OTP verified flag in Redis), hashes new password, updates DB. |
| Frontend Screen | Reset Password Page |

---

### OTP Lifecycle Table
| Phase | Action |
|---|---|
| Generation | 6 random digits, mapped to Email + Context. |
| Transmission | Sent concurrently via Gmail SMTP and Twilio SMS. |
| Validation | Checked against stored value. Fails if attempts > 5. |
| Expiration | Hard expiry at 5 minutes (TTL via Redis). |

### Token Lifecycle Table
| Token Type | Storage | TTL | Behavior on Rotation/Expiry |
|---|---|---|---|
| Access Token (JWT) | Memory (Frontend) | 15 min | Must call `/refresh` endpoint when expired. |
| Refresh Token | DB (Backend) & HTTP-Only Cookie (Client) | 7 days | Rotated (replaced) upon every successful refresh call. |

---

## Frontend Implementation
- **Pages**: `src/pages/auth/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`
- **Context**: `AuthContext.jsx` manages global user state and role.
- **Interceptors**: Axios handles 401s by pausing queued requests, calling `/api/auth/refresh`, and retrying.

---

## Backend Implementation
- **Controllers**: `AuthController.java`
- **Services**: `AuthService.java`, `JwtService.java`, `RefreshTokenService.java`, `OtpService.java`
- **Security**: Filters in `SecurityConfig.java`, Token parsing in `JwtAuthenticationFilter.java`

---

## Business Rules
| Rule | Reason |
|---|---|
| Dual OTP Verification | Ensures high assurance of identity for insurance operations. |
| Refresh Token Rotation | If a refresh token is stolen, using it invalidates the chain, alerting the user to re-authenticate. |
| Token Blacklisting | Allows immediate session termination upon logout, mitigating JWT's stateless nature. |

---

## Validation Rules
- **Passwords**: Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
- **OTP**: Strictly 6 numeric characters.

---

## Error Handling
- Invalid login returns generic `Bad credentials` to prevent account enumeration.
- Rate limiting returns `429 Too Many Requests`.

---

## Design Decisions
1. **Why HTTP-Only Cookies for Refresh Tokens?**
   Prevents XSS attacks from accessing the long-lived refresh token.
2. **Why rotate refresh tokens on every use?**
   It allows the system to detect token theft. If an old token is reused, the entire token family is revoked.
3. **Why Dual OTP?**
   Insurance platforms require high trust; verifying both email and phone covers base communication channels.

---

## Code References
| Component | Path |
|---|---|
| Auth Controller | `com.insurance.demo.controller.AuthController` |
| JWT Service | `com.insurance.demo.security.JwtService` |
| Refresh Token Service | `com.insurance.demo.security.RefreshTokenService` |
| OTP Service | `com.insurance.demo.verification.OtpService` |

---

## Interview Notes
1. **Q: How do you prevent brute-force attacks on the login API?**
   **A:** By implementing Bucket4j rate limiting based on IP and email, along with tracking failed attempts.
2. **Q: Explain the token refresh flow.**
   **A:** When the short-lived JWT expires, the frontend intercepts the 401, calls the `/refresh` endpoint, which reads the HTTP-only cookie, validates the refresh token in the database, rotates it, and issues a new JWT.
3. **Q: Why not store the JWT in local storage?**
   **A:** Local storage is vulnerable to XSS. We store the short-lived JWT in memory, and the long-lived refresh token in an HTTP-only cookie.
4. **Q: What happens if a refresh token is stolen?**
   **A:** Due to refresh token rotation, when the legitimate user or attacker uses an invalidated token, the system detects a breach and revokes all tokens for that user.
5. **Q: How does OTP verification work across distributed servers?**
   **A:** OTPs are stored in Redis with a 5-minute TTL, making them accessible across all instances of the application.
6. **Q: How do you handle JWT revocation on logout since JWTs are stateless?**
   **A:** We add the JWT's unique identifier (JTI) to a Redis blacklist with a TTL matching its remaining validity time.
7. **Q: How are passwords stored?**
   **A:** Passwords are hashed using BCrypt before storing in the database.
8. **Q: Why use a dedicated PENDING status for new users?**
   **A:** It prevents unverified users from accessing the system while retaining their registration details for OTP verification.

---

## Related Documents
- `../02_Business_Domain/Authentication_Flow.md`
- `API_Flow.md`

---

## Future Enhancements
- Add WebAuthn/Passkey support for passwordless login.

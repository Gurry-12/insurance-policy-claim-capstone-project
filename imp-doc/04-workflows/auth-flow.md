# Authentication Flow

## Purpose

This document explains every authentication workflow — user registration, email/phone OTP verification, login, forgot password, and password reset — with step-by-step execution traces and business rules.

---

## Components Involved

| Component | File | Role |
|---|---|---|
| `AuthController` | `controller/AuthController.java` | HTTP entry points |
| `AuthService` | `service/AuthService.java` | Interface contract |
| `AuthServiceImpl` | `serviceimpl/AuthServiceImpl.java` | Business logic |
| `OtpService` | `verification/OtpService.java` | OTP lifecycle management |
| `EmailService` | `verification/EmailService.java` | HTML email delivery |
| `SmsService` | `verification/SmsService.java` | SMS delivery via Twilio |
| `JwtService` | `security/JwtService.java` | Token generation |
| `AppUserRepository` | `repository/AppUserRepository.java` | User persistence |
| `OtpVerificationRepository` | `repository/OtpVerificationRepository.java` | OTP persistence |

---

## Workflow 1: Customer Registration

### Business Rules
- Only customers can self-register (staff accounts are created by Admin)
- Email must be unique (case-insensitive — stored lowercase)
- Mobile number must be unique
- New accounts are created with `isActive=false`, `emailVerified=false`, `phoneVerified=false`
- An empty `Customer` profile is auto-created at registration
- OTP is sent to both email and phone immediately after registration

### Step-by-Step Execution

```
POST /api/auth/register
     │
     ▼ AuthController.registerUser(@Valid @RequestBody UserRequestDTO)
     │  ← @Valid triggers Jakarta Bean Validation
     │  ← If validation fails → 400 with ValidationErrorResponseDTO
     │
     ▼ AuthServiceImpl.registerUser(dto)
     │
     ├─ Check: userRepository.existsByEmail(dto.getEmail())
     │   └─ YES → throw DuplicateResourceException(EMAIL_ALREADY_REGISTERED) → 409
     │
     ├─ Check: userRepository.existsByMobileNumber(dto.getMobileNumber())
     │   └─ YES → throw DuplicateResourceException → 409
     │
     ├─ ModelMapper.map(dto, AppUser.class)
     │   └─ Maps all DTO fields to entity
     │
     ├─ email.toLowerCase()               ← normalize email
     ├─ passwordEncoder.encode(dto.getPassword())   ← BCrypt hash
     ├─ role = ROLE_CUSTOMER              ← always customer from self-registration
     ├─ isActive = false                  ← account blocked until OTP verified
     ├─ emailVerified = false
     ├─ phoneVerified = false
     │
     ├─ userRepository.save(user)         ← persist AppUser
     │
     ├─ Create empty Customer entity linked to user
     │   └─ customerRepository.save(emptyCustomer) ← profile to be completed later
     │
     ├─ otpService.createAndSendOtp(savedUser)
     │   ├─ Generate 6-digit emailOtp (SecureRandom)
     │   ├─ Generate 6-digit phoneOtp (SecureRandom)
     │   ├─ Save OtpVerification (expiresAt = now + 5 min)
     │   ├─ emailService.sendOtp(email, emailOtp, isStaff=false)
     │   │   └─ Sends branded HTML email via Gmail SMTP
     │   └─ smsService.sendOtp(mobileNumber, phoneOtp)
     │       └─ Sends SMS via Twilio
     │
     └─ Return ApiResponseDTO<UserResponseDTO> (201 Created)
```

### Request DTO: `UserRequestDTO`
```
fullName     - @NotBlank, @Pattern(letters+spaces), @Size(2-100)
email        - @NotBlank, @Email
password     - @NotBlank
mobileNumber - @NotBlank, @Pattern(international format: +91XXXXXXXXXX)
```

### Response: `UserResponseDTO`
```
id, fullName, email, mobileNumber, role, isActive, createdDate
```

---

## Workflow 2: OTP Verification (Account Activation)

### Business Rules
- Both email OTP and phone OTP must be correct
- OTP expires after 5 minutes
- Already-active accounts cannot re-verify (prevents re-triggering)
- On success: `emailVerified=true`, `phoneVerified=true`, `isActive=true`

### Step-by-Step Execution

```
POST /api/auth/verify-otp
{ "email": "...", "emailOtp": "123456", "phoneOtp": "654321" }
     │
     ▼ AuthServiceImpl.verifyOtp(VerifyOtpRequest)
     │
     ├─ Find user by email
     │   └─ NOT FOUND → throw ResourceNotFoundException → 404
     │
     ├─ If user.isActive == true
     │   └─ throw BadRequestException(OTP_EXPIRED) → 400
     │   (Rationale: active accounts don't need re-verification)
     │
     ├─ otpService.verifyOtp(user, emailOtp, phoneOtp)
     │   ├─ Find latest OTP for user (by createdAt DESC)
     │   ├─ If expiresAt < now → throw BadRequestException(OTP_EXPIRED)
     │   ├─ If emailOtp mismatch → throw BadRequestException(INVALID_EMAIL_OTP)
     │   ├─ If phoneOtp mismatch → throw BadRequestException(INVALID_PHONE_OTP)
     │   └─ Mark OTP as used (latestOtp.used = true)
     │
     ├─ user.emailVerified = true
     ├─ user.phoneVerified = true
     ├─ user.isActive = true
     └─ userRepository.save(user)
     
     Response: ApiResponseDTO<UserResponseDTO> (account now active)
```

---

## Workflow 3: Resend OTP

### Business Rules
- Max 4 OTP sends per user in any rolling 24-hour window
- Must wait at least 60 seconds between each resend
- If existing OTP is still valid (not expired, not used) → resend the SAME OTP
- If existing OTP is expired or used → generate a NEW OTP
- Already-active accounts cannot request OTP resend

### OTP Rate Limiting Logic
```
OtpService.sendOrResendOtp(user):
  1. Count total OTPs sent in last 24h
     → IF >= 4: throw BadRequestException(OTP_LIMIT_EXCEEDED)
  2. Find latest OTP (by createdAt DESC)
     → IF lastSentAt + 60s > now: throw BadRequestException(OTP_RETRY_WAIT)
  3. IF latestOtp is not used AND not expired:
     → Increment sendCount, update lastSentAt, RESEND same OTP
  4. ELSE (expired or used):
     → createAndSendOtp(user) ← generates fresh OTP
```

---

## Workflow 4: Login

### Business Rules
- Email is case-insensitive (normalized to lowercase)
- Account must be active (`isActive=true`)
- Email must be verified
- Phone must be verified
- Password is verified with BCrypt
- On success: JWT token is generated with email, role, fullName, productSpeciality

### Step-by-Step Execution

```
POST /api/auth/login
{ "email": "user@example.com", "password": "<raw-password>" }
     │
     ▼ AuthServiceImpl.login(LoginRequestDTO)
     │
     ├─ email = email.toLowerCase()
     │
     ├─ Find user by email
     │   └─ NOT FOUND → throw BadRequestException(INVALID_CREDENTIALS) → 400
     │
     ├─ IF !emailVerified → throw BadRequestException(EMAIL_NOT_VERIFIED) → 400
     │
     ├─ IF !phoneVerified → throw BadRequestException(PHONE_NOT_VERIFIED) → 400
     │
     ├─ IF !isActive → throw BadRequestException(ACCOUNT_DEACTIVATED) → 400
     │
     ├─ authenticationManager.authenticate(UsernamePasswordAuthenticationToken)
     │   ├─ Triggers CustomUserDetailsService.loadUserByUsername(email)
     │   ├─ Compares BCrypt hash
     │   └─ IF mismatch → throws BadCredentialsException → 401
     │
     ├─ Get productSpeciality from staffSpeciality (null for CUSTOMER/ADMIN)
     │
     ├─ jwtService.generateToken(userDetails, fullName, productSpeciality)
     │
     ├─ userService.findByEmail(email) ← load full user response
     │
     └─ Return ApiResponseDTO<LoginResponseDTO> (200 OK)
         { id, fullName, email, role, token, tokenType="Bearer" }
```

### Login Response: `LoginResponseDTO`
```
id           - user ID
fullName     - display name
email        - login email
role         - ROLE_CUSTOMER | ROLE_INTERNAL_STAFF | ROLE_ADMIN
token        - JWT token
tokenType    - "Bearer"
```

### Frontend Usage
```
// Store token in memory (not localStorage for security)
// Include in all subsequent requests:
Authorization: Bearer <token>
```

---

## Workflow 5: Forgot Password

### Business Rules
- User only needs to provide email
- OTP is sent to both email and phone
- Same OTP rate limiting applies (max 4 / 24h, 60s cooldown)
- Triggers `sendOrResendOtp` — will resend same OTP if still valid

### Step-by-Step Execution

```
POST /api/auth/forgot-password
{ "email": "user@example.com" }
     │
     ▼ AuthServiceImpl.forgotPassword(ForgotPasswordRequestDTO)
     │
     ├─ Find user by email (lowercase)
     │   └─ NOT FOUND → throw ResourceNotFoundException → 404
     │
     ├─ otpService.sendOrResendOtp(user)
     │   └─ Rate limit checked, OTP sent to email + phone
     │
     └─ Return ApiResponseDTO<String>(FORGOT_PASSWORD_OTP, null) → 200
```

---

## Workflow 6: Reset Password

### Business Rules
- Requires: email, emailOtp, phoneOtp, newPassword
- Both OTPs must be valid
- On success: password is updated, account is activated if it was inactive
- OTP rate limiting applies to the resend step (not reset step)

### Step-by-Step Execution

```
POST /api/auth/reset-password
{ "email": "...", "emailOtp": "...", "phoneOtp": "...", "newPassword": "<password>" }
     │
     ▼ AuthServiceImpl.resetPassword(ResetPasswordRequestDTO) [@Transactional]
     │
     ├─ Find user by email (lowercase)
     │
     ├─ otpService.verifyOtp(user, emailOtp, phoneOtp)
     │   └─ Validates both OTPs (same logic as account activation)
     │
     ├─ IF user.isActive == false:
     │   ├─ emailVerified = true
     │   ├─ phoneVerified = true
     │   └─ isActive = true  ← Also activates account if previously inactive
     │
     ├─ passwordEncoder.encode(newPassword) ← BCrypt hash
     ├─ user.password = hashedPassword
     └─ userRepository.save(user)
     
     Response: ApiResponseDTO<String>(PASSWORD_RESET_SUCCESS) → 200
```

---

## OTP Entity Structure

```java
OtpVerification {
    id             // PK
    user           // @ManyToOne → AppUser
    emailOtp       // 6-digit string
    phoneOtp       // 6-digit string
    expiresAt      // LocalDateTime (now + 5 min)
    used           // boolean (false until verified)
    sendCount      // incremented on each resend
    lastSentAt     // for 60-second cooldown check
    createdAt      // set by @PrePersist
}
```

---

## ASCII Sequence Diagram: Registration + OTP

```
Client          AuthController   AuthServiceImpl   OtpService   EmailService   SmsService   Database
  │                   │                │               │              │              │           │
  │ POST /register    │                │               │              │              │           │
  │──────────────────►│                │               │              │              │           │
  │                   │ registerUser() │               │              │              │           │
  │                   │───────────────►│               │              │              │           │
  │                   │                │ existsByEmail │              │              │           │
  │                   │                │───────────────────────────────────────────────────────►│
  │                   │                │◄──────────────────────────────────────────────────────│
  │                   │                │ save(user)    │              │              │           │
  │                   │                │───────────────────────────────────────────────────────►│
  │                   │                │ save(customer)│              │              │           │
  │                   │                │───────────────────────────────────────────────────────►│
  │                   │                │ createOtp()   │              │              │           │
  │                   │                │──────────────►│              │              │           │
  │                   │                │               │ save(otp)    │              │           │
  │                   │                │               │─────────────────────────────────────►  │
  │                   │                │               │ sendOtp(email)              │           │
  │                   │                │               │─────────────►│              │           │
  │                   │                │               │ sendOtp(sms) │              │           │
  │                   │                │               │──────────────────────────►  │           │
  │ 201 Created       │                │               │              │              │           │
  │◄──────────────────│                │               │              │              │           │
```

---

## Common Mistakes & Debugging

| Symptom | Likely Cause | Fix |
|---|---|---|
| Login returns 400 "email not verified" | User registered but didn't verify OTP | Call `POST /api/auth/verify-otp` |
| Login returns 400 "account deactivated" | Admin deactivated the account | Admin must reactivate |
| OTP not received | Email/SMS config wrong | Check `env.properties` credentials |
| "OTP limit exceeded" | Too many OTP requests | Wait 24h or check `otp_verifications` table |
| Password reset fails with "OTP not found" | OTP expired | Request new OTP via forgot-password |
| 409 on registration | Email or phone already exists | Use different credentials |

---

## Related Documents

- [security-diagrams](../07-diagrams/security-diagrams.md)
- [database-overview](../03-database/database-overview.md)
- [backend-api-contract](../01-api-contracts/backend-api-contract.md)

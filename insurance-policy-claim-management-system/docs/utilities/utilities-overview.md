# Utilities Overview

## Purpose

This document explains all utility classes, generators, validators, and constants used across the system.

---

## MessageConstants

**File:** `util/MessageConstants.java`

The most important utility class in the system. Centralizes every user-facing message string.

### Structure

```java
public final class MessageConstants {
    private MessageConstants() {} // Non-instantiable

    public static final class Auth { ... }        // 22 constants
    public static final class Customer { ... }    // 7 constants
    public static final class Product { ... }     // 12 constants
    public static final class PolicyPlan { ... }  // 18 constants
    public static final class Policy { ... }      // 9 constants
    public static final class Payment { ... }     // 13 constants
    public static final class Claim { ... }       // 17 constants
    public static final class ClaimReview { ... } // 11 constants
    public static final class Document { ... }    // 8 constants
    public static final class Common { ... }      // 8 constants
    public static final class Security { ... }    // 16 constants
    public static final class Validation { ... }  // 35 constants
}
```

### Why this design?

1. **No magic strings** — eliminates typos in error messages
2. **Centralized auditing** — all messages reviewable in one file
3. **Consistent UX** — same message for the same error, always
4. **Future i18n ready** — can be refactored to resource bundles

### Key constant groups

**Auth constants** control all authentication flow messages:
```java
Auth.INVALID_CREDENTIALS     = "Invalid email or password."
Auth.EMAIL_NOT_VERIFIED      = "Please verify your email address before logging in."
Auth.OTP_LIMIT_EXCEEDED      = "You have reached the maximum limit of 4 OTP requests in the last 24 hours."
Auth.OTP_RETRY_WAIT          = "Please wait at least 60 seconds before requesting another OTP."
```

**Security constants** control all access-denied messages:
```java
Security.STAFF_SPECIALITY_ACCESS_DENIED = "You are not authorized to perform actions on claims outside your product speciality."
Security.NOT_OWN_POLICY                 = "You are not allowed to access another customer's policy details."
Security.REVIEW_ASSIGNED_TO_OTHER       = "You are not authorized to review this claim. It is assigned to another staff member."
```

**Claim/ClaimReview constants** control the claim lifecycle messages:
```java
Claim.EXCEEDS_LIMIT              = "The requested claim amount exceeds your remaining policy coverage of "
Claim.POLICY_NOT_OWNED           = "Claims can only be filed against your own active policies."
ClaimReview.MUST_BE_REVIEWED_FIRST = "The claim must be reviewed and recommended by an Internal Staff before a final decision."
```

---

## PolicyNumberGenerator

**File:** `util/PolicyNumberGenerator.java` (inferred from usage)

**Pattern:** `POL-{timestamp}-{random}`

**Why this format?**
- `POL-` prefix identifies it as a policy number (human-readable)
- Timestamp component makes it roughly time-ordered
- Random component prevents collisions on the same millisecond

**Where used:** `PolicyServiceImpl.purchasePolicy()` and `PolicyServiceImpl.issuePolicy()`

---

## ClaimNumberGenerator

**File:** `util/ClaimNumberGenerator.java` (inferred from usage)

**Pattern:** `CLM-{timestamp}-{random}`

**Where used:** `ClaimServiceImpl.raiseClaim()`

---

## TransactionReferenceGenerator

**File:** `util/TransactionReferenceGenerator.java` (inferred from usage)

**Pattern:** `TXN-{timestamp}-{random}`

**Why auto-generated on server?** The client should not supply transaction references — this would allow replay attacks by reusing someone else's transaction ID.

**Where used:** `PremiumPaymentServiceImpl.recordPayment()`

---

## OtpService

**File:** `verification/OtpService.java`

OTP generation using `java.security.SecureRandom`:

```java
private String generateSixDigitOtp() {
    int number = secureRandom.nextInt(900000) + 100000;
    return String.valueOf(number);
}
```

**Why `SecureRandom`?** Standard `Random` is predictable (seeded from time). `SecureRandom` uses OS-level entropy and is cryptographically secure. OTPs must be unpredictable.

**Why 100000–999999?** Forces exactly 6 digits. `nextInt(900000)` gives 0-899999; adding 100000 gives 100000-999999.

### OTP Rate Limiting Constants

```
Max sends per 24 hours: 4
Minimum gap between sends: 60 seconds
OTP validity: 5 minutes (app.otp.expiry-minutes=5)
```

---

## EmailService

**File:** `verification/EmailService.java`

### Responsibility

Sends branded HTML email via Gmail SMTP (Spring Mail / JavaMailSender).

### Email Types

1. **Customer OTP email** — "Verify Your Email" — includes OTP code box only
2. **Staff OTP email** — "Welcome! Verify Your Staff Account" — includes OTP code box + CTA button with verify link

### Email Template Features

- Gradient header with insurance branding
- Stylized 6-digit OTP display box
- 5-minute validity notice
- Security warning ("Never share this OTP")
- For staff: Clickable verify link pointing to `{app.frontend.url}/verify-otp?email={encoded-email}`

### Error Handling

If SMTP fails (network error, auth error):
```java
throw new IllegalStateException("Unable to send email OTP. Root cause: "
    + rootCause.getClass().getSimpleName() + " - " + rootCause.getMessage(), ex);
```

**Effect:** Registration fails with 500 if email cannot be sent. The user is not created without OTP delivery confirmation.

---

## SmsService

**File:** `verification/SmsService.java`

### Responsibility

Sends SMS OTP via Twilio API.

### Configuration

```properties
app.twilio.account-sid=${TWILIO_SID}
app.twilio.auth-token=${TWILIO_TOKEN}
app.twilio.from-phone=${TWILIO_PHONE}
```

All stored in `env.properties` (gitignored).

---

## CloudinaryService / CloudinaryServiceImpl

**File:** `serviceimpl/CloudinaryServiceImpl.java`

### Responsibility

Uploads files (PDFs, images) to Cloudinary cloud storage.

### Returns

```java
Map<String, Object> uploadResult;
// contains:
//   "secure_url" → public Cloudinary URL
//   "public_id"  → Cloudinary internal ID (needed for deletion)
```

### Configuration

```properties
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME}
cloudinary.api-key=${CLOUDINARY_API_KEY}
cloudinary.api-secret=${CLOUDINARY_SECRET}
```

Configured via `CloudinaryConfig.java` which creates the `Cloudinary` bean.

---

## File Validation Logic

Claim document file validation is applied BEFORE any uploads:

```java
for (MultipartFile file : files) {
    // Empty file check
    if (file.isEmpty()) throw 400 CANNOT_BE_EMPTY
    
    // File name check
    if (!StringUtils.hasText(file.getOriginalFilename())) throw 400 INVALID_FILE_NAME
    
    // File type check (MIME type)
    String contentType = file.getContentType();
    if (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))
        throw 400 INVALID_FILE_TYPE_PDF_IMAGE
    
    // File size check (5MB)
    if (file.getSize() > 5 * 1024 * 1024) throw 400 EXCEEDS_SIZE_5MB
}
```

**Why validate BEFORE upload?** Saves bandwidth and Cloudinary API calls. All files are validated upfront; if ANY file fails validation, NO files are uploaded.

---

## Sort Validation

Paginated endpoints that accept `sortBy` and `sortDirection` validate input:

```java
// Sort direction validation
if (!sortDirection.equalsIgnoreCase("asc") && !sortDirection.equalsIgnoreCase("desc")) {
    throw new BadRequestException(MessageConstants.Common.SORT_DIRECTION_INVALID);
}
```

Valid `sortBy` fields are validated against a whitelist of allowed field names per endpoint to prevent SQL injection via sort fields.

---

## `@Transactional` Strategy

| Operation | Annotation |
|---|---|
| Write operations (create, update, delete) | `@Transactional` |
| Read operations | `@Transactional(readOnly = true)` |
| Multi-step write (e.g., pay → activate policy) | `@Transactional` at service method level |

**Why `readOnly = true`?** Performance optimization. Spring and Hibernate can skip dirty checking, flush operations, and in some databases enable read replicas.

---

## Related Documents

- [exceptions/exception-handling.md](../exceptions/exception-handling.md)
- [services/services-overview.md](../services/services-overview.md)

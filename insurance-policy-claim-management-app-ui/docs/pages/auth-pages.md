# Auth Pages

> **What:** The four authentication pages of InsureFlow.  
> **Why:** Entry point for all users - handles account creation, login, and password recovery.  
> **Where:** `src/pages/auth/`

---

## 1. Login Page

**File:** [`src/pages/auth/Login.jsx`](../../src/pages/auth/Login.jsx)  
**Route:** `/login`  
**Role Restriction:** Guest only (`GuestRoute`)

### Purpose

Authenticates a user by email and password. On success, stores the JWT and user object, then redirects to the role-appropriate dashboard.

### Components Used

| Component         | Purpose                           |
| ----------------- | --------------------------------- |
| `react-hook-form` | Form state and validation         |
| `LoadingButton`   | Submit button with loading state  |
| `ResendOtp`       | Modal shown if user is unverified |

### API Used

```
POST /auth/login
Body: { email: string, password: string }
Response: LoginResponseDTO { userId, fullName, email, role, token, tokenType }
```

### Validation Rules

| Field      | Rule                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| `email`    | Required, must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`                               |
| `password` | Required, must match `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,15}$` |

Validation mode: `onTouched` (validates after user leaves the field).

### State

| State                 | Type      | Purpose                                                    |
| --------------------- | --------- | ---------------------------------------------------------- |
| `loading`             | `boolean` | Disables form and shows spinner                            |
| `showPw`              | `boolean` | Toggles password visibility                                |
| `showUnverifiedModal` | `boolean` | Shows OTP resend modal if login fails with "verif" message |
| `errors` (RHF)        | `object`  | Field validation errors                                    |

### Success Flow

1. Calls `authService.login()`
2. JWT decoded with `jwt-decode` to extract `role`, `email`, `name`, `productSpeciality`
3. `AuthContext.login(token, user)` → stores in `localStorage` (`ss_token`, `ss_user`)
4. `toast.success("Logged in successfully!")`
5. Redirects to `location.state?.from?.pathname` (previous page) or `ROLE_HOME[user.role]`

### Error Handling

- Backend error message displayed via `toast.error()`
- If error message contains "verif" → shows `ResendOtp` modal to let user re-send OTP
- Network/5xx errors handled globally by `GlobalApiHandler`

### Navigation Links

- **Forgot Password?** → `/forgot-password`
- **Register for free** → `/register`

---

## 2. Register Page

**File:** [`src/pages/auth/Register.jsx`](../../src/pages/auth/Register.jsx)  
**Route:** `/register`  
**Role Restriction:** Guest only (`GuestRoute`)

### Purpose

Allows new users to self-register as customers. Creates an account and redirects to OTP verification.

### Components Used

| Component          | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `useState`         | Manual form state management                     |
| `LoadingButton`    | Async submit button                              |
| `PasswordStrength` | Inline password strength meter (local component) |

### API Used

```
POST /auth/register
Body: {
  fullName: string,
  email: string,
  mobileNumber: string (formatted as +91XXXXXXXXXX),
  password: string
}
Response: ApiResponseDTO<string>
```

### Validation Rules

| Field             | Rule                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| `fullName`        | Required, non-empty                                                             |
| `mobileNumber`    | Required, exactly 10 digits (`^\d{10}$`)                                        |
| `email`           | Required, valid email format                                                    |
| `password`        | Required, 6–15 chars, one uppercase, one lowercase, one digit, one special char |
| `confirmPassword` | Must match `password`                                                           |

Validation runs:

- **On-blur / on-change** for `confirmPassword` (real-time comparison)
- **On submit** for all fields via `validate()` function

### State

| State           | Type      | Purpose                            |
| --------------- | --------- | ---------------------------------- |
| `formData`      | `object`  | Controlled form values             |
| `errors`        | `object`  | Field error messages               |
| `loading`       | `boolean` | Submission loading                 |
| `showPw`        | `boolean` | Toggle password visibility         |
| `showConfirmPw` | `boolean` | Toggle confirm password visibility |

### PasswordStrength Component

An inline component rendered when `password` has a value.

Scoring logic:

- +1 if length ≥ 6
- +1 if length ≥ 10
- +1 if contains uppercase
- +1 if contains digit
- +1 if contains special character

Score → Label: Very Weak → Weak → Fair → Good → Strong

### Success Flow

1. `validate()` runs - returns errors object
2. If no errors: `authService.register(payload)`
3. Mobile number formatted to `+91XXXXXXXXXX`
4. `toast.success("Account created! Redirecting...")`
5. After 2.2 seconds: navigate to `/verify-otp` with `{ registered: true, email }`

### Error Handling

- Validation errors shown inline below each field
- API errors shown via `toast.error()`

---

## 3. Forgot Password Page

**File:** [`src/pages/auth/ForgotPassword.jsx`](../../src/pages/auth/ForgotPassword.jsx)  
**Route:** `/forgot-password`  
**Role Restriction:** Guest only (`GuestRoute`)

### Purpose

Multi-step password recovery flow:

1. Enter email → OTP sent
2. Verify OTP
3. Set new password

### API Used

```
POST /auth/forgot-password
Body: { email: string }

POST /auth/verify-otp
Body: { email: string, otp: string }

POST /auth/reset-password
Body: { email: string, otp: string, newPassword: string }
```

### State

| State               | Purpose                             |
| ------------------- | ----------------------------------- |
| `step` (1, 2, 3)    | Current step in the flow            |
| `email`             | Entered email, passed between steps |
| `otp`               | Entered OTP                         |
| `formData` (step 3) | New password + confirm password     |
| `loading`           | API call in progress                |
| `errors`            | Field-level errors                  |

### Success Flow

- **Step 1:** Email submitted → OTP sent → advance to step 2
- **Step 2:** OTP verified → advance to step 3
- **Step 3:** New password submitted → toast success → navigate to `/login`

---

## 4. Verify OTP Page

**File:** [`src/pages/auth/VerifyOtp.jsx`](../../src/pages/auth/VerifyOtp.jsx)  
**Route:** `/verify-otp`  
**Role Restriction:** Guest only (`GuestRoute`)

### Purpose

Handles email/phone OTP verification after registration. Also allows OTP resend.

### State Received (via location)

```js
const { email, registered } = useLocation().state;
```

### API Used

```
POST /auth/verify-otp
Body: { email: string, otp: string }

POST /auth/resend-otp
Body: { email: string }
```

### Success Flow

1. User enters OTP
2. `authService.verifyOtpApi()` called
3. On success: `toast.success()` → navigate to `/login`
4. Resend OTP: `authService.resendOtpApi()` → new OTP sent, timer restarts

---

## Shared Auth Design

All auth pages share:

- **CSS:** `src/pages/css/Login.css`
- **Layout:** Two-column glassmorphism card (form left, brand character right)
- **Logo:** `src/assets/logo/insurance-heart-vector.png`
- **Password encoding:** `btoa()` used for all password transmissions (login, register, reset)

---

## Related Documentation

- [Routing](../routing/routing.md)
- [Auth Service](../services/services-overview.md#authservice)
- [Login Workflow](../workflows/workflows.md#login-workflow)
- [Register Workflow](../workflows/workflows.md#register-workflow)

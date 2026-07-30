# Authentication Execution Flow Deep Dive

> **What:** Line-by-line execution flow for Login and Register workflows.
> **Why:** Demonstrates two different approaches to forms (`react-hook-form` vs. controlled components) and exactly how auth context is synchronized with local storage and routing.

---

## 1. Login Flow (Using `react-hook-form`)

`Login.jsx` utilizes `react-hook-form` for uncontrolled, high-performance input validation.

### Keystroke and Validation Flow

```text
User types in Email field
↓
`react-hook-form` registers the input via `{...register("email", { required, pattern })}`
↓
User clicks away (blur)
↓
`mode: "onTouched"` configuration triggers validation rules.
↓
If invalid: 
  └─ `errors.email` object is populated.
  └─ Component Re-renders.
  └─ `<div id="email-error">` appears with red text.
```

### Submit Execution Flow

```mermaid
sequenceDiagram
    actor User
    participant Login as Login.jsx
    participant RHF as react-hook-form
    participant Service as authService
    participant Context as AuthContext
    participant Router as React Router

    User->>Login: Clicks "Sign In"
    Login->>RHF: handleSubmit(onSubmit)
    
    alt Invalid Input
        RHF-->>Login: populate errors
        Login-->>User: Show validation errors
    else Valid Input
        RHF->>Login: onSubmit({ email, password })
        Login->>Login: setLoading(true)
        Login->>Service: login(data)
        
        alt API Success (200)
            Service-->>Login: { token, user }
            Login->>Context: login(token, user)
            Context->>Context: Save to localStorage
            Login->>Login: toast.success()
            Login->>Router: navigate(dashboard, replace: true)
        else API Error (e.g. Unverified)
            Service-->>Login: Promise.reject(err)
            Login->>Login: catch(err) -> check "verif"
            Login-->>User: Show Resend OTP Modal
        end
    end
```

---

## 2. Register Flow (Using Controlled Components)

`Register.jsx` uses standard React state (`useState(formData)`) for two-way binding. This allows for complex real-time side-effects (like the Password Strength meter and real-time Confirm Password check).

### Keystroke and Real-Time Validation Flow

```text
User types in "Confirm Password"
↓
`onChange={handleChange}` fires.
↓
Extracts `name="confirmPassword"`, `value="Typing..."`
↓
`setFormData` updates state.
↓
Inside `handleChange`, conditional logic checks:
  `if (name === 'confirmPassword' || name === 'password')`
↓
Compares `password` vs `confirmPassword`.
  - If they do NOT match: `setErrors({ confirmPassword: 'Passwords do not match.' })`
  - If they MATCH: `setErrors({ confirmPassword: '' })`
↓
Component Re-renders immediately.
↓
UI shows green "Passwords match!" or red error text instantly.
```

### Password Strength Meter Flow

```text
User types in "Password"
↓
Component Re-renders due to `formData.password` state update.
↓
`<PasswordStrength password={formData.password} />` component re-evaluates:
  1. Score = 0
  2. Length >= 6 ? Score++
  3. Length >= 10 ? Score++
  4. Has UpperCase ? Score++
  5. Has Number ? Score++
  6. Has Special Char ? Score++
↓
Maps `score` (0-5) to a color (Red → Orange → Yellow → Green → Emerald).
↓
Renders 5 flex-bars. Bars index < score get colored, rest get gray.
```

### Submit Execution Flow

```mermaid
flowchart TD
    User([User clicks Register]) --> Submit["handleSubmit executes"]
    Submit --> Prevent[e.preventDefault]
    Prevent --> Validate{"Manual Validation"}
    
    Validate -- Invalid --> SetErrors["setErrors state"]
    SetErrors --> RenderErrors["UI displays errors"]
    
    Validate -- Valid --> SetLoading["setLoading true"]
    SetLoading --> BuildPayload["Build Payload: Trim & Prefix +91"]
    BuildPayload --> API[registerService.register]
    
    API -- Success --> Toast[toast.success]
    Toast --> Wait["Wait 2.2 seconds"]
    Wait --> Redirect["navigate to /verify-otp"]
    
    API -- Error --> ToastErr[toast.error]
```

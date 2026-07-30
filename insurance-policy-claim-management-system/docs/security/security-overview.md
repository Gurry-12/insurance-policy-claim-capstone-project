# Security Overview

## Purpose

This document explains every security mechanism in the system — JWT authentication, filter chain, role-based access control (RBAC), ownership validation, and staff speciality-based scoping.

---

## Security Stack

| Component | Class | Purpose |
|---|---|---|
| Security Config | `SecurityConfig.java` | Defines filter chain, URL rules, auth beans |
| JWT Service | `JwtService.java` | Token generation and validation |
| JWT Filter | `JwtAuthenticationFilter.java` | Intercepts every request to validate JWT |
| User Details | `CustomUserDetailsService.java` | Loads user from DB for Spring Security |
| Password Encoder | BCryptPasswordEncoder (bean) | Hashes passwords at registration |

---

## JWT (JSON Web Token) Architecture

### Why JWT?

The system is stateless — no HTTP sessions. JWT tokens carry all necessary authentication state, enabling:
- Horizontal scaling without session replication
- Decoupled authentication from session storage
- Frontend SPA compatibility

### Token Structure

```
Header.Payload.Signature

Payload contains:
{
  "sub": "user@example.com",        ← username (email)
  "roles": ["ROLE_CUSTOMER"],       ← Spring Security authorities
  "fullName": "John Doe",           ← Display name for frontend
  "productSpeciality": "HEALTH",    ← null for customers/admins
  "iat": 1234567890,                ← issued at
  "exp": 1234567890                 ← expiry (iat + 6000000ms = 100 min)
}
```

**Why `productSpeciality` in the token?**
The frontend needs to know the staff member's speciality to show relevant menus. It avoids a separate API call after login.

### Token Generation (`JwtService.generateToken`)

```java
public String generateToken(UserDetails userDetails, String fullName, String productSpeciality) {
    List<String> roles = userDetails.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority).toList();
    
    return Jwts.builder()
        .subject(userDetails.getUsername())   // email
        .claim("roles", roles)
        .claim("fullName", fullName)
        .claim("productSpeciality", productSpeciality)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
        .signWith(getSigningKey())
        .compact();
}
```

### Signing Key

HMAC-SHA key derived from the `app.jwt.secret` property (stored in `env.properties`). The key must be long enough (≥256 bits for HS256).

---

## JWT Filter (`JwtAuthenticationFilter`)

**What it does on every request:**

```
Request arrives
     │
     ▼
Does "Authorization" header start with "Bearer "?
     │ NO → skip filter, continue chain (public endpoints work)
     │ YES
     ▼
Extract token (substring from index 7)
     │
     ▼
Extract username (email) from token
     │
     ▼
Is there already an Authentication in SecurityContext?
     │ YES → skip (already authenticated)
     │ NO
     ▼
Load UserDetails from DB via CustomUserDetailsService
     │
     ▼
Is token valid (username matches, not expired)?
     │ NO → log warning, continue chain unauthenticated
     │ YES
     ▼
Create UsernamePasswordAuthenticationToken with authorities
Set into SecurityContextHolder
     │
     ▼
Continue filter chain
```

**Key detail:** If the token is invalid or expired, the filter does NOT throw an exception — it simply does NOT set authentication. The security rule check that follows will then reject the unauthenticated request.

**Why `OncePerRequestFilter`?**
Guarantees the filter runs exactly once per request, even in scenarios with internal request forwards.

---

## CustomUserDetailsService

```java
public UserDetails loadUserByUsername(String email) {
    AppUser appUser = userRepository.findByEmailAndIsActiveTrue(email)
        .orElseThrow(() -> new UsernameNotFoundException(...));
    
    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(appUser.getRole().name());
    // Role stored as "ROLE_CUSTOMER", "ROLE_INTERNAL_STAFF", "ROLE_ADMIN"
    
    return new User(
        appUser.getEmail(),
        appUser.getPassword(),
        appUser.getIsActive(),   // enabled flag
        true, true, true,        // non-expired, non-locked flags
        Collections.singletonList(authority)
    );
}
```

**Critical:** `findByEmailAndIsActiveTrue` — deactivated accounts CANNOT authenticate even with a valid token. If an admin deactivates a user, their existing JWT will fail on the next request.

---

## Security Filter Chain Configuration

### Public Endpoints (no token needed)

```
/api/auth/**      ← Registration, login, OTP, password reset
/swagger-ui/**    ← API docs
/v3/api-docs/**   ← OpenAPI schema
OPTIONS /**        ← CORS preflight
```

### Role-Protected Endpoints (summary)

| Endpoint Pattern | Allowed Roles |
|---|---|
| `POST /api/plans/**` | ADMIN |
| `PUT/PATCH /api/plans/**` | ADMIN |
| `GET /api/plans/active` | ADMIN, INTERNAL_STAFF, CUSTOMER |
| `POST /api/policies/purchase` | CUSTOMER |
| `POST /api/policies/issue` | ADMIN, INTERNAL_STAFF |
| `GET /api/policies/my-policies` | CUSTOMER |
| `GET /api/policies/customer/*` | ADMIN, INTERNAL_STAFF |
| `PATCH /api/policies/*/cancel` | ADMIN, INTERNAL_STAFF |
| `POST /api/claims/raise` | CUSTOMER |
| `GET /api/claims/my-claims` | CUSTOMER |
| `PATCH /api/claims/*/review` | INTERNAL_STAFF |
| `PATCH /api/claims/*/assign` | INTERNAL_STAFF |
| `PATCH /api/claims/*/final-decision` | ADMIN |
| `POST /api/document/upload/**` | CUSTOMER |
| `POST /api/payments` | CUSTOMER, INTERNAL_STAFF |
| `GET /api/payments/my-payments` | CUSTOMER |
| `GET /api/payments/page` | ADMIN, INTERNAL_STAFF |

### Method-Level Security

`@EnableMethodSecurity` is enabled. Controllers use `@PreAuthorize("hasRole('X')")` for fine-grained control. This is dual-layer security — URL rules + method rules.

---

## Ownership Validation (Service Layer)

URL-level security only checks roles, not data ownership. The service layer enforces that users can only access their OWN data.

### Implemented Ownership Checks

**Policy ownership (customer):**
```java
if (isCustomer && !policy.getCustomer().getUser().getEmail().equals(email)) {
    throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_POLICY);
}
```

**Claim ownership (customer):**
```java
if (isCustomer && !claim.getPolicy().getCustomer().getUser().getEmail().equals(loggedInEmail)) {
    throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_CLAIM);
}
```

**Payment ownership (customer):**
```java
if (isCustomer && !payment.getPolicy().getCustomer().getUser().getEmail().equals(email)) {
    throw new AccessDeniedException(MessageConstants.Security.NOT_OWN_PAYMENT);
}
```

---

## Staff Speciality-Based Scoping

**The most complex security rule in the system.**

Every `INTERNAL_STAFF` user has a `StaffSpeciality` record that maps them to a `ProductType` (e.g., HEALTH, LIFE, VEHICLE). Staff can ONLY:
- View policies of their speciality
- Assign/review claims of their speciality
- Record payments for their speciality

**How it works:**
```java
// 1. Get staff's speciality
ProductType staffSpeciality = currentUser.getStaffSpeciality() != null
    ? currentUser.getStaffSpeciality().getProductSpeciality()
    : null;

// 2. Get claim's product type
ProductType claimProductType = claim.getPolicy().getPolicyPlan()
    .getInsuranceProduct().getProductType();

// 3. Compare
if (staffSpeciality == null || !staffSpeciality.equals(claimProductType)) {
    throw new AccessDeniedException(MessageConstants.Security.STAFF_SPECIALITY_ACCESS_DENIED);
}
```

**For paginated list endpoints:**
Staff see only records matching their speciality. This is enforced via JPA Specification:
```java
if (isInternalStaff) {
    spec = spec.and((root, query, cb) ->
        cb.equal(root.get("policy").get("policyPlan")
            .get("insuranceProduct").get("productType"), staffSpeciality));
}
```

**If staff has NO speciality:** They see zero records (a `cb.disjunction()` — always false — is added).

---

## Password Security

**Server-side:** AuthServiceImpl hashes the incoming password using BCrypt before storing it in the database:
```java
user.setPassword(passwordEncoder.encode(dto.getPassword()));
```

**Why BCrypt?**
BCrypt is a secure, computationally expensive hashing algorithm that protects against rainbow table attacks by incorporating a salt. The real transport security is TLS (HTTPS) in production.
---

## Security Constants (`MessageConstants.Security`)

All access-denied messages are centralized:

| Constant | Message |
|---|---|
| `STAFF_SPECIALITY_ACCESS_DENIED` | Not authorized to act on claims outside your product speciality |
| `NOT_OWN_CLAIM` | No permission to view this claim |
| `NOT_OWN_POLICY` | Not allowed to access another customer's policy |
| `NOT_OWN_PAYMENT` | Not allowed to view this payment |
| `REVIEW_ASSIGNED_TO_OTHER` | Claim is assigned to another staff member |

---

## CORS Configuration

`CorsConfig.java` configures allowed origins (from `app.frontend.url` property). This is a Spring `CorsConfigurer` — all OPTIONS preflight requests are permitted in `SecurityConfig`.

---

## Exception Routing for Security Errors

Spring Security's exceptions are routed back through the `HandlerExceptionResolver` so they are handled by `GlobalExceptionHandler`:

```java
.exceptionHandling(ex -> ex
    .authenticationEntryPoint((req, res, authException) ->
        handlerExceptionResolver.resolveException(req, res, null, authException))
    .accessDeniedHandler((req, res, accessDeniedException) ->
        handlerExceptionResolver.resolveException(req, res, null, accessDeniedException))
)
```

**Result:** `AuthenticationException` → HTTP 401, `AccessDeniedException` → HTTP 403, both as JSON.

---

## Common Security Mistakes to Avoid

1. **Never bypass ownership checks** — URL security alone is not enough
2. **Never trust role alone for staff** — always check `staffSpeciality` vs. `productType`
3. **Never log the full JWT token** — only log claims if necessary
4. **Never store the `JWT_KEY` in git** — it must be in `env.properties` (gitignored)
5. **Never remove `findByEmailAndIsActiveTrue`** — deactivated accounts must be blocked

---

## Related Documents

- [authentication/auth-flow.md](../authentication/auth-flow.md)
- [architecture/overview.md](../architecture/overview.md)

# Spring Boot Security & Filter Chain Architectures

This document breaks down the filter chain structures, JWT validation sequences, and role-based access rules.

---

## 1. Spring Security Filter Chain Pipeline

When an HTTP request hits the backend, it passes through the Web Security filter chain configuration:

```mermaid
graph TD
    Req[Client HTTP Request]
    Cors[CorsFilter <br> Resolves Cross-Origin Allowed Headers]
    Csrf[CsrfFilter <br> Disabled for Stateless API]
    JwtAuth[JwtAuthenticationFilter <br> Parses Bearer Authorization Header]
    UsernamePassword[UsernamePasswordAuthenticationFilter <br> Bypassed for stateless JWT]
    ExceptionFilter[ExceptionTranslationFilter <br> Handles Security Exceptions]
    FilterSecurity[FilterSecurityInterceptor <br> Evaluates Endpoint Matchers]
    
    Handler[ExceptionTranslation / Entry Point]
    Context[SecurityContextHolder <br> Principal and Roles Assigned]
    Controller[Target REST Controller]

    Req --> Cors
    Cors --> Csrf
    Csrf --> JwtAuth
    
    %% JWT filter behavior
    JwtAuth -->|Token Found & Valid| Context
    Context --> UsernamePassword
    JwtAuth -->|No Token / Skipped| UsernamePassword
    
    UsernamePassword --> ExceptionFilter
    ExceptionFilter --> FilterSecurity
    
    %% Access Decision
    FilterSecurity -->|Authorized| Controller
    FilterSecurity -->|Unauthorized / Forbidden| Handler
```

---

## 2. JWT Generation Flow (Authentication Success)

When the user enters credentials, the backend generates a JWT token containing role credentials and staff specialization parameters.

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Client
    participant Auth as AuthServiceImpl
    participant CustomDetails as CustomUserDetailsService
    participant TokenService as JwtService
    
    Client->>Auth: login(LoginRequestDTO)
    Auth->>CustomDetails: loadUserByUsername(email)
    CustomDetails-->>Auth: UserDetails (principal matching DB user)
    
    Auth->>Auth: Extract roles as simple granted authority lists
    Auth->>Auth: Extract staffSpeciality (if user is ROLE_INTERNAL_STAFF)
    
    Auth->>TokenService: generateToken(userDetails, fullName, speciality)
    activate TokenService
    TokenService->>TokenService: Build JSON payload claims (sub, roles, fullName, productSpeciality)
    TokenService->>TokenService: Sign token with HMAC-SHA signing key
    TokenService-->>Auth: Return JWT token String
    deactivate TokenService
    
    Auth-->>Client: Returns LoginResponseDTO containing jwt token
```

---

## 3. JWT Verification & Validation Flow

Every incoming request that contains the Authorization header is parsed to verify client identity.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Client
    participant Filter as JwtAuthenticationFilter
    participant Jwt as JwtService
    participant Details as CustomUserDetailsService
    participant Context as SecurityContextHolder

    Client->>Filter: Request Protected Route (Auth Header exists)
    activate Filter
    
    Filter->>Filter: Does Header start with 'Bearer '?
    Note over Filter: Yes, strip prefix and parse remainder
    
    Filter->>Jwt: extractUsername(token)
    activate Jwt
    Jwt-->>Filter: email (e.g. staff@insurance.com)
    deactivate Jwt
    
    Filter->>Filter: Is SecurityContext authentication null?
    Note over Filter: Yes, load credentials from DB
    
    Filter->>Details: loadUserByUsername(email)
    activate Details
    Details-->>Filter: UserDetails (matching user entity status)
    deactivate Details
    
    Filter->>Jwt: isTokenValid(token, userDetails)
    activate Jwt
    Jwt-->>Filter: true
    deactivate Jwt
    
    Filter->>Filter: Construct UsernamePasswordAuthenticationToken
    Filter->>Context: setAuthentication(authToken)
    
    Filter->>Client: Continue Filter Chain
    deactivate Filter
```

---

## 4. Protected Endpoints & Speciality Scoping

URL matching rules are managed by `SecurityConfig.java`. In addition, method security controls (`@PreAuthorize`) and internal business rules restrict data ownership.

```mermaid
flowchart TD
    A[Client Request URL] --> B{Matches Public Path?}
    B -- Yes (/api/auth/**, Swagger) --> C[Allow access]
    B -- No --> D{Valid JWT in request?}
    D -- No --> E[Return 401 Unauthorized]
    D -- Yes --> F{User Role allowed for URL?}
    F -- No --> G[Return 403 Access Denied]
    F -- Yes --> H{Caller has ROLE_CUSTOMER?}
    H -- Yes --> I{Is Customer the owner of the resource?}
    I -- No --> J[Return 403 Forbidden: NOT_OWN_POLICY/CLAIM/PAYMENT]
    I -- Yes --> K[Execute Endpoint Method]
    H -- No --> L{Caller has ROLE_INTERNAL_STAFF?}
    L -- Yes --> M{ProductType matches Staff Speciality?}
    M -- No --> N[Return 403 Forbidden: STAFF_SPECIALITY_ACCESS_DENIED]
    M -- Yes --> K
    L -- No (Caller is ADMIN) --> K
```

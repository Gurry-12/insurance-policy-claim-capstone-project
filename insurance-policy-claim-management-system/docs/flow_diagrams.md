# UML Flow Diagrams

This document charts control flows, validation validations, and system interactions.

---

## 1. Request Validation Flow

This flowchart diagrams how the controller and validation rules handle inputs before services are reached.

```mermaid
flowchart TD
    A([Client submits JSON / Multipart Payload]) --> B{Spring MVC Parser}
    B -- Parse Error / Invalid JSON --> C[Throw HttpMessageNotReadableException]
    B -- Parsed Success --> D{Contains @Valid annotation?}
    D -- No --> E[Direct Service Delegate]
    D -- Yes --> F{Jakarta validation checks pass?}
    F -- No (e.g. invalid email format) --> G[Throw MethodArgumentNotValidException]
    F -- Yes --> H{Service layer age and business logic checks?}
    H -- Age under 18 / coverage mismatch --> I[Throw BadRequestException]
    H -- Success --> J[Database Transactions]
    
    C --> K[GlobalExceptionHandler interceptor]
    G --> K
    I --> K
    K --> L[Format ErrorResponseDTO / ValidationErrorResponseDTO JSON]
    L --> M([Return HTTP Error Response to Client])
```

---

## 2. API Response Wrapper Flow

```mermaid
flowchart LR
    A[Service Execution Complete] --> B{Operation status?}
    B -- Successful --> C[Instantiate ApiResponseDTO]
    C --> D[Set message, success=true, data=Payload, timestamp]
    C --> E[Return ResponseEntity with HttpStatus 200 OK / 201 Created]
    
    B -- Business Exception --> F[Exception Interception]
    F --> G[Instantiate ErrorResponseDTO]
    G --> H[Set message, statusCode, errorType, requestPath, timestamp]
    G --> I[Return ResponseEntity with HttpStatus 400/401/403/404/409]
```

---

## 3. Cloudinary Document Upload Flow

```mermaid
flowchart TD
    A([Customer uploads Claim files]) --> B[MultipartFile validation]
    B -- Not PDF or Image / Empty --> C[Throw BadRequestException]
    B -- Valid Format & Size --> D[Map to Cloudinary Upload Options]
    D --> E[Cloudinary Uploader: upload bytes]
    E -- Network Failure --> F[Throw IOException]
    E -- Success --> G[Extract secureUrl & publicId]
    G --> H[Create ClaimDocument metadata]
    H --> I[Link metadata to Claim entity]
    I --> J[Save ClaimDocument into claim_documents table]
```

---

## 4. Policy Purchase Constraints Flow

```mermaid
flowchart TD
    A[Request Policy Purchase] --> B{Is Customer profile complete?}
    B -- No (address/nominee/DOB null) --> C[Throw BadRequestException: COMPLETE_PROFILE_FIRST]
    B -- Yes --> D{Is Customer age >= 18?}
    D -- No (calculated from DOB) --> E[Throw BadRequestException: UNDER_AGE_LIMIT]
    D -- Yes --> F{Is selected Plan active?}
    F -- No --> G[Throw PlanNotActiveException]
    F -- Yes --> H{ProductType == HEALTH?}
    H -- Yes --> I{Does customer have active/pending HEALTH policies under this plan?}
    I -- Yes --> J[Throw DuplicateResourceException: HEALTH_POLICY_EXISTS]
    I -- No --> M[Persist Policy: PENDING_PAYMENT]
    H -- No --> K{Does customer have pending OTHER policies under this plan?}
    K -- Yes --> L[Throw DuplicateResourceException: POLICY_EXISTS]
    K -- No --> M
```

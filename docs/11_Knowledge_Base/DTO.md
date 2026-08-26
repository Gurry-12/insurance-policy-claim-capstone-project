# DTO

## What It Is
- Data Transfer Objects: plain Java classes that shape data crossing the API boundary, decoupling the HTTP contract from JPA entities.
- Two packages: `dto/request` (inbound payloads, validated) and `dto/response` (outbound payloads, wrapped in `ApiResponseDTO`).
- Mapped to/from entities with ModelMapper in the service layer, plus explicit manual conversion where the DTO shape differs from the entity.

## Why It Is Used
- Prevents entities from leaking internals such as the BCrypt password hash or raw `@Version` fields.
- Lets the API expose exactly the fields a client needs (e.g., flattened `customerName`, `policyNumber` on a claim) without coupling to the persistence model.
- Standard response envelope (`ApiResponseDTO`, `PageResponseDTO`, `ErrorResponseDTO`) gives clients a consistent contract.

## Where It Is Used in This Project
- `dto/request/*.java`: `LoginRequestDTO`, `UserRequestDTO`, `ClaimRequestDTO`, `PaymentRequestDTO`, `PolicyPurchaseRequestDTO`, `PolicyIssueRequestDTO`, `VerifyOtpRequest`, and more; validated with Jakarta Bean Validation.
- `dto/response/*.java`: `UserResponseDTO`, `PolicyResponseDTO`, `ClaimResponseDTO`, `ClaimDocumentResponseDTO`, `PaymentResponseDTO`, `LoginResponseDTO`, `RefreshResponseDTO`, `ApiResponseDTO`, `PageResponseDTO`, `ErrorResponseDTO`, `ValidationErrorResponseDTO`.
- `serviceimpl/*.java`: `modelMapper.map(...)` used in `AuthServiceImpl`, `PolicyServiceImpl`, `PremiumPaymentServiceImpl`, `ClaimDocumentServiceImpl`, and others.
- Manual conversion methods: `PolicyServiceImpl.convertToResponseDTO`, `ClaimServiceImpl.convertToResponseDTO` for flattened fields.

## Related Files
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/request/LoginRequestDTO.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/PolicyResponseDTO.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/ApiResponseDTO.java
- insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/PageResponseDTO.java

## Related Docs
- ../06_Backend/DTOs.md
- ../06_Backend/Services.md
- ../03_API/API_Flow.md

## Common Interview Questions
1. Why use DTOs instead of returning entities? — Entities leak persistence details (password hashes, lazy associations, version columns) and couple the API contract to the schema.
2. What is the difference between request and response DTOs? — Request DTOs carry validated inbound input; response DTOs shape outbound data, often flattened or enriched with computed values.
3. How is entity-to-DTO mapping done here? — Mostly ModelMapper, with manual `convertToResponseDTO` methods where fields are computed (e.g., remaining claim amount) or flattened (e.g., `policyNumber` on a payment).
4. What does `ApiResponseDTO` standardize? — A consistent envelope of message, success flag, data payload, and timestamp for every response.
5. How are paginated responses shaped? — `PageResponseDTO<T>` wraps `content`, `pageNumber`, `pageSize`, `totalRecords`, `totalPages`, `lastPage`, and `sortingType`.

# Frontend API Contract

This document serves as the single source of truth for frontend development for the Insurance Policy Claim Management System. It contains all REST API endpoints, Request payloads (with validations), Response structures, and Security/roles required for each endpoint.

## Common Wrappers

### `ApiResponseDTO<T>`
```json
{
  "message": "string",
  "success": "boolean",
  "data": "T (Generic Data Type)",
  "timeStamp": "string (ISO 8601 DateTime)"
}
```

### `PageResponseDTO<T>`
```json
{
  "content": ["T (List of Generic Data Type)"],
  "pageNumber": "integer",
  "pageSize": "integer",
  "totalRecords": "long",
  "totalPages": "integer",
  "lastPage": "boolean",
  "sortingType": "string"
}
```

### `ErrorResponseDTO`
```json
{
  "timestamp": "string (ISO 8601 DateTime)",
  "statusCode": "integer",
  "errorType": "string",
  "message": "string",
  "requestPath": "string"
}
```

---

## 1. Auth API (`/api/auth`)

### 1.1 POST `/api/auth/login`
- **Security:** Public
- **Description:** Authenticates a user using email and password, and returns a JWT token.
- **Request Payload (`LoginRequestDTO`)**
  ```json
  {
    "email": "string (Required, Valid Email)",
    "password": "string (Required)"
  }
  ```
- **Response (`LoginResponseDTO`)**
  ```json
  {
    "userId": "long",
    "fullName": "string",
    "email": "string",
    "role": "string",
    "token": "string",
    "message": "string",
    "tokenType": "Bearer"
  }
  ```

### 1.2 POST `/api/auth/register`
- **Security:** Public
- **Request Payload (`UserRequestDTO`)**
  ```json
  {
    "fullName": "string (Required, 2-100 chars, only letters/spaces)",
    "email": "string (Required, Valid Email)",
    "password": "string (Required, 6-15 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)",
    "mobileNumber": "string (Required, +919876543210 format)"
  }
  ```
- **Response:** `ApiResponseDTO<UserResponseDTO>`

### 1.3 POST `/api/auth/verify-otp`
- **Security:** Public
- **Request Payload (`VerifyOtpRequest`)**
  ```json
  {
    "email": "string (Required, Valid Email)",
    "emailOtp": "string (Required)",
    "phoneOtp": "string (Required)"
  }
  ```
- **Response:** `ApiResponseDTO<UserResponseDTO>`

### 1.4 POST `/api/auth/resend-otp`
- **Security:** Public
- **Request Payload (`ResendOtpRequestDTO`)**
  ```json
  {
    "email": "string (Required, Valid Email)",
    "phone": "string (Required)"
  }
  ```
- **Response:** `ApiResponseDTO<ResendOtpResponseDTO>`

### 1.5 POST `/api/auth/forgot-password`
- **Security:** Public
- **Request Payload (`ForgotPasswordRequestDTO`)**
  ```json
  {
    "email": "string (Required, Valid Email)"
  }
  ```
- **Response:** `ApiResponseDTO<String>`

### 1.6 POST `/api/auth/reset-password`
- **Security:** Public
- **Request Payload (`ResetPasswordRequestDTO`)**
  ```json
  {
    "email": "string (Required, Valid Email)",
    "emailOtp": "string (Required)",
    "phoneOtp": "string (Required)",
    "newPassword": "string (Required, min 8 chars)"
  }
  ```
- **Response:** `ApiResponseDTO<String>`

---

## 2. Claim API (`/api/claims`)

### 2.1 POST `/api/claims/raise`
- **Security:** CUSTOMER
- **Description:** Consumes `multipart/form-data`.
- **Request Payload**
  - `claim` (`ClaimRequestDTO` as JSON part):
    ```json
    {
      "policyId": "long (Required)",
      "claimAmount": "decimal (Required, > 0)",
      "claimReason": "string (Required)",
      "incidentDate": "string (Required, YYYY-MM-DD)"
    }
    ```
  - `files` (`List<MultipartFile>`): List of documents.
- **Response:** `ApiResponseDTO<ClaimResponseDTO>`

### 2.2 GET `/api/claims/my-claims`
- **Security:** CUSTOMER
- **Response:** `ApiResponseDTO<List<ClaimResponseDTO>>`

### 2.3 GET `/api/claims`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="createdDate"`, `sortDirection="desc"`, `customerId` (optional), `status` (optional)
- **Response:** `PageResponseDTO<ClaimResponseDTO>`

### 2.4 GET `/api/claims/{claimId}`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Response:** `ApiResponseDTO<ClaimResponseDTO>`

### 2.5 GET `/api/claims/{claimId}/history`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="desc"`, `updatedBy` (optional), `status` (optional)
- **Response:** `PageResponseDTO<ClaimHistoryResponseDTO>`

### 2.6 PATCH `/api/claims/{claimId}/under-review`
- **Security:** AGENT
- **Response:** `ApiResponseDTO<ClaimResponseDTO>`

### 2.7 PATCH `/api/claims/{claimId}/review`
- **Security:** AGENT
- **Request Payload (`ClaimReviewRequestDTO`)**
  ```json
  {
    "recommendedStatus": "string (ClaimStatus Enum, Required)",
    "remarks": "string"
  }
  ```
- **Response:** `ApiResponseDTO<ClaimResponseDTO>`

### 2.8 PATCH `/api/claims/{claimId}/final-decision`
- **Security:** ADMIN
- **Request Payload (`ClaimReviewRequestDTO`)**
  ```json
  {
    "recommendedStatus": "string (ClaimStatus Enum, Required)",
    "remarks": "string"
  }
  ```
- **Response:** `ApiResponseDTO<ClaimResponseDTO>`

---

## 3. Claim Document API (`/api/document`)

### 3.1 POST `/api/document/upload/{claimId}`
- **Security:** CUSTOMER
- **Description:** Consumes `multipart/form-data`.
- **Request Payload:** `files` (`List<MultipartFile>`)
- **Response:** `ApiResponseDTO<List<ClaimDocumentResponseDTO>>`

---

## 4. Customer API (`/api/customers`)

### 4.1 POST `/api/customers/{userId}`
- **Security:** CUSTOMER
- **Request Payload (`CustomerRequestDTO`)**
  ```json
  {
    "dateOfBirth": "string (Past Date, YYYY-MM-DD)",
    "address": "string (Required)",
    "city": "string (Required, Letters/spaces)",
    "state": "string (Required, Letters/spaces)",
    "pinCode": "string (Valid PIN)",
    "nomineeName": "string (Required, Letters/spaces)",
    "nomineeRelation": "string (Required, Letters/spaces)"
  }
  ```
- **Response:** `ApiResponseDTO<CustomerResponseDTO>`

### 4.2 GET `/api/customers/{customerId}`
- **Security:** ADMIN, AGENT
- **Response:** `ApiResponseDTO<CustomerResponseDTO>`

### 4.3 GET `/api/customers`
- **Security:** ADMIN, AGENT
- **Response:** `ApiResponseDTO<List<CustomerResponseDTO>>`

### 4.4 PUT `/api/customers/{customerId}`
- **Security:** CUSTOMER
- **Request Payload:** `CustomerRequestDTO`
- **Response:** `ApiResponseDTO<CustomerResponseDTO>`

### 4.5 GET `/api/customers/page`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`, `city` (optional), `state` (optional)
- **Response:** `PageResponseDTO<CustomerResponseDTO>`

### 4.6 GET `/api/customers/profile`
- **Security:** CUSTOMER
- **Response:** `ApiResponseDTO<CustomerResponseDTO>`

---

## 5. Insurance Product API (`/api/products`)

### 5.1 POST `/api/products`
- **Security:** ADMIN
- **Request Payload (`ProductRequestDTO`)**
  ```json
  {
    "productName": "string (Required, Letters/spaces)",
    "productType": "string (ProductType Enum, Required)",
    "description": "string (Required)",
    "activeStatus": "boolean (Required)"
  }
  ```
- **Response:** `ApiResponseDTO<ProductResponseDTO>`

### 5.2 PATCH `/api/products/{id}/deactivate`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<ProductResponseDTO>`

### 5.3 PATCH `/api/products/{id}/activate`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<ProductResponseDTO>`

### 5.4 GET `/api/products/active`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Response:** `ApiResponseDTO<List<ProductResponseDTO>>`

### 5.5 PUT `/api/products/{id}`
- **Security:** ADMIN
- **Request Payload:** `ProductRequestDTO`
- **Response:** `ProductResponseDTO` (No ApiResponse wrapper)

### 5.6 GET `/api/products/{id}`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Response:** `ApiResponseDTO<ProductResponseDTO>`

### 5.7 GET `/api/products/page`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`, `productType` (optional), `isActive` (optional boolean)
- **Response:** `PageResponseDTO<ProductResponseDTO>`

---

## 6. Policy API (`/api/policies`)

### 6.1 POST `/api/policies/purchase`
- **Security:** CUSTOMER
- **Request Payload (`PolicyPurchaseRequestDTO`)**
  ```json
  {
    "planId": "long (Required)",
    "startDate": "string (Required, Past or Present YYYY-MM-DD)"
  }
  ```
- **Response:** `ApiResponseDTO<PolicyResponseDTO>`

### 6.2 POST `/api/policies/issue`
- **Security:** ADMIN, AGENT
- **Request Payload (`PolicyIssueRequestDTO`)**
  ```json
  {
    "customerId": "long (Required)",
    "planId": "long (Required)",
    "startDate": "string (Required, Past or Present YYYY-MM-DD)"
  }
  ```
- **Response:** `ApiResponseDTO<PolicyResponseDTO>`

### 6.3 GET `/api/policies/my-policies`
- **Security:** CUSTOMER
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`
- **Response:** `PageResponseDTO<PolicyResponseDTO>`

### 6.4 GET `/api/policies/customer/{customerId}`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`
- **Response:** `PageResponseDTO<PolicyResponseDTO>`

### 6.5 GET `/api/policies`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`, `customerId` (optional), `status` (optional)
- **Response:** `PageResponseDTO<PolicyResponseDTO>`

### 6.6 GET `/api/policies/{policyId}`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Response:** `ApiResponseDTO<PolicyResponseDTO>`

### 6.7 PATCH `/api/policies/{policyId}/cancel`
- **Security:** ADMIN, AGENT
- **Response:** `ApiResponseDTO<PolicyResponseDTO>`

---

## 7. Policy Plan API (`/api/plans`)

### 7.1 POST `/api/plans`
- **Security:** ADMIN
- **Request Payload (`PlanRequestDTO`)**
  ```json
  {
    "productId": "long (Required)",
    "planName": "string (Required, Letters/spaces)",
    "coverageAmount": "decimal (Required, > 0)",
    "premiumAmount": "decimal (Required, > 0)",
    "premiumType": "string (PremiumType Enum, Required)",
    "duration": "integer (Required, max 40)",
    "termsAndConditions": "string (Required)",
    "activeStatus": "boolean (Required)"
  }
  ```
- **Response:** `ApiResponseDTO<PlanResponseDTO>`

### 7.2 PUT `/api/plans/{planId}`
- **Security:** ADMIN
- **Request Payload:** `PlanRequestDTO`
- **Response:** `ApiResponseDTO<PlanResponseDTO>`

### 7.3 PATCH `/api/plans/{planId}/deactivate`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<PlanResponseDTO>`

### 7.4 PATCH `/api/plans/{planId}/activate`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<PlanResponseDTO>`

### 7.5 GET `/api/plans/active`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Response:** `ApiResponseDTO<List<PlanResponseDTO>>`

### 7.6 GET `/api/plans/{productId}/active`
- **Security:** ADMIN, AGENT, CUSTOMER
- **Response:** `ApiResponseDTO<List<PlanResponseDTO>>`

### 7.7 GET `/api/plans/page`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="createdDate"`, `sortDirection="desc"`, `productId` (optional), `isActive` (optional)
- **Response:** `PageResponseDTO<PlanResponseDTO>`

### 7.8 GET `/api/plans/{planId}`
- **Security:** ADMIN, AGENT
- **Response:** `ApiResponseDTO<PlanResponseDTO>`

---

## 8. Premium Payment API (`/api/payments`)

### 8.1 POST `/api/payments`
- **Security:** CUSTOMER, AGENT
- **Request Payload (`PaymentRequestDTO`)**
  ```json
  {
    "policyId": "long (Required)",
    "amount": "decimal (> 0)",
    "paymentMode": "string (PaymentMode Enum, Required)",
    "paymentStatus": "string (PaymentStatus Enum, Required)"
  }
  ```
- **Response:** `ApiResponseDTO<PaymentResponseDTO>`

### 8.2 GET `/api/payments/policy/{id}`
- **Security:** ADMIN, AGENT
- **Response:** `ApiResponseDTO<List<PaymentResponseDTO>>`

### 8.3 GET `/api/payments/{id}`
- **Security:** ADMIN, AGENT
- **Response:** `ApiResponseDTO<PaymentResponseDTO>`

### 8.4 GET `/api/payments/page`
- **Security:** ADMIN, AGENT
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`, `policyId` (optional), `paymentStatus` (optional)
- **Response:** `PageResponseDTO<PaymentResponseDTO>`

### 8.5 GET `/api/payments/my-payments`
- **Security:** CUSTOMER
- **Response:** `ApiResponseDTO<List<PaymentResponseDTO>>`

### 8.6 GET `/api/payments/my-policies/{policyId}`
- **Security:** CUSTOMER
- **Response:** `ApiResponseDTO<List<PaymentResponseDTO>>`

---

## 9. User API (`/api/users`)

### 9.1 GET `/api/users`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<List<UserResponseDTO>>`

### 9.2 PATCH `/api/users/{id}/activate`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<UserResponseDTO>`

### 9.3 PATCH `/api/users/{id}/deactivate`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<UserResponseDTO>`

### 9.4 POST `/api/users/agent`
- **Security:** ADMIN
- **Request Payload (`CreateAgentRequestDTO`)**
  ```json
  {
    "fullName": "string (Required, 2-100 chars, Letters/spaces)",
    "email": "string (Required, Valid Email)",
    "password": "string (Required, 6-15 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)",
    "mobileNumber": "string (Required, +919876543210 format)",
    "productSpeciality": "string (ProductType Enum, Required)"
  }
  ```
- **Response:** `ApiResponseDTO<UserResponseDTO>`

### 9.5 GET `/api/users/{id}`
- **Security:** ADMIN
- **Response:** `ApiResponseDTO<UserResponseDTO>`

### 9.6 GET `/api/users/page`
- **Security:** ADMIN
- **Query Params:** `pageNumber=0`, `pageSize=10`, `sortBy="id"`, `sortDirection="asc"`, `role` (optional), `isActive` (optional boolean)
- **Response:** `PageResponseDTO<UserResponseDTO>`

---

## Shared Enums

**`Role`**: `ROLE_ADMIN`, `ROLE_AGENT`, `ROLE_CUSTOMER`
**`ClaimStatus`**: `SUBMITTED`, `UNDER_REVIEW`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`, `APPROVED`, `REJECTED`
**`Gender`**: `MALE`, `FEMALE`, `OTHER`
**`PaymentMode`**: `UPI`, `CARD`, `NET_BANKING`, `CASH`
**`PaymentStatus`**: `PENDING`, `SUCCESS`, `FAILED`
**`PolicyStatus`**: `PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED`
**`PremiumType`**: `ONE_TIME`, `ANNUAL`
**`ProductType`**: `HEALTH`, `MOTOR`, `LIFE`, `TRAVEL`, `INSURANCE`

## Key Response DTOs Structures

### `UserResponseDTO`
```json
{
  "id": "long",
  "fullName": "string",
  "email": "string",
  "mobileNumber": "string",
  "role": "string",
  "isActive": "boolean",
  "emailVerified": "boolean",
  "phoneVerified": "boolean",
  "createdDate": "string",
  "updatedDate": "string",
  "productSpeciality": "string (ProductType Enum, if applicable)"
}
```

### `CustomerResponseDTO`
```json
{
  "customerId": "long",
  "userId": "long",
  "fullName": "string",
  "email": "string",
  "mobileNumber": "string",
  "dateOfBirth": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "pinCode": "string",
  "nomineeName": "string",
  "nomineeRelation": "string",
  "createdDate": "string"
}
```

### `ProductResponseDTO`
```json
{
  "productId": "long",
  "productName": "string",
  "productType": "string",
  "description": "string",
  "isActive": "boolean",
  "createdDate": "string"
}
```

### `PlanResponseDTO`
```json
{
  "planId": "long",
  "productId": "long",
  "productName": "string",
  "planName": "string",
  "coverageAmount": "decimal",
  "premiumAmount": "decimal",
  "premiumType": "string",
  "duration": "integer",
  "termsAndConditions": "string",
  "isActive": "boolean",
  "createdDate": "string"
}
```

### `PolicyResponseDTO`
```json
{
  "policyId": "long",
  "policyNumber": "string",
  "customerId": "long",
  "customerName": "string",
  "planId": "long",
  "planName": "string",
  "startDate": "string",
  "endDate": "string",
  "policyStatus": "string",
  "totalPremiumPaid": "decimal",
  "productType": "string",
  "coverageAmount": "decimal",
  "premiumAmount": "decimal",
  "premiumType": "string",
  "createdDate": "string",
  "remainingClaimAmount": "decimal"
}
```

### `PaymentResponseDTO`
```json
{
  "paymentId": "long",
  "policyId": "long",
  "policyNumber": "string",
  "amount": "decimal",
  "paymentMode": "string",
  "transactionReference": "string",
  "paymentStatus": "string",
  "paymentDate": "string"
}
```

### `ClaimResponseDTO`
```json
{
  "claimId": "long",
  "claimNumber": "string",
  "policyId": "long",
  "policyNumber": "string",
  "claimAmount": "decimal",
  "claimReason": "string",
  "incidentDate": "string",
  "claimStatus": "string",
  "agentRemarks": "string",
  "adminRemarks": "string",
  "customerName": "string",
  "createdDate": "string",
  "updatedDate": "string",
  "documents": ["ClaimDocumentResponseDTO"],
  "assignedAgentName": "string"
}
```

### `ClaimHistoryResponseDTO`
```json
{
  "historyId": "long",
  "previousStatus": "string",
  "newStatus": "string",
  "remarks": "string",
  "updatedBy": "string",
  "updatedDate": "string"
}
```

### `ClaimDocumentResponseDTO`
```json
{
  "documentName": "string",
  "documentType": "string",
  "documentReference": "string"
}
```

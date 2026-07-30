# Phase 4: Policy Operations

## 4.1 Purchase Policy (Self-Service)
**Endpoint:** `POST {{baseUrl}}/api/policies/purchase`  
**Role:** CUSTOMER (`{{customerToken_1}}` or other customer tokens)  
**Business Context:** Customers buy various plans.

**Purchase 1: John buys Health Basic**
```json
{
  "planId": 1,
  "startDate": "2024-08-01"
}
```

**Purchase 2: Jane buys Car Comprehensive**
```json
{
  "planId": 14,
  "startDate": "2024-08-05"
}
```

**Purchase 3: Michael buys Term Life**
```json
{
  "planId": 8,
  "startDate": "2024-08-10"
}
```

## 4.2 Issue Policy (Admin on behalf of Customer)
**Endpoint:** `POST {{baseUrl}}/api/policies/issue`  
**Role:** ADMIN (`{{adminToken}}`)  
**Business Context:** Admin issues policies to customers who submitted offline forms.

**Issue 1: Emily gets Family Floater**
```json
{
  "customerId": 4,
  "planId": 6,
  "startDate": "2024-08-15"
}
```

**Issue 2: David gets Home Property**
```json
{
  "customerId": 5,
  "planId": 23,
  "startDate": "2024-08-20"
}
```

## 4.3 Make Premium Payments (Activate Policy)
**Endpoint:** `POST {{baseUrl}}/api/payments`  
**Role:** CUSTOMER  
**Business Context:** Policies start in `PENDING_PAYMENT`. Customers pay exact premium amounts to activate them.

**Payment 1: John pays for Policy 1**
```json
{
  "policyId": 1,
  "amount": 8000,
  "paymentMode": "UPI",
  "paymentStatus": "SUCCESS"
}
```
*Expected: Policy 1 status changes to `ACTIVE`.*

**Payment 2: Jane pays for Policy 2**
```json
{
  "policyId": 2,
  "amount": 12000,
  "paymentMode": "NET_BANKING",
  "paymentStatus": "SUCCESS"
}
```
*Expected: Policy 2 status changes to `ACTIVE`.*

**Payment 3: Michael pays for Policy 3**
```json
{
  "policyId": 3,
  "amount": 250000,
  "paymentMode": "CARD",
  "paymentStatus": "SUCCESS"
}
```
*Expected: Policy 3 status changes to `ACTIVE`.*

## 4.4 Make Premium Payment (Failed Transaction)
**Endpoint:** `POST {{baseUrl}}/api/payments`
```json
{
  "policyId": 4,
  "amount": 18000,
  "paymentMode": "CARD",
  "paymentStatus": "FAILED"
}
```
*Expected: Payment is recorded as FAILED, Policy 4 remains `PENDING_PAYMENT`.*

# Phase 7: Administrative Maintenance

## 7.1 Deactivate an Insurance Product
**Endpoint:** `PATCH {{baseUrl}}/api/products/3/deactivate`  
**Role:** ADMIN  
**Business Context:** Stops new plans from being added to this product. Existing policies are unaffected.

## 7.2 Deactivate a Policy Plan
**Endpoint:** `PATCH {{baseUrl}}/api/plans/5/deactivate`  
**Role:** ADMIN  
**Business Context:** Stops customers from purchasing this specific plan.

## 7.3 Cancel a Policy
**Endpoint:** `PATCH {{baseUrl}}/api/policies/3/cancel`  
**Role:** ADMIN / STAFF  
**Business Context:** Cancels an active policy. Fails if there are open (unresolved) claims.
```json
{}
```

## 7.4 Deactivate a Staff/User Account
**Endpoint:** `PATCH {{baseUrl}}/api/users/2/status`  
**Role:** ADMIN
```json
{
  "isActive": false
}
```
*Expected: Staff user can no longer log in or process claims.*

# Phase 6: Pagination, Search, and History

## 6.1 View Claim History
**Endpoint:** `GET {{baseUrl}}/api/claims/1/history`  
**Role:** CUSTOMER / STAFF / ADMIN  
*Expected: Returns a list of `ClaimStatusHistory` objects showing the journey from SUBMITTED -> UNDER_REVIEW -> REC_APPROVAL -> APPROVED.*

## 6.2 Paginated Customers Search
**Endpoint:** `GET {{baseUrl}}/api/customers?pageNumber=0&pageSize=10&sortBy=fullName&sortDirection=asc&fullName=John`  
**Role:** ADMIN / STAFF

## 6.3 Admin Views All Policies (Filtered)
**Endpoint:** `GET {{baseUrl}}/api/policies?policyStatus=ACTIVE&pageNumber=0&pageSize=5`  
**Role:** ADMIN

## 6.4 Customer Views Own Policies
**Endpoint:** `GET {{baseUrl}}/api/policies/my-policies`  
**Role:** CUSTOMER

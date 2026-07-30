# Phase 1: Administration & Staff Setup

## 1.1 Admin Login
**Endpoint:** `POST {{baseUrl}}/api/auth/login`  
**Role:** PUBLIC  
**Headers:** `Content-Type: application/json`  
**Business Context:** Authenticate the master admin to set up the system.
```json
{
  "email": "admin@example.com",
  "password": "cGFzc3dvcmQxMjM="
}
```
*Expected action: Save the `data.token` as `{{adminToken}}`.*

## 1.2 Create Staff 1 (Health Specialist)
**Endpoint:** `POST {{baseUrl}}/api/users/staff`  
**Role:** ADMIN (Requires `Authorization: Bearer {{adminToken}}`)  
**Business Context:** Internal staff handle claims and issue policies for their specific product domains.
```json
{
  "fullName": "Dr. Sarah Health",
  "email": "sarah.health@insurance.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+919876543201",
  "productSpeciality": "HEALTH"
}
```

## 1.3 Create Staff 2 (Vehicle Specialist)
**Endpoint:** `POST {{baseUrl}}/api/users/staff`  
**Role:** ADMIN
```json
{
  "fullName": "Mike Auto",
  "email": "mike.auto@insurance.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+919876543202",
  "productSpeciality": "VEHICLE"
}
```

## 1.4 Create Staff 3 (Life Specialist)
**Endpoint:** `POST {{baseUrl}}/api/users/staff`  
**Role:** ADMIN
```json
{
  "fullName": "Emma Life",
  "email": "emma.life@insurance.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+919876543203",
  "productSpeciality": "LIFE"
}
```
*(Note: In a real flow, Staff must verify OTPs to log in. For testing, assuming staff accounts are verified or you check DB for OTP).*

# Phase 3: Customer Onboarding

## 3.1 Register Customers
**Endpoint:** `POST {{baseUrl}}/api/auth/register`  
**Role:** PUBLIC

*Register 10 unique customers:*

**Customer 1:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000001"
}
```

**Customer 2:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000002"
}
```

**Customer 3:**
```json
{
  "fullName": "Michael Johnson",
  "email": "michael.j@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000003"
}
```

**Customer 4:**
```json
{
  "fullName": "Emily Davis",
  "email": "emily.d@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000004"
}
```

**Customer 5:**
```json
{
  "fullName": "David Wilson",
  "email": "david.w@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000005"
}
```

**Customer 6:**
```json
{
  "fullName": "Sarah Brown",
  "email": "sarah.b@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000006"
}
```

**Customer 7:**
```json
{
  "fullName": "James Taylor",
  "email": "james.t@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000007"
}
```

**Customer 8:**
```json
{
  "fullName": "Linda Anderson",
  "email": "linda.a@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000008"
}
```

**Customer 9:**
```json
{
  "fullName": "Robert Thomas",
  "email": "robert.t@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000009"
}
```

**Customer 10:**
```json
{
  "fullName": "Mary Jackson",
  "email": "mary.j@example.com",
  "password": "cGFzc3dvcmQxMjM=",
  "mobileNumber": "+918000000010"
}
```

## 3.2 Verify OTP for Customers
*(Note: Check your `otp_verifications` table in the DB for the generated OTPs, or assume "123456" if mocked).*
**Endpoint:** `POST {{baseUrl}}/api/auth/verify-otp`  
**Role:** PUBLIC

```json
{
  "email": "john.doe@example.com",
  "emailOtp": "123456",
  "phoneOtp": "123456"
}
```
*(Repeat for the other 9 customer emails).*

## 3.3 Customer Login
**Endpoint:** `POST {{baseUrl}}/api/auth/login`
```json
{
  "email": "john.doe@example.com",
  "password": "cGFzc3dvcmQxMjM="
}
```
*Save `data.token` as `{{customerToken_1}}`.*

## 3.4 Create Customer Profiles
**Endpoint:** `POST {{baseUrl}}/api/customers/profile`  
**Role:** CUSTOMER (`Authorization: Bearer {{customerToken_1}}`)  

**Profile 1 (John Doe):**
```json
{
  "dateOfBirth": "1990-05-15",
  "address": "123 Maple Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "nomineeName": "Mary Doe",
  "nomineeRelation": "Spouse"
}
```

**Profile 2 (Jane Smith):**
```json
{
  "dateOfBirth": "1988-11-23",
  "address": "456 Oak Avenue",
  "city": "Delhi",
  "state": "Delhi",
  "pinCode": "110001",
  "nomineeName": "Tom Smith",
  "nomineeRelation": "Spouse"
}
```

**Profile 3 (Michael Johnson):**
```json
{
  "dateOfBirth": "1975-02-14",
  "address": "789 Pine Road",
  "city": "Bangalore",
  "state": "Karnataka",
  "pinCode": "560001",
  "nomineeName": "Lisa Johnson",
  "nomineeRelation": "Daughter"
}
```

*(Repeat for remaining customers as they log in).*

# Postman End-to-End Business Scenario

This directory contains a chronological sequence of API payloads to simulate a full real-world business scenario for the Insurance Policy Claim Management System. 

They are broken down into a structured folder hierarchy for easier testing:

1. **`01-admin-setup/`** - Creating the admin and specialized staff members.
2. **`02-products-and-plans/`** - Setting up the insurance catalog (Products like Health, Vehicle, Life and their corresponding plans).
3. **`03-customer-onboarding/`** - Customer registration, OTP verification, login, and profile creation.
4. **`04-policy-operations/`** - Purchasing policies, issuing policies, and making premium payments.
5. **`05-claims-workflow/`** - The full lifecycle of raising a claim, staff assignment, under review, recommendations, and final approval/rejection.
6. **`06-history-and-search/`** - Pagination, filtering, and claim history endpoints.
7. **`07-maintenance/`** - Administrative actions like deactivating products, plans, policies, or users.

### Glossary & Global Variables
For Postman, set these variables in your environment:
- `{{baseUrl}}`: `http://localhost:8081` (or your backend URL)
- `{{adminToken}}`: Extracted from Admin Login
- `{{staffToken_health}}`, `{{staffToken_vehicle}}`, `{{staffToken_life}}`: Extracted from Staff Logins
- `{{customerToken_1}}` ... `{{customerToken_10}}`: Extracted from Customer Logins
- All passwords are `password123`, which is base64 encoded as `cGFzc3dvcmQxMjM=` (for login).

*(You can also use the exported Postman collection `End_to_End_Scenario.postman_collection.json` which automates token extraction).*

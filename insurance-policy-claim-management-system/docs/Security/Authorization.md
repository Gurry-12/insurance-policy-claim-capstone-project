# Role-Based Authorization (RBAC)

The **Insurance Policy & Claim Management System** uses fine-grained Role-Based Access Control (RBAC) to enforce least-privilege access across APIs.

---

## 1. Supported Roles
- **`CUSTOMER`**: Policyholders who can view policies, purchase coverage, file claims, and pay premiums.
- **`STAFF`**: Insurance adjusters and underwriters who evaluate claims, review documentation, and manage policy lifecycles.
- **`ADMIN`**: System administrators who configure pricing rules, manage product offerings, and oversee staff/users.

---

## 2. Enforcement Mechanisms
1. **URL-Level Security (`SecurityConfig.java`)**:
   - `/api/public/**`, `/api/auth/**`, `/swagger-ui/**`: Unauthenticated / Permitted for all.
   - `/api/admin/**`: Restricted to `ADMIN`.
   - `/api/staff/**`: Restricted to `STAFF` and `ADMIN`.
   - `/api/customer/**`: Restricted to `CUSTOMER`.

2. **Method-Level Security**:
   - Uses `@PreAuthorize("hasRole('ADMIN')")`, `@PreAuthorize("hasRole('STAFF')")`, etc., on Service and Controller methods.

3. **Domain Ownership Validation**:
   - Customers can only access their own policies and claims (validated via user ID matching in service logic).

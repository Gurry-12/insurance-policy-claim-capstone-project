# ⚙️ API & Services Layer

> Covers: `api/axiosInstance.js`, all files in `services/`, `hooks/`, `utils/`, and `routes/`

---

## 📌 Overview

The services layer is the bridge between **React pages** and the **backend REST API**.

```
Page Component
    │ calls
    ▼
Service Function  (e.g., claimService.getAllClaims())
    │ uses
    ▼
axiosInstance     (pre-configured Axios with base URL + auth token)
    │ hits
    ▼
Backend API       (Spring Boot REST)
```

---

## 🌐 `api/axiosInstance.js`

The **single Axios instance** used by all services.

```js
import axios from "axios";
import { getToken } from "../utils/storageUtils";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g., http://localhost:8080/api
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR: attach JWT token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR: handle 401 (unauthorized) globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → force logout
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
```

---

## 📦 Services Reference

### `authService.js`

```js
login(credentials); // POST /auth/login   → returns { token }
register(userData); // POST /auth/register → returns user info
```

### `productService.js`

```js
getAllProducts(); // GET  /products
getProductById(id); // GET  /products/{id}
createProduct(data); // POST /products
updateProduct(id, data); // PUT  /products/{id}
deleteProduct(id); // DELETE /products/{id}
```

### `planService.js`

```js
getAllPlans(); // GET  /plans
getPlansByProduct(productId); // GET  /plans?productId={id}
getPlanById(id); // GET  /plans/{id}
createPlan(data); // POST /plans
updatePlan(id, data); // PUT  /plans/{id}
deletePlan(id); // DELETE /plans/{id}
```

### `customerService.js`

```js
getAllCustomers(page, size); // GET  /customers?page=0&size=10
getCustomerById(id); // GET  /customers/{id}
getMyProfile(); // GET  /customers/me
updateProfile(data); // PUT  /customers/me
```

### `policyService.js`

```js
getAllPolicies(params); // GET  /policies?status=ACTIVE&page=0
getMyPolicies(); // GET  /policies/my
getPolicyById(id); // GET  /policies/{id}
purchasePolicy(data); // POST /policies/purchase
issuePolicy(data); // POST /policies/issue  (Admin/Agent only)
```

### `paymentService.js`

```js
getAllPayments(params); // GET  /payments?page=0&size=10
getMyPayments(); // GET  /payments/my
recordPayment(data); // POST /payments
```

### `claimService.js`

```js
getAllClaims(params); // GET  /claims?status=PENDING&page=0
getMyClaims(); // GET  /claims/my
getClaimById(id); // GET  /claims/{id}
raiseClaim(data); // POST /claims
setRecommendation(id, data); // PUT  /claims/{id}/recommend  (Agent)
approveClaim(id); // PUT  /claims/{id}/approve    (Admin)
rejectClaim(id, reason); // PUT  /claims/{id}/reject     (Admin)
```

### `claimHistoryService.js`

```js
getHistoryByClaimId(claimId); // GET  /claims/{id}/history
```

### `userService.js`

```js
getAllUsers(params); // GET  /users?role=AGENT&page=0
getUserById(id); // GET  /users/{id}
createAgent(data); // POST /users/agent
```

### `dashboardService.js`

```js
getAdminStats(); // GET  /dashboard/admin
getAgentStats(); // GET  /dashboard/agent
getCustomerStats(); // GET  /dashboard/customer
```

---

## 🪝 Hooks Reference

### `useAuth.js`

```js
const { user, token, isAuthenticated, login, logout } = useAuth();
// Wraps useContext(AuthContext)
```

### `useTheme.js`

```js
const { theme, toggleTheme } = useTheme();
// theme = "light" | "dark"
// Wraps useContext(ThemeContext)
```

### `useDebounce.js`

Delays a value update - useful for search inputs.

```js
const debouncedSearch = useDebounce(searchTerm, 500);
// Only updates after 500ms of no typing
// Use in useEffect dependency to avoid API spam
```

### `usePagination.js`

Manages pagination state for list pages.

```js
const { currentPage, totalPages, setTotalPages, setCurrentPage, pageParams } =
  usePagination();
// pageParams = { page: currentPage - 1, size: 10 }
// Use pageParams as query params when fetching lists
```

---

## 🔧 Utils Reference

### `utils/constants.js`

```js
export const PAGE_SIZE = 10;

export const CLAIM_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const POLICY_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

export const PAYMENT_MODE = {
  CASH: "CASH",
  ONLINE: "ONLINE",
  CHEQUE: "CHEQUE",
};
```

### `utils/roles.js`

```js
export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  AGENT: "ROLE_AGENT",
  CUSTOMER: "ROLE_CUSTOMER",
};
```

### `utils/formatters.js`

```js
formatDate(dateString); // "2024-01-15" → "Jan 15, 2024"
formatCurrency(amount); // 50000 → "₹50,000.00"
formatPhone(phone); // "9876543210" → "+91 98765 43210"
formatStatus(status); // "UNDER_REVIEW" → "Under Review"
```

### `utils/storageUtils.js`

```js
saveToken(token); // localStorage.setItem('token', token)
getToken(); // localStorage.getItem('token')
removeToken(); // localStorage.removeItem('token')
saveUser(user); // localStorage.setItem('user', JSON.stringify(user))
getUser(); // JSON.parse(localStorage.getItem('user'))
clearAll(); // localStorage.clear()
```

### `utils/validators.js`

```js
isRequired(value); // returns error string or null
isEmail(value); // validates email format
isMinLength(value, min); // returns error if shorter
isMaxLength(value, max); // returns error if longer
isNumber(value); // validates numeric
isPositive(value); // value > 0
validateForm(fields, rules); // returns errors object
```

---

## 🔒 Routes Reference

### `routes/ProtectedRoute.jsx`

Redirects unauthenticated users to `/login`.

```jsx
// Usage in App.jsx:
<Route element={<ProtectedRoute />}>
  <Route path="/admin/*" element={<AdminRoutes />} />
</Route>;

// Internal logic:
const { isAuthenticated } = useAuth();
if (!isAuthenticated) return <Navigate to="/login" />;
return <Outlet />;
```

### `routes/RoleProtectedRoute.jsx`

Redirects users with wrong role to `/unauthorized`.

```jsx
// Usage in App.jsx:
<Route element={<RoleProtectedRoute role={ROLES.ADMIN} />}>
  <Route path="dashboard" element={<AdminDashboard />} />
</Route>;

// Internal logic:
const { user } = useAuth();
if (user?.role !== role) return <Navigate to="/unauthorized" />;
return <Outlet />;
```

---

## 📐 Concepts to Learn

| Concept                       | Applied In               | Resource                                                                                                       |
| ----------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Axios instance configuration  | `axiosInstance.js`       | [Axios create](https://axios-http.com/docs/instance)                                                           |
| Axios interceptors            | `axiosInstance.js`       | [Axios interceptors](https://axios-http.com/docs/interceptors)                                                 |
| Async/await with try-catch    | All service functions    | [MDN async/await](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS/Promises) |
| Environment variables in Vite | `import.meta.env.VITE_*` | [Vite env vars](https://vite.dev/guide/env-and-mode)                                                           |
| Custom React Hooks            | `hooks/` folder          | [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)                                  |
| Debouncing                    | `useDebounce.js`         | [Debounce concept](https://css-tricks.com/debouncing-throttling-explained-examples/)                           |
| Pagination                    | `usePagination.js`       | `currentPage`, `totalPages` pattern                                                                            |

---

## 🏗️ Service Function Template

Every service function follows this pattern:

```js
// services/claimService.js
import axiosInstance from "../api/axiosInstance";

export const getClaims = async (params = {}) => {
  const response = await axiosInstance.get("/claims", { params });
  return response.data; // { content: [...], totalPages: 5, totalElements: 42 }
};

export const getClaimById = async (id) => {
  const response = await axiosInstance.get(`/claims/${id}`);
  return response.data;
};

export const raiseClaim = async (claimData) => {
  const response = await axiosInstance.post("/claims", claimData);
  return response.data;
};
```

```js
// How to use in a page component:
useEffect(() => {
  const fetchClaims = async () => {
    try {
      setLoading(true);
      const data = await getClaims({ page: currentPage - 1, size: 10 });
      setClaims(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch claims");
    } finally {
      setLoading(false);
    }
  };
  fetchClaims();
}, [currentPage]);
```

---

## ✅ Services & Utils Checklist

**API**

- [ ] `axiosInstance.js` - base URL, request interceptor, 401 handler

**Services**

- [ ] `authService.js` - login, register
- [ ] `productService.js` - CRUD
- [ ] `planService.js` - CRUD + filter by product
- [ ] `customerService.js` - list, detail, my profile, update
- [ ] `policyService.js` - list, my policies, purchase, issue
- [ ] `paymentService.js` - list, my payments, record
- [ ] `claimService.js` - list, my claims, raise, recommend, approve/reject
- [ ] `claimHistoryService.js` - get history by claim ID
- [ ] `userService.js` - list, create agent
- [ ] `dashboardService.js` - stats per role

**Hooks**

- [ ] `useAuth.js`
- [ ] `useTheme.js`
- [ ] `useDebounce.js`
- [ ] `usePagination.js`

**Utils**

- [ ] `constants.js`
- [ ] `roles.js`
- [ ] `formatters.js`
- [ ] `storageUtils.js`
- [ ] `validators.js`

# Common Debugging Guide

> **What:** Solutions to the most common problems encountered when developing InsureFlow.  
> **Why:** Saves time by documenting known failure patterns and their root causes.  
> **How:** Each section explains what to check, why it fails, and how to fix it.

---

## API Failures

### Symptom: All API calls return 401 Unauthorized

**Root cause:** Token expired or missing from localStorage.

**Check:**

```js
// In browser console:
localStorage.getItem("ss_token");
// If null → user session expired
```

**What happens automatically:**

- `axiosInstance` response interceptor catches 401
- Removes `ss_token` and `ss_user` from localStorage
- Dispatches `auth:unauthorized` window event
- `GlobalApiHandler` receives event → calls `logout()` → navigates to `/login`

**If it's not redirecting:** Check that `GlobalApiHandler` is mounted in `App.jsx`. It must be rendered at the root level, **outside** any route wrapper.

---

### Symptom: API call returns 403 Forbidden

**Root cause:** User is authenticated but doesn't have permission for that resource.

**What happens automatically:**

- `axiosInstance` dispatches `auth:forbidden` event
- `GlobalApiHandler` navigates to `/unauthorized`

**Manual check:** Ensure the user's `role` (from `user.role`) matches the resource's required role. See `src/utils/roles.js`.

---

### Symptom: API call fails with "Network Error" or no response

**Root causes:**

1. Backend server not running on `VITE_API_BASE_URL`
2. CORS misconfiguration on backend
3. Wrong `VITE_API_BASE_URL` in `.env`

**Check:**

```bash
# Verify the backend URL in .env:
cat .env
# Should show: VITE_API_BASE_URL=http://localhost:8081/api

# Test backend directly:
curl http://localhost:8081/api/auth/login
```

**What happens:** For 500+ or no-response errors, `axiosInstance` dispatches `api:error` event → `GlobalApiHandler` shows `notify.error()` toast.

---

### Symptom: API response data is undefined

**Root cause:** Misunderstanding of `apiAdapter`'s response normalization.

**Check these access patterns:**

```js
// Service returns the apiAdapter-normalized response:
const response = await axiosInstance.get("/endpoint");

// For single objects:
response.data; // The actual object
response.policyId; // Also works (backward compat spread)

// For paginated lists:
response.data; // Array of items (= response.content)
response.pagination; // { pageNumber, pageSize, totalPages, ... }
response.content; // Also works (backward compat)

// For arrays:
response.data; // The array
// response is also the array (backward compat)
```

---

### Symptom: FormData upload (claim raise / document upload) fails

**Root cause:** Manually setting `Content-Type: multipart/form-data` without the boundary.

**The correct approach (already handled in axiosInstance):**

```js
// The request interceptor does this automatically:
if (config.data instanceof FormData) {
  delete config.headers["Content-Type"];
  // Let the browser set it with the correct boundary
}
```

**If you see a boundary error:** Make sure you're not setting `Content-Type` manually when sending FormData. Remove any:

```js
// ❌ Wrong:
headers: { 'Content-Type': 'multipart/form-data' }

// ✓ Correct: don't set it at all for FormData
```

---

### Symptom: 400 Bad Request with field errors not showing

**Root cause:** The `fieldErrors` from the backend are not being rendered.

**How it works:**

1. Backend returns `ValidationErrorResponseDTO` with `fieldErrors: { email: "..." }`
2. `apiAdapter.parseErrorResponse()` extracts `fieldErrors`
3. `useApiForm.submit()` catches the error, sets `setFieldErrors(error.fieldErrors)`
4. Component renders `{fieldErrors.email && <span>{fieldErrors.email}</span>}`

**Check:** Is the field name in `fieldErrors` matching exactly what the backend sends? Log `error.fieldErrors` in the catch block to verify.

---

## Toast / Notification Issues

### Symptom: Toast shows twice for the same action

**Root cause:** `notify.success()` called in both the hook and the component.

**Fix:** `useApiForm` automatically calls `notify.success(response)`. Don't call it again in the component:

```jsx
// ❌ Wrong - double toast:
const { submit } = useApiForm(apiFunc, (data) => {
  notify.success("Saved!"); // ← removes this
  navigate("/success");
});

// ✓ Correct:
const { submit } = useApiForm(apiFunc, () => navigate("/success"));
// useApiForm already shows the backend's success message
```

---

### Symptom: Toast shows "undefined" or "[object Object]"

**Root cause:** Passing a non-string, non-object-with-message to `notify.success/error`.

**Check the `notify` service:**

```js
success(response, fallback = "Operation successful") {
  const message = typeof response === 'string'
    ? response
    : (response?.message || fallback);
  toast.success(message);
}
```

**Fix:** Pass either a string or the full response object:

```js
notify.success("Done!"); // ✓ String
notify.success(response); // ✓ Object with .message
notify.error("Something failed"); // ✓ String
notify.error(err); // ✓ Error object with .message
```

---

### Symptom: No toast appears at all

**Check 1:** Is `<GlobalToaster />` rendered in `App.jsx`?

```jsx
// In App.jsx - must be present:
<GlobalToaster />
```

**Check 2:** Is the `react-hot-toast` import correct?

```js
import toast from "react-hot-toast";
```

---

## State Issues

### Symptom: Table data doesn't refresh after an action (approve, cancel, etc.)

**Root cause:** After a mutation (PATCH/POST), the local state isn't updated.

**Fix options:**

Option A - Re-fetch after mutation:

```jsx
const { submit } = useApiForm(
  claimService.approveClaim,
  () => fetchClaimData(), // Re-fetch the claim
);
```

Option B - Update state optimistically:

```jsx
setClaim((prev) => ({ ...prev, claimStatus: "APPROVED" }));
```

Option C - Force full reload:

```js
window.location.reload(); // Last resort, not recommended
```

---

### Symptom: Form data resets when navigating back

**Root cause:** React unmounts and remounts pages on navigation, resetting all `useState`.

**Fix (if you need to persist form state):**

1. Pass data via `navigate('/path', { state: { formData } })` and read with `useLocation().state`
2. Store in localStorage/sessionStorage
3. Use URL query params

---

### Symptom: `user` is null in a component that requires it

**Check 1:** Is `useAuth()` returning null?

```js
const { user } = useAuth();
console.log(user); // null = token exists but user parsing failed
```

**Root cause:** `ss_user` in localStorage is corrupted JSON.

**Fix:**

```js
localStorage.removeItem("ss_user");
// Then log in again
```

**Prevention:** `AuthContext` already wraps the parse in try/catch and falls back to null.

---

### Symptom: `isAuthenticated` is false even though the user is logged in

**Root cause:** `ss_token` was removed from localStorage (cleared by another tab, extension, or logout).

**Check:**

```js
localStorage.getItem("ss_token"); // Should not be null
```

---

## Validation Bugs

### Symptom: Form submits with invalid data

**Root cause:** The `validate()` function has a logic bug.

**Debug approach:**

```js
const errs = validate(); // Call before return
console.log(errs); // Check what's returned
```

**Common mistake:** Using loose equality `==` or not trimming whitespace:

```js
// ❌ Bug:
if (!formData.fullName) // passes for "   " (spaces only)

// ✓ Fix:
if (!formData.fullName.trim()) // catches whitespace-only
```

---

### Symptom: Backend returns validation error but field error is not shown

**Check:** Is `fieldErrors` from `useApiForm` being rendered?

```jsx
// Must be in the JSX:
{
  fieldErrors.fieldName && (
    <div className="text-danger small">{fieldErrors.fieldName}</div>
  );
}
```

**Check:** Is the field name in `fieldErrors` matching exactly? Backend may send `mobileNumber` but you're checking `mobile`.

---

## Routing Bugs

### Symptom: After login, user is redirected to the wrong page

**Check:** `ROLE_HOME` in `src/utils/roles.js`:

```js
export const ROLE_HOME = {
  [ROLES.ADMIN]: "/dashboard", // → DashboardRedirect
  [ROLES.INTERNAL_STAFF]: "/dashboard",
  [ROLES.CUSTOMER]: "/dashboard",
};
```

`/dashboard` is handled by `DashboardRedirect` component which redirects to the role-specific dashboard.

**Check:** Is `user.role` being set correctly after login?

```js
// In authService.login():
const user = {
  role: payload.role || (decoded.role ?? decoded.roles?.[0] ?? null),
};
```

If `payload.role` is `null`, it falls back to the JWT decoded role.

---

### Symptom: "Route not found" (blank page or 404 UI)

**Check:** Does the route exist in `App.jsx`? Search for the path string:

```bash
grep -n "/your/path" src/App.jsx
```

**Check:** Is the page component imported correctly? Check for typos in the static `import` path.

---

### Symptom: Authenticated user can access guest routes (/login, /register)

**Expected behavior:** `GuestRoute` should redirect authenticated users.

**Check:** Is the user's `token` in localStorage and is `isAuthenticated` true?

```js
const { isAuthenticated } = useAuth();
// Should be true for logged-in users
```

---

## Authentication Issues

### Symptom: Login loop (login page keeps refreshing)

**Root cause:** `isLoggingOut` flag in localStorage was not cleared.

**Fix:**

```js
localStorage.removeItem("isLoggingOut");
```

---

### Symptom: Session expires and user sees no toast

**Check:** Is `GlobalApiHandler` listening correctly?

```jsx
// In App.jsx:
<GlobalApiHandler /> // Must be present
```

The component listens for `auth:unauthorized` DOM events. If it's not rendered, no toast will appear.

---

## Performance Issues

### Symptom: Page loads very slowly

**Check 1:** Too many API calls in `getAdminStats()`. If any individual call is slow, the dashboard waits.

**Check 2:** Are components causing unnecessary re-renders? Add a `console.log` to track renders.

**Check 3:** Is `useCallback` missing on the `fetchFunction` passed to `useApiTable`? Without it, the function reference changes on every render, causing infinite re-fetches.

---

### Symptom: Table re-fetches on every render

**Root cause:** The effect dependencies include non-memoized objects/functions.

**Fix:** Use `JSON.stringify` or memoize the dependency:

```js
useEffect(() => {
  fetchData();
}, [
  tableState.currentPage,
  tableState.sortBy,
  tableState.sortDirection,
  JSON.stringify(tableState.filters), // ← stringify prevents reference equality issues
]);
```

---

## Related Documentation

- [Axios Layer](../services/axios-layer.md)
- [State Management](../contexts/state-management.md)
- [API Flow Diagrams](../services/api-flow-diagrams.md)
- [Developer Guide](../developer-guide.md)

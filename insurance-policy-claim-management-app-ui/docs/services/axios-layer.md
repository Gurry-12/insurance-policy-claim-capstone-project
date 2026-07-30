# Axios Layer

> **What:** The HTTP communication layer between the frontend and backend.  
> **Why:** Centralizes auth token injection, NProgress bar, and global error handling so individual components never need to handle these concerns.  
> **Where:** `src/api/`

---

## Files

| File                                                 | Purpose                                                           |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| [`axiosInstance.js`](../../src/api/axiosInstance.js) | Configured Axios instance with request/response interceptors      |
| [`apiAdapter.js`](../../src/api/apiAdapter.js)       | Transforms backend API envelopes into normalized frontend objects |
| [`apiTypes.js`](../../src/api/apiTypes.js)           | JSDoc type definitions for all API DTOs                           |

---

## axiosInstance.js

### Configuration

```js
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});
```

Base URL comes from `.env` file:

```
VITE_API_BASE_URL=http://localhost:8081/api
```

---

### Request Interceptor

Fires before every outgoing request:

1. **NProgress.start()** - shows top-of-page loading bar
2. **FormData detection** - removes `Content-Type` header so browser sets it with multipart boundary
3. **JWT injection** - reads `ss_token` from localStorage, adds `Authorization: Bearer <token>`

```js
axiosInstance.interceptors.request.use((config) => {
  NProgress.start();
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  const token = localStorage.getItem("ss_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

### Response Interceptor

Fires after every response:

**On success (2xx):**

1. `NProgress.done()` - hides loading bar
2. `parseSuccessResponse(response)` - normalizes the `ApiResponseDTO` envelope

**On error (4xx / 5xx / network):**

1. `NProgress.done()`
2. **401 Unauthorized:**
   - Removes `ss_token` and `ss_user` from localStorage
   - Dispatches `auth:unauthorized` custom DOM event
3. **403 Forbidden:**
   - Dispatches `auth:forbidden` custom DOM event
4. **500+ or no response:**
   - Dispatches `api:error` custom DOM event with error message
5. Returns `Promise.reject(parseErrorResponse(error))` so the calling service/hook can catch it

---

### Global Event System

The interceptor uses DOM custom events to communicate with `GlobalApiHandler`:

| Event               | Trigger         | Handler                       |
| ------------------- | --------------- | ----------------------------- |
| `auth:unauthorized` | 401 response    | logout + redirect to `/login` |
| `auth:forbidden`    | 403 response    | redirect to `/unauthorized`   |
| `api:error`         | 500+ or network | shows `notify.error()` toast  |

This decouples the Axios layer from React state. The interceptor doesn't need access to `navigate()` or `logout()` directly.

---

## apiAdapter.js

### Purpose

Transforms the backend's `ApiResponseDTO<T>` envelope into a consistent shape that all services and hooks can rely on.

### parseSuccessResponse(response)

```
Input: Axios response object
Output: Normalized response object
```

**Case 1: Paginated response** (has `content` and `pageNumber` fields in `data`)

```js
return {
  success: true,
  message: "...",
  data: payload.data.content,  // The actual array
  pagination: {
    pageNumber, pageSize, totalRecords, totalPages, lastPage, sortingType
  },
  // Backward compatibility aliases:
  content: payload.data.content,
  totalPages: ...,
  pageNumber: ...,
};
```

**Case 2: Array response**

Returns the array with `.success`, `.message`, `.data` properties attached.

**Case 3: Single object response**

```js
return {
  success: true,
  message: "...",
  data: responseData,
  // Backward compatibility: spreads all fields from responseData onto the result
  ...responseData,
};
```

The backward compatibility spread means older components can access `response.policyId` instead of `response.data.policyId`.

---

### parseErrorResponse(error)

```
Input: Axios error object
Output: Normalized error object
```

```js
return {
  success: false,
  message: payload.message || "An unexpected error occurred",
  errorType: payload.errorType, // e.g., "NOT_FOUND", "BAD_REQUEST"
  statusCode: payload.statusCode, // e.g., 404, 400
  fieldErrors: payload.fieldErrors || null, // Map of field-name → error message
  timeStamp: payload.timeStamp,
};
```

Network errors (no response):

```js
return {
  success: false,
  message: error.message || "Network Error",
  errorType: "NETWORK_ERROR",
  statusCode: error.response?.status || 500,
  fieldErrors: null,
};
```

---

## Backend API Envelopes

The backend wraps all responses in standard envelopes defined in `apiTypes.js`:

### Success Envelope (ApiResponseDTO\<T\>)

```json
{
  "message": "User-facing success message",
  "success": true,
  "timeStamp": "2024-01-15T10:30:00",
  "data": { "..." }
}
```

### Paginated Envelope (ApiResponseDTO\<PageResponseDTO\<T\>\>)

```json
{
  "message": "...",
  "success": true,
  "timeStamp": "...",
  "data": {
    "content": [...],
    "pageNumber": 0,
    "pageSize": 10,
    "totalRecords": 50,
    "totalPages": 5,
    "lastPage": false,
    "sortingType": "desc"
  }
}
```

### Error Envelope (ErrorResponseDTO)

```json
{
  "message": "Policy not found",
  "success": false,
  "errorType": "NOT_FOUND",
  "statusCode": 404,
  "timeStamp": "...",
  "requestPath": "/api/policies/99"
}
```

### Validation Error Envelope (ValidationErrorResponseDTO)

```json
{
  "message": "Validation failed",
  "success": false,
  "errorType": "BAD_REQUEST",
  "statusCode": 400,
  "timeStamp": "...",
  "requestPath": "/api/auth/register",
  "fieldErrors": {
    "email": "Enter valid email.",
    "password": "Password must be at least 8 characters."
  }
}
```

---

## NProgress Configuration

```js
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });
```

- **No spinner** - only the thin horizontal progress bar at the top of the page
- **Speed:** 400ms transitions
- **Minimum:** 10% fill before animation starts

---

## Adding a New Endpoint

1. Create or add to a service file in `src/services/`
2. Call `axiosInstance.get/post/put/patch/delete(url, data/params)`
3. The interceptors handle auth and error events automatically
4. The adapter normalizes the response automatically
5. Return the response from the service function

```js
// Example: New service function
export const getSomething = async (id) => {
  const response = await axiosInstance.get(`/something/${id}`);
  return response; // Already normalized by apiAdapter
};
```

---

## Related Documentation

- [Services Overview](./services-overview.md)
- [API Flow Diagrams](./api-flow-diagrams.md)
- [Debugging API Failures](../debugging/debugging.md#api-failures)

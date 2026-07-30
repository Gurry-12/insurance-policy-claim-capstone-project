# Hooks and Events Exhaustive Map

> **What:** A comprehensive dictionary of every custom hook and global event system used in the architecture.
> **Why:** Acts as a cheat sheet for new developers to know *what* utility to use *when*, preventing duplicate code.

---

## Custom Hooks Dictionary

### 1. `useAuth` (`src/hooks/useAuth.js`)
*   **Purpose**: Consumer for `AuthContext`. Provides access to the globally authenticated user and methods to alter authentication state.
*   **Returns**: 
    *   `user`: Object containing `{ role, id, name }`. Null if unauthenticated.
    *   `token`: JWT string.
    *   `login(token, user)`: Method to save credentials to state and `localStorage`.
    *   `logout()`: Method to clear credentials and redirect to login.
*   **Where to use**: Inside any component requiring the user's role (e.g., conditional rendering of buttons based on Admin vs Staff).

### 2. `useTheme` (`src/hooks/useTheme.js`)
*   **Purpose**: Consumer for `ThemeContext`. Provides dark mode toggling.
*   **Returns**: 
    *   `theme`: Current theme string (`'light'` or `'dark'`).
    *   `toggleTheme()`: Method to flip the theme, updates `document.documentElement.dataset.bsTheme`.
*   **Where to use**: Only needed in layout headers/footers containing a theme toggle switch.

### 3. `useApiTable` (`src/hooks/useApiTable.js`)
*   **Purpose**: Orchestrates all server-side pagination, sorting, and API fetching for data grids.
*   **Returns**:
    *   `data`: Array of currently fetched rows.
    *   `loading`, `error`: State indicators.
    *   `tableState`: Object containing `page`, `size`, `sortBy`, `sortDir`.
    *   `totalRecords`, `totalPages`: For pagination UI.
    *   `handlers`: `{ onPageChange, onSort, onSearch }` methods to attach to the UI.
*   **Where to use**: On any page rendering a `<DataTable>` that requires server-side fetching (e.g., Policy Lists, Claim Lists).

### 4. `useTableState` (`src/hooks/useTableState.js`)
*   **Purpose**: A localized state reducer used internally by `useApiTable`.
*   **Returns**: Reducer state and dispatch methods for managing pagination math.
*   **Where to use**: Do not use directly. Use `useApiTable`.

### 5. `useApiForm` (`src/hooks/useApiForm.js`)
*   **Purpose**: Centralized form state management (controlled components approach) without heavy libraries.
*   **Returns**:
    *   `formData`: Object holding current form values.
    *   `errors`: Validation error map.
    *   `handleChange(e)`: Standard React input handler.
    *   `setErrors(errs)`: Manual error injection.
*   **Where to use**: Best for small to medium forms (e.g., Issue Policy, Profile Update). For complex validation, use `react-hook-form` (like in `Login.jsx`).

### 6. `useClaimPdf` (`src/hooks/PdfDownload/useClaimPdf.js`)
*   **Purpose**: Encapsulates the logic and formatting for generating a PDF receipt/summary of a claim.
*   **Returns**: 
    *   `downloadClaim(claimObj)`: Method that generates and triggers a PDF download using `jspdf` and `jspdf-autotable`.
*   **Where to use**: Claim detail pages or lists where a "Download PDF" action is required.

---

## Global Event System

The application utilizes native browser CustomEvents to communicate across decoupled architectural layers, primarily between the Axios Interceptors (Network Layer) and React Components (UI Layer).

### Event: `auth:unauthorized`
*   **Triggered By**: `axiosInstance.js` (Interceptor) when a `401 Unauthorized` response is received.
*   **Listened By**: `AuthContext.jsx` (`useEffect`)
*   **Action Taken**: 
    1. Interceptor fires the event.
    2. AuthContext catches it.
    3. AuthContext calls its internal `logout()` method.
    4. User is redirected to `/login` automatically.
*   **Why**: Axios cannot access React Router's `useNavigate` or `AuthContext` directly. This event bridges the gap.

### Event: `api:error`
*   **Triggered By**: `axiosInstance.js` (Interceptor) when general API errors occur (e.g., 500 Server Error).
*   **Listened By**: Global Toast Provider or individual Layout components (if implemented).
*   **Action Taken**: Shows a global toast notification. 
*   **Why**: Centralizes generic error handling so individual components don't need to manually throw toasts for 500 errors.

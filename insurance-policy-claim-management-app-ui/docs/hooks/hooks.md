# Custom Hooks

> **What:** All custom React hooks in the InsureFlow application.  
> **Why:** Hooks extract and reuse complex stateful logic that would otherwise be duplicated across many components.  
> **Where:** `src/hooks/`

---

## useAuth.js

**File:** [`src/hooks/useAuth.js`](../../src/hooks/useAuth.js)

### Purpose

Provides access to the `AuthContext` from any component.

### Returns

```js
const { token, user, isAuthenticated, login, logout } = useAuth();
```

| Return Value | Type | Description |
|---|---|---|
| `token` | `string \| null` | The current JWT token |
| `user` | `object \| null` | `{ id, email, role, name, productSpeciality }` |
| `isAuthenticated` | `boolean` | `true` if token exists |
| `login(token, user)` | `function` | Sets token + user in state and localStorage |
| `logout()` | `function` | Clears token + user from state and localStorage |

### Usage

```jsx
const { user, logout } = useAuth();
// user.role === 'ROLE_ADMIN'
// user.name === 'Shyam Verma'
```

---

## useTheme.js

**File:** [`src/hooks/useTheme.js`](../../src/hooks/useTheme.js)

### Purpose

Provides access to the `ThemeContext` - the current theme and a function to toggle it.

### Returns

```js
const { theme, toggleTheme } = useTheme();
```

| Return Value | Type | Description |
|---|---|---|
| `theme` | `'light' \| 'dark'` | Current theme |
| `toggleTheme` | `function` | Switches between light and dark |

### Side Effects

When `theme` changes:
- `document.documentElement.setAttribute('data-theme', theme)` - enables CSS custom property theming
- `document.documentElement.setAttribute('data-bs-theme', theme)` - enables Bootstrap dark mode
- `localStorage.setItem('ss_theme', theme)` - persists preference

---

## useApiForm.js

**File:** [`src/hooks/useApiForm.js`](../../src/hooks/useApiForm.js)

### Purpose

Encapsulates the common pattern of submitting a form to an API: loading state, field error handling, success callback, and toast notifications.

### Signature

```js
const { submit, loading, fieldErrors, setFieldErrors } = useApiForm(apiFunction, onSuccess);
```

| Parameter | Type | Description |
|---|---|---|
| `apiFunction` | `async function` | The service function to call (e.g., `claimService.raiseClaim`) |
| `onSuccess` | `function` | Callback called with `response.data` on success |

### Returns

| Return Value | Type | Description |
|---|---|---|
| `submit(payload, customCallback?)` | `async function` | Calls the API, handles loading/errors/toasts |
| `loading` | `boolean` | `true` while API call is in flight |
| `fieldErrors` | `object` | Map of `{ fieldName: errorMessage }` from validation errors |
| `setFieldErrors` | `function` | Manually set field errors if needed |

### How it works

```js
const submit = async (payload, customSuccessCallback) => {
  setLoading(true);
  setFieldErrors({});
  try {
    const response = await apiFunction(payload);
    if (response.success) {
      notify.success(response);           // Toast the backend's message
      onSuccess?.(response.data)          // Call parent callback
    }
    return response;
  } catch (error) {
    if (error.fieldErrors) {
      setFieldErrors(error.fieldErrors);  // Show inline field errors
      notify.error("Please correct the highlighted fields.");
    } else {
      notify.error(error);                // Show generic toast
    }
    throw error;                          // Re-throw so caller can handle
  } finally {
    setLoading(false);
  }
};
```

### Usage Example

```jsx
const { submit, loading, fieldErrors } = useApiForm(
  customerService.createProfile,
  () => navigate('/customer/profile')
);

const handleSubmit = (e) => {
  e.preventDefault();
  submit(formData);
};
```

---

## useApiTable.js

**File:** [`src/hooks/useApiTable.js`](../../src/hooks/useApiTable.js)

### Purpose

Manages all state for a paginated server-side table: fetching data, loading state, pagination, sorting, and filter updates.

### Signature

```js
const {
  data, loading, error, pagination, params,
  handlePageChange, handleSortChange, handleFilterChange, refresh
} = useApiTable(fetchFunction, initialParams);
```

| Parameter | Description |
|---|---|
| `fetchFunction` | A service function that accepts `params` and returns a paginated response |
| `initialParams` | Initial query params (e.g., `{ page: 0, size: 10 }`) |

### Returns

| Return Value | Type | Description |
|---|---|---|
| `data` | `array` | Current page of data |
| `loading` | `boolean` | API call in progress |
| `error` | `object \| null` | Last error if call failed |
| `pagination` | `object` | `{ pageNumber, pageSize, totalRecords, totalPages }` |
| `params` | `object` | Current query params |
| `handlePageChange(page)` | `function` | Changes page |
| `handleSortChange(field, dir)` | `function` | Updates sort, resets to page 0 |
| `handleFilterChange(filters)` | `function` | Merges filters, resets to page 0 |
| `refresh()` | `function` | Re-fetches with current params |

### How re-fetching works

`fetchData` is a `useCallback` that depends on `fetchFunction` and `params`. Whenever `params` changes (pagination, sort, filters), `fetchData` reference changes, which triggers the `useEffect` to re-run.

---

## useTableState.js

**File:** [`src/hooks/useTableState.js`](../../src/hooks/useTableState.js)

### Purpose

Combines pagination + sorting + filtering into a single composable state manager. Used by most list pages instead of `useApiTable`.

### Signature

```js
const tableState = useTableState({
  initialSortBy: 'id',
  initialSortDirection: 'desc',
  initialFilters: { status: '', searchTerm: '' }
});
```

### Returns

Everything from `usePagination` plus:

| Return Value | Type | Description |
|---|---|---|
| `sortBy` | `string` | Current sort field |
| `sortDirection` | `'asc' \| 'desc'` | Current sort direction |
| `handleSort(field)` | `function` | Toggles direction if same field, else sets new field |
| `filters` | `object` | Current filter values |
| `handleFilterChange(updates)` | `function` | Merges updates into filters, resets to page 1 |
| `getQueryParams()` | `function` | Returns complete API param object |
| `getSrNo(index)` | `function` | Calculates display serial number from page + index |
| `isLoading` | `boolean` | Loading state |
| `setIsLoading` | `function` | Set loading state |

### getQueryParams()

```js
const params = {
  pageNumber: currentPage - 1,  // Backend is 0-indexed
  pageSize,
  sortDirection,
  sortBy,
  ...filters  // Only non-empty filter values are included
};
```

**Why -1 for pageNumber?** The backend uses 0-indexed pages but `usePagination` uses 1-indexed for the UI.

---

## usePagination.js

**File:** [`src/hooks/usePagination.js`](../../src/hooks/usePagination.js)

### Purpose

Manages pagination state: current page, total pages, total elements, and page size. Used as the foundation of `useTableState`.

### Returns

| Return Value | Type | Description |
|---|---|---|
| `currentPage` | `number` | 1-indexed current page |
| `setCurrentPage` | `function` | Set current page |
| `totalPages` | `number` | Total number of pages |
| `setTotalPages` | `function` | Set total pages after API response |
| `totalElements` | `number` | Total records count |
| `setTotalElements` | `function` | Set total elements after API response |
| `pageSize` | `number` | Records per page |
| `setPageSize` | `function` | Change page size |
| `pageParams` | `object` | `{ pageNumber: currentPage-1, pageSize, sortDirection: 'desc' }` |

---

## useDebounceFilters.js

**File:** [`src/hooks/useDebounceFilters.js`](../../src/hooks/useDebounceFilters.js)

### Purpose

Debounces filter inputs to prevent an API call on every keystroke. Fires the `onFilterChange` callback only after 500ms of inactivity.

### Signature

```js
const { localFilters, handleFilterChange, clearFilters } = useDebounceFilters(
  initialFilters,
  onFilterChange,
  delay  // default: 500ms
);
```

### How it works

```js
useEffect(() => {
  const handler = setTimeout(() => {
    onFilterChange(localFilters);  // Fires actual filter update
  }, delay);
  return () => clearTimeout(handler);  // Cleanup on every change
}, [localFilters, onFilterChange, delay]);
```

### Usage

```jsx
const { localFilters, handleFilterChange, clearFilters } = useDebounceFilters(
  { status: '', name: '' },
  tableState.handleFilterChange
);

// Input:
<input name="name" value={localFilters.name} onChange={handleFilterChange} />
```

---

## useDebounce.js

**File:** [`src/hooks/useDebounce.js`](../../src/hooks/useDebounce.js)

### Purpose

Generic debounce hook that delays updating a value.

### Signature

```js
const debouncedValue = useDebounce(value, delay);
```

Returns the debounced version of `value`. Updates only after `delay` ms of no new `value`.

---

## useSearch.js

**File:** [`src/hooks/useSearch.js`](../../src/hooks/useSearch.js)

### Purpose

Manages search input state with a debounced search term.

### Signature

```js
const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearch(delay);
```

---

## useDocumentTitle.js

**File:** [`src/hooks/useDocumentTitle.js`](../../src/hooks/useDocumentTitle.js)

### Purpose

Sets the browser tab title (`document.title`) for the current page.

### Signature

```js
useDocumentTitle("Login - InsureFlow");
```

---

## PdfDownload Hooks

**Location:** `src/hooks/PdfDownload/`

Custom hooks for generating and downloading PDF reports using `jsPDF` and `jsPDF-autotable`.

---

## Related Documentation

- [State Management](../contexts/state-management.md)
- [Services Overview](../services/services-overview.md)
- [Developer Guide - Adding a Table](../developer-guide.md#adding-a-table)

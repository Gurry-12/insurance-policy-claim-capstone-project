# Custom Hooks and Component Patterns Deep Dive

> **What:** Line-by-line execution flow for generic hooks handling Forms, Tables, Search, Sorting, and Pagination.
> **Why:** A Principal Engineer needs to know exactly how state cascades down from a user click on a Table Header to the API, and back to a UI update.

---

## 1. Table Flow Execution (`useTableState.js` & `useApiTable.js`)

Most data grids in the app use one of these two hooks. `useTableState` builds the local query parameters, while `useApiTable` fully manages the fetch lifecycle.

### The Complete Sort Flow

```text
User clicks on the "Status" Table Header <th>
↓
Component calls `handleSort('status')` from `useTableState`
↓
1. `useTableState` checks if `sortBy === 'status'`
2. If YES: toggles `sortDirection` ('asc' → 'desc')
3. If NO: sets `sortBy` = 'status', `sortDirection` = 'asc'
↓
State update: `setSortBy`, `setSortDirection`
↓
Component Re-renders
↓
The `useEffect` in the Component depends on `[sortBy, sortDirection]`
↓
useEffect fires:
  1. `tableState.setIsLoading(true)`
  2. `tableState.getQueryParams()` builds: `{ page: 1, size: 10, sortBy: 'status', sortDirection: 'desc' }`
  3. `service.getAllPaginated(params)` called.
↓
(Axios executes, backend responds)
↓
Component updates state: `setData(response.data)`, `setTotalPages(response.pagination.totalPages)`
↓
`tableState.setIsLoading(false)`
↓
Component Re-renders
↓
<DataTable /> receives new `data` prop → maps rows to UI.
```

### The Complete Pagination Flow

```text
User clicks "Next Page" in `<PaginationBar />`
↓
Component calls `handlePageChange(2)`
↓
`setCurrentPage(2)` fires (from `usePagination` inside `useTableState`)
↓
Component Re-renders
↓
useEffect dependency array contains `tableState.currentPage`
↓
useEffect fires:
  1. `getQueryParams()` returns `{ page: 2, ... }`
  2. `service.getAllPaginated(params)`
↓
(Axios + Backend)
↓
`setData(response.data)`
↓
Component Re-renders
↓
<DataTable /> updates with Page 2 data.
```

### The Complete Filter Flow

```text
User selects "Active" from a Dropdown
↓
Component `onChange` calls `tableState.handleFilterChange({ status: 'ACTIVE' })`
↓
`useTableState` does two things:
  1. `setFilters(prev => ({ ...prev, status: 'ACTIVE' }))`
  2. `setCurrentPage(1)` (crucial: resets pagination to page 1 on new filter)
↓
Component Re-renders
↓
useEffect dependencies `[tableState.filters, tableState.currentPage]` both changed.
↓
useEffect fires:
  1. `getQueryParams()` strips empty strings, adds `status: 'ACTIVE'`, `page: 1`
  2. `service.getAllPaginated(params)`
↓
(Axios + Backend)
↓
`setData(response.data)`
↓
<DataTable /> updates.
```

---

## 2. Form Submission Flow (`useApiForm.js`)

`useApiForm` abstracts loading states, global error toasts, and field-level validation errors from the backend.

### Success Flow

```text
User fills `<input name="title" />` and clicks "Submit"
↓
Component calls `handleSubmit()` (local validation passes)
↓
Component calls `submit(formData)` from `useApiForm`
↓
`useApiForm` sets `setLoading(true)` and `setFieldErrors({})`
↓
Component Re-renders (Submit button shows spinner, fields disable)
↓
`useApiForm` calls `apiFunction(formData)` (e.g. `productService.createProduct(formData)`)
↓
(Axios + Backend → returns 200 OK)
↓
`useApiForm` handles response:
  1. `notify.success(response)` → Toast appears.
  2. Calls `onSuccess(response.data)` (passed during hook initialization).
↓
Component's `onSuccess` callback fires:
  └─ e.g., `navigate('/admin/products')`
↓
`useApiForm` sets `setLoading(false)` (cleanup)
```

### Backend Validation Error Flow (400 Bad Request)

```text
(Backend finds `title` is too short, returns 400 with `fieldErrors: { title: "Min 5 chars" }`)
↓
`apiAdapter.js` parses the `fieldErrors` into the rejected Promise.
↓
`useApiForm` catch block:
  1. Detects `error.fieldErrors` exists.
  2. `setFieldErrors(error.fieldErrors)` updates state inside hook.
  3. `notify.error("Please correct the highlighted fields.")` → Toast appears.
↓
`useApiForm` sets `setLoading(false)`
↓
Component Re-renders
↓
Component reads `fieldErrors.title` from the hook.
↓
UI displays red text: `<span>{fieldErrors.title}</span>` under the input.
```

---

## 3. Search and Debounce Flow (`useSearch.js` & `useDebounceFilters.js`)

### Typing execution path

```text
User types "P" in Search Bar
↓
`onChange(e.target.value)` fires
↓
`setSearchTerm('P')` updates local state
↓
Component Re-renders (Input value shows 'P')
↓
`useDebounce` (or `setTimeout` in hook) starts a 500ms timer
↓
User types "L" (timer resets)
↓
User types "A" (timer resets)
↓
User stops typing for 500ms
↓
Debounce timer completes
↓
Hook calls `tableState.handleFilterChange({ search: 'PLA' })`
↓
`useTableState` sets `filters.search = 'PLA'` and `currentPage = 1`
↓
Component Re-renders
↓
useEffect fires because `tableState.filters` changed.
↓
API is called with `?search=PLA&page=1`
```

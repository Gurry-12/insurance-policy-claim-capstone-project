# Custom Hooks
> Encapsulated, reusable logic for data fetching, forms, and UI state.

---

## Purpose
This document explains the custom React hooks created for the InsuranceFlow frontend. These hooks abstract away complex logic, making components cleaner and easier to test.

---

## Overview
- Hooks are located in `src/hooks/`.
- Provide generic solutions for pagination, API data fetching, form handling, and theme toggling.
- Abstract the interaction with `axiosInstance` and React Context.

---

## Hooks Table

| Hook | Purpose | Parameters | Returns |
|------|---------|------------|---------|
| `useApiTable` | Server-side paginated, filtered, and sorted data fetching. | `apiCall` (function), `initialParams` | `{ data, loading, error, pagination, setParams }` |
| `useApiForm` | Form state management, submission handling, and validation. | `initialValues`, `onSubmit` | `{ values, handleChange, handleSubmit, loading, error }` |
| `useClientPagination` | Pagination logic for data already fully loaded in memory. | `data` (array), `itemsPerPage` | `{ currentData, currentPage, totalPages, goToPage }` |
| `useAuth` | Wrapper to access AuthContext. | None | `{ user, role, login, logout, ... }` |
| `useTheme` | Wrapper to access ThemeContext. | None | `{ theme, toggleTheme }` |
| `useExportPdf` | Handles generating and downloading PDFs via jsPDF. | `elementId`, `filename` | `{ exportPdf, isExporting }` |

---

## Hook Details

### `useApiTable`
Used for lists where data is too large to load all at once (e.g., Admin User List).
- Manages state for `page`, `size`, `sortBy`, and `search`.
- Triggers the provided `apiCall` whenever params change.
- Handles loading and error states automatically.

### `useApiForm`
A lightweight alternative to `react-hook-form` for simpler forms.
- Manages `values` state.
- Wraps the `onSubmit` function with a `try/catch`, managing a `loading` boolean to disable the submit button and capturing API errors to display.

### `useClientPagination`
Used when an API returns a full array (e.g., a customer's specific policies) but we still want to paginate the UI.
- Slices the input array based on `currentPage` and `itemsPerPage`.

### `useExportPdf`
Integrates with `jsPDF` and `html2canvas`.
- Takes a DOM element ID, renders it to a canvas, converts it to an image, and saves it as a PDF. Used for Policy Certificates and Claim Reports.

---

## Design Decisions

| Decision | Reason | Trade-offs |
|----------|--------|------------|
| **Custom hooks over HOCs (Higher Order Components)** | Standard modern React practice. Easier to read, avoids wrapper hell, better TypeScript support (if used). | None. |
| **`useApiTable` vs `useClientPagination`** | Server-side pagination (`useApiTable`) is required for massive datasets (users). Client-side is faster and simpler for small, scoped datasets (a single user's claims). | Requires two different table abstractions. |
| **`useApiForm` vs `react-hook-form`** | For simple forms, `useApiForm` is sufficient. (Note: the project may use `react-hook-form` for complex forms; this hook is for standardized API submission wrappers). | Lacks advanced validation features of dedicated libraries. |

---

## Interview Notes

1. **Why extract logic into custom hooks?**
   To reuse stateful logic across multiple components, adhering to DRY (Don't Repeat Yourself), and keeping component files focused purely on rendering.
2. **When would you use `useClientPagination` vs `useApiTable`?**
   Use `useApiTable` when dealing with thousands of records where downloading them all is too slow. Use `useClientPagination` when the dataset is small (e.g., 50 items) and already fetched.
3. **How does `useAuth` work?**
   It's simply `return useContext(AuthContext)`. It saves importing `useContext` and `AuthContext` in every file.
4. **How do you handle API loading states in a component?**
   Instead of manually setting `setLoading(true/false)`, the `useApiForm` or `useApiTable` hook manages it and returns a `loading` boolean that the component uses to disable buttons or show spinners.

---

## Related Documents
- [Component Architecture](Component_Architecture.md)
- [API Integration](API_Integration.md)

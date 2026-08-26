# React Hooks

## What It Is
React hooks are functions that let functional components manage state,
run side effects, and reuse stateful logic without class components. The
frontend runs React 19 and keeps reusable logic in `src/hooks/` as custom
hooks built on the built-ins (`useState`, `useEffect`, `useMemo`,
`useCallback`, `useRef`, `useContext`).

## Why It Is Used
- Encapsulates repeated behavior (data fetching, pagination, filtering,
  PDF export) in one testable unit instead of duplicating it per page.
- Keeps components declarative: a page calls a hook and renders its
  return values.
- Standardizes API patterns so list and form pages behave identically.

## Where It Is Used in This Project
Verified against `insurance-policy-claim-management-app-ui/src/`:
- Table and fetch state: `useApiTable.js` (data/loading/error,
  pagination, sort, filter, refresh) and `useTableState.js` (pagination +
  sort + filters + `getQueryParams`), used by admin/staff list pages such
  as `UserListPage.jsx`, `ProductListPage.jsx`, `PlanListPage.jsx`,
  `PolicyListPage.jsx`, `ClaimListPage.jsx`, `PaymentListPage.jsx`.
- `useDebounceFilters.js` (500 ms debounce before refetch), used
  alongside `useTableState` on the same list pages.
- Pagination: `usePagination.js` (pageNumber/pageSize/sortDirection
  params) and `useClientPagination.js` (in-memory slicing), used on
  `CustomerClaimListPage.jsx`, `CustomerPaymentHistoryPage.jsx`, and
  `CustomerProductListPage.jsx`.
- Forms: `useApiForm.js` (submit wrapper with loading and field errors);
  react-hook-form is used directly in auth forms, e.g. `useForm` in
  `src/pages/auth/Login.jsx`.
- Auth/theme consumers: `useAuth.js` and `useTheme.js` (see Context API
  card).
- PDF export: `PdfDownload/usePolicyPdf.js`, `useClaimPdf.js`,
  `useCustomerPdf.js`, `usePaymentPdf.js` (jsPDF + autotable), used on
  policy/claim detail pages (admin, staff, and customer roles).
- Utility: `useSearch.js` (in-memory search across fields) and
  `useDocumentTitle.js` (sets `document.title` in
  `src/pages/admin/claims/ClaimListPage.jsx`).

## Related Files
- `insurance-policy-claim-management-app-ui/src/hooks/`
- `insurance-policy-claim-management-app-ui/src/context/AuthContext.jsx`
- `insurance-policy-claim-management-app-ui/src/context/ThemeContext.jsx`

## Related Docs
- ../05_Frontend/Custom_Hooks.md
- ../05_Frontend/State_Management.md
- ../05_Frontend/API_Integration.md
- ../07_Design_Patterns/Strategy.md

## Common Interview Questions
1. What is the difference between `useState` and `useRef`?
   `useState` re-renders; `useRef` holds a mutable value that persists
   across renders without triggering one.
2. Why build custom hooks instead of duplicating logic?
   Reuse and consistency: pagination, filtering, and PDF generation are
   shared across pages, so one hook keeps behavior identical.
3. When does `useEffect` run in this project?
   After render, when dependencies change; `useApiTable` refetches on
   `fetchData` identity change and `useDebounceFilters` resets a timeout per filter change.
4. How do you avoid stale closures in `useCallback`?
   List every referenced value in the dependency array, as in
   `useApiTable.fetchData` (`[fetchFunction, params]`).
5. What does `useDocumentTitle` restore?
   The previous page title on unmount, unless `retainOnUnmount` is true.
6. Where does react-hook-form sit relative to custom hooks?
   It is a third-party form-state library; `useApiForm` wraps submission and server field-error handling.

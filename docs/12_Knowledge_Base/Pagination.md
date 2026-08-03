# Pagination

## What It Is
Pagination splits large result sets into pages so the UI and API move
bounded payloads. The backend returns a `PageResponseDTO<T>` wrapper;
the frontend renders one page at a time and fetches the next on demand
(server-side) or slices an already-loaded array (client-side).

## Why It Is Used
- Keeps API payloads and render work bounded for the large tables in
  this system (users, customers, products, plans, policies, claims,
  payments).
- Enables server-side sorting and filtering alongside paging.
- A consistent envelope (`PageResponseDTO`) lets the frontend adapter
  parse every paginated response the same way.

## Where It Is Used in This Project
Verified against the backend and frontend source:
- Backend envelope: `PageResponseDTO<T>` (fields `content`,
  `pageNumber`, `pageSize`, `totalRecords`, `totalPages`, `lastPage`,
  `sortingType`) in `dto/response/PageResponseDTO.java`.
- Backend convention: controllers accept
  `@RequestParam(defaultValue = "0") int pageNumber` and
  `@RequestParam(defaultValue = "10") int pageSize` plus
  `sortBy`/`sortDirection` (`UserController`, `CustomerController`,
  `InsuranceProductController`, `PolicyPlanController`, `PolicyController`,
  `ClaimController`, `PremiumPaymentController`, `PricingRuleController`).
  Services build a Spring `PageRequest` and map the repository `Page<T>`
  into `PageResponseDTO` (see `ClaimServiceImpl.java`, `UserServiceImpl.java`,
  and the other `*ServiceImpl` classes).
- Frontend adapter: `src/api/apiAdapter.js` detects the paginated shape
  (`content` + `pageNumber`) and exposes `data`, `pagination`, and
  `totalRecords`/`totalPages`.
- Frontend hooks: `usePagination.js` (pageNumber/pageSize/sortDirection
  params); `useTableState.js` (pagination + sort + filters into
  `getQueryParams`, used by `src/pages/admin/users/UserListPage.jsx`);
  `useApiTable.js` (server-table state with `page`/`size`);
  `useClientPagination.js` (in-memory slicing on
  `src/pages/customer/claims/CustomerClaimListPage.jsx`).

## Related Files
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/dto/response/PageResponseDTO.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/controller/*Controller.java`
- `insurance-policy-claim-management-system/src/main/java/com/insurance/demo/serviceimpl/*ServiceImpl.java`
- `insurance-policy-claim-management-app-ui/src/hooks/usePagination.js`
- `insurance-policy-claim-management-app-ui/src/hooks/useClientPagination.js`
- `insurance-policy-claim-management-app-ui/src/hooks/useTableState.js`
- `insurance-policy-claim-management-app-ui/src/hooks/useApiTable.js`
- `insurance-policy-claim-management-app-ui/src/api/apiAdapter.js`

## Related Docs
- ../05_Frontend/API_Integration.md
- ../05_Frontend/Custom_Hooks.md
- ../03_API/*.md
- ../07_Design_Patterns/Factory_Pattern.md

## Common Interview Questions
1. Why is server-side pagination preferred for large tables?
   Only one page of rows crosses the network and is rendered.
2. What is the page-parameter convention in this project?
   `pageNumber=0` and `pageSize=10` defaults plus `sortBy`/`sortDirection`; page numbers are zero-based.
3. What does `PageResponseDTO` contain?
   `content`, `pageNumber`, `pageSize`, `totalRecords`, `totalPages`,
   `lastPage`, `sortingType`.
4. When is client-side pagination acceptable?
   For already-loaded, bounded lists such as a customer's own claims, payments, products, or plans (`useClientPagination`).
5. How does the frontend recognize a paginated response?
   `apiAdapter.js` detects `content` + `pageNumber` and unwraps.
6. What happens to sorting and filters when the page changes?
   `useTableState.handleFilterChange` resets to page 1.

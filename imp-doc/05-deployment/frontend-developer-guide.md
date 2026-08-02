# Developer Guide

> **What:** A practical guide for extending the InsureFlow frontend.  
> **Why:** New developers need a clear "where to touch" guide before adding features.  
> **How:** Recipe-style instructions for each type of change.

---

## Adding a New Page

### Step 1: Create the page component

```
src/pages/<role>/<module>/MyNewPage.jsx
```

Minimum structure:

```jsx
import PageHeader from "../../../components/common/PageHeader";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

const MyNewPage = () => {
  useDocumentTitle("My New Page - InsureFlow");

  return (
    <div>
      <PageHeader
        title="My New Page"
        subtitle="Description of what this page does"
      />
      {/* page content */}
    </div>
  );
};

export default MyNewPage;
```

### Step 2: Add the static import in App.jsx

```js
// In src/App.jsx
import MyNewPage from "./pages/admin/mymodule/MyNewPage";
```

### Step 3: Add the route in App.jsx

```jsx
// Inside the appropriate RoleProtectedRoute block:
<Route path="/admin/my-new-page" element={<MyNewPage />} />
```

### Step 4: Add navigation item (optional)

```js
// In src/components/layouts/UnifiedLayout.jsx
// Inside NAV_ITEMS_BY_ROLE[ROLES.ADMIN]:
{
  to: "/admin/my-new-page",
  icon: "bi-icon-name",
  label: "My New Page",
  section: "My Section"
}
```

**Files to modify:**

- `src/pages/<role>/<module>/MyNewPage.jsx` - **NEW**
- `src/App.jsx` - add import + route
- `src/components/layouts/UnifiedLayout.jsx` - add nav item (if needed)

---

## Adding a New API Call

### Step 1: Add the function to the appropriate service

```js
// In src/services/myService.js (or existing service)
export const getMyData = async (id) => {
  const response = await axiosInstance.get(`/my-endpoint/${id}`);
  return response;
};
```

### Step 2: Call the service from your component or hook

```jsx
// In your page component:
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetch = async () => {
    setLoading(true);
    try {
      const response = await getMyData(id);
      setData(response.data);
    } catch (err) {
      notify.error(err);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, [id]);
```

**Files to modify:**

- `src/services/<service>.js` - add the API function
- The calling page or hook

### For POST/PUT with a form, use `useApiForm`:

```jsx
const { submit, loading, fieldErrors } = useApiForm(
  myService.createSomething,
  (data) => navigate("/success-path"),
);

// On form submit:
submit(formPayload);

// Show field errors:
{
  fieldErrors.fieldName && <span>{fieldErrors.fieldName}</span>;
}
```

---

## Modifying a Form

### For controlled forms (most forms):

1. Add the new field to the `formData` state initial value
2. Add an `<input>` or `<FormInput>` bound to that state
3. Add validation logic in the `validate()` function
4. Add the field to the API payload in `handleSubmit`

```js
// 1. Add to initial state:
const [formData, setFormData] = useState({
  existingField: "",
  newField: "", // ← add
});

// 2. Add input in JSX:
<FormInput
  label="New Field"
  name="newField"
  value={formData.newField}
  onChange={handleChange}
  error={errors.newField}
/>;

// 3. Add validation:
const validate = () => {
  const errs = {};
  if (!formData.newField.trim()) errs.newField = "New field is required.";
  return errs;
};

// 4. Add to payload:
const payload = {
  ...formData,
  // newField is already included via spread
};
```

### For react-hook-form (Login page):

```jsx
<input
  {...register("newField", {
    required: "New field is required.",
    pattern: { value: /regex/, message: "Error message" },
  })}
/>;
{
  errors.newField && <div>{errors.newField.message}</div>;
}
```

**Files to modify:**

- The form page component
- The corresponding service file (if new DTO field)

---

## Adding a Table

### Step 1: Set up table state

```jsx
import useTableState from "../../../hooks/useTableState";

const tableState = useTableState({
  initialSortBy: "createdDate",
  initialSortDirection: "desc",
  initialFilters: { status: "" },
});
```

### Step 2: Fetch data with useEffect

```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetch = async () => {
    tableState.setIsLoading(true);
    try {
      const params = tableState.getQueryParams();
      const response = await myService.getAllPaginated(params);
      setData(response.data || []);
      tableState.setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      notify.error(err);
    } finally {
      tableState.setIsLoading(false);
    }
  };
  fetch();
}, [
  tableState.currentPage,
  tableState.sortBy,
  tableState.sortDirection,
  tableState.filters,
]);
```

### Step 3: Define columns

```js
const columns = [
  {
    header: "Sr. No.",
    cell: (_, index) => tableState.getSrNo(index),
  },
  {
    header: "Name",
    accessor: "name",
    minWidth: "150px",
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Actions",
    cell: (row) => (
      <button onClick={() => navigate(`/path/${row.id}`)}>View</button>
    ),
  },
];
```

### Step 4: Render DataTable + PaginationBar

```jsx
<DataTable
  columns={columns}
  data={data}
  loading={tableState.isLoading}
  onRowClick={(row) => navigate(`/path/${row.id}`)}
  emptyMessage="No records found"
/>

<PaginationBar
  currentPage={tableState.currentPage}
  totalPages={tableState.totalPages}
  onPageChange={tableState.setCurrentPage}
/>
```

---

## Adding a Dashboard Card

```jsx
// In AdminDashboard.jsx or CustomerDashboard.jsx:
<DashboardCard
  title="New Metric"
  value={stats.newMetric}
  icon="bi-icon-name"
  color="var(--ip-brand)"
/>
```

Add the data fetch to `dashboardService.js`:

```js
// In getAdminStats():
const newMetric = await getNewMetricCount().catch(() => 0);
return { ...existing, newMetric };
```

---

## Adding a Module (New Feature Area)

A "module" is a new domain area (e.g., Reports, Documents, Notifications).

**Files to create/modify:**

```
src/
├── services/reportService.js           ← NEW: API functions
├── pages/admin/reports/
│   ├── ReportListPage.jsx              ← NEW: List page
│   └── ReportDetailPage.jsx            ← NEW: Detail page
```

**Files to modify:**

```
src/App.jsx                             ← Add static imports + routes
src/components/layouts/UnifiedLayout.jsx ← Add nav items
```

---

## Changing Validation

### Frontend Validation (form-side)

Location: The form page component's `validate()` function or `react-hook-form` `register()` rules.

```js
// To change a validation rule:
if (!/^new-regex/.test(formData.field)) {
  errs.field = "New error message";
}
```

**Available shared validators** in `src/utils/validators.js`:

```js
isRequired(value, fieldName);
isEmail(value);
isMinLength(value, min);
isMaxLength(value, max);
isPhone(value);
validateField(value, [validator1, validator2]);
```

### Backend Validation (field errors)

When the backend rejects input, `apiAdapter.parseErrorResponse()` extracts `fieldErrors` from the `ValidationErrorResponseDTO`. These are surfaced via `useApiForm.fieldErrors`.

Display them:

```jsx
{
  fieldErrors.email && <div className="text-danger">{fieldErrors.email}</div>;
}
```

---

## Changing Role Permissions

### Add a new route for an existing role

```jsx
// In App.jsx, inside the correct RoleProtectedRoute block:
<Route path="/admin/new-route" element={<NewPage />} />
```

### Change which role can access a route

Move the `<Route>` from one `RoleProtectedRoute` block to another.

### Add a new role

1. Add to `src/utils/roles.js`:

```js
export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  INTERNAL_STAFF: "ROLE_INTERNAL_STAFF",
  CUSTOMER: "ROLE_CUSTOMER",
  SUPERVISOR: "ROLE_SUPERVISOR", // ← new
};
```

2. Add nav items to `NAV_ITEMS_BY_ROLE` in `UnifiedLayout.jsx`
3. Add theme class to `THEME_CLASS_BY_ROLE` in `UnifiedLayout.jsx`
4. Add portal title to `PORTAL_TITLE_BY_ROLE` in `UnifiedLayout.jsx`
5. Add redirect case to `GuestRoute` and `DashboardRedirect` in `App.jsx`
6. Add `<RoleProtectedRoute allowedRole={ROLES.SUPERVISOR}>` block in `App.jsx`
7. Add redirect case in `RoleProtectedRoute` for the new role

---

## Adding a Status Badge Color

```jsx
// In src/components/ui/StatusBadge.jsx
// Add to the color/label map:
case 'NEW_STATUS':
  return { bg: 'purple', label: 'New Status Label' };
```

---

## Required Files Summary

| Task                  | Files to Create                        | Files to Modify                            |
| --------------------- | -------------------------------------- | ------------------------------------------ |
| New page              | `src/pages/<role>/<module>/<Page>.jsx` | `App.jsx`, `UnifiedLayout.jsx`             |
| New API function      | -                                      | `src/services/<service>.js`                |
| New service module    | `src/services/<newService>.js`         | Calling component/hook                     |
| New table             | -                                      | Page component                             |
| New form field        | -                                      | Page component, service (DTO)              |
| New nav item          | -                                      | `UnifiedLayout.jsx`                        |
| New role              | -                                      | `roles.js`, `App.jsx`, `UnifiedLayout.jsx` |
| New status color      | -                                      | `StatusBadge.jsx`                          |
| New filter option     | -                                      | `options.js`, page component               |
| New document category | -                                      | `documentCategories.js`                    |

---

## Related Documentation

- [Frontend Architecture Overview](../02-architecture/frontend-architecture-overview.md)
- [Frontend Architecture (routing, hooks)](../../docs/architecture/04-frontend-architecture.md)
- [Frontend API Contract](../01-api-contracts/frontend-api-contract.md)
- [Design System](../02-architecture/design-system.md)

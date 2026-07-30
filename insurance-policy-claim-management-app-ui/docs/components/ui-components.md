# Reusable UI Components

> **What:** The shared component library used throughout the application.  
> **Why:** Avoids code duplication and ensures a consistent design language.  
> **Where:** `src/components/tables/`, `src/components/forms/`, `src/components/ui/`, `src/components/cards/`, `src/components/modals/`

---

## Table Components

### DataTable

**File:** [`src/components/tables/DataTable.jsx`](../../src/components/tables/DataTable.jsx)

**Purpose:** Generic, accessible, scrollable data table with stale-while-revalidate data dimming and empty state support.

**Props:**

| Prop           | Type       | Default               | Description                                                    |
| -------------- | ---------- | --------------------- | -------------------------------------------------------------- |
| `columns`      | `array`    | required              | Column definitions                                             |
| `data`         | `array`    | required              | Row data                                                       |
| `loading`      | `boolean`  | `false`               | Triggers inline spinner (cold load) or 55% opacity dimming (warm load) |
| `onRowClick`   | `function` | -                     | Row click handler (makes rows focusable + keyboard accessible) |
| `emptyIcon`    | `string`   | `"bi-table"`          | Bootstrap Icons class for empty state                          |
| `emptyMessage` | `string`   | `"No data available"` | Empty state message                                            |
| `compact`      | `boolean`  | `false`               | Reduces padding and font size                                  |

**Column Definition:**

```js
const columns = [
  {
    header: "Policy Number", // Displayed in <th>
    accessor: "policyNumber", // Key to read from row object
    minWidth: "140px", // Optional min-width CSS
    cell: (
      row,
      index, // Optional custom render function
    ) => <span className="fw-bold">{row.policyNumber}</span>,
  },
];
```

**States:**

1. **Loading (Cold)** - renders an inline `<LoadingSpinner />` centered in the table body.
2. **Loading (Warm)** - keeps previous data in the DOM but dims it to 55% opacity (Stale-While-Revalidate).
3. **Empty** - renders `EmptyState` component.
4. **Data** - renders `table-hover` Bootstrap table.

**Accessibility:** Rows with `onRowClick` get `tabIndex={0}` and `onKeyDown` handler for Enter/Space keys.

---

### PaginationBar

**File:** [`src/components/tables/PaginationBar.jsx`](../../src/components/tables/PaginationBar.jsx)

**Purpose:** Smart pagination control with ellipsis for large page counts.

**Props:**

| Prop           | Type       | Description                 |
| -------------- | ---------- | --------------------------- |
| `currentPage`  | `number`   | 1-indexed current page      |
| `totalPages`   | `number`   | Total page count            |
| `onPageChange` | `function` | Called with new page number |

**Algorithm:** Shows pages 1 and last always. Shows `currentPage ± 2` range. Adds `...` when there are gaps.

**Returns null** if `totalPages <= 1` (hides pagination entirely).

---

### SortableHeader

**File:** [`src/components/tables/SortableHeader.jsx`](../../src/components/tables/SortableHeader.jsx)

**Purpose:** A table `<th>` that shows a sort direction indicator and calls `onSort` when clicked.

**Props:** `label`, `field`, `sortBy`, `sortDirection`, `onSort`

---

### TableToolbar

**File:** [`src/components/tables/TableToolbar.jsx`](../../src/components/tables/TableToolbar.jsx)

**Purpose:** Row of controls above a table (search input + action buttons).

**Props:** `search`, `onSearch`, `actions` (array of button configs)

---

## Form Components

### FormInput

**File:** [`src/components/forms/FormInput.jsx`](../../src/components/forms/FormInput.jsx)

**Purpose:** Controlled input field with label, validation error display, and special `date` type routing to `ModernDatePicker`.

**Props:**

| Prop          | Type       | Default  | Description                                           |
| ------------- | ---------- | -------- | ----------------------------------------------------- |
| `label`       | `string`   | -        | Field label                                           |
| `type`        | `string`   | `'text'` | Input type. `'date'` renders `ModernDatePicker`       |
| `name`        | `string`   | required | Input name + id                                       |
| `value`       | `any`      | -        | Controlled value                                      |
| `onChange`    | `function` | -        | Change handler                                        |
| `placeholder` | `string`   | -        | Placeholder text                                      |
| `error`       | `string`   | -        | Validation error message (shows red invalid-feedback) |
| `required`    | `boolean`  | `false`  | Shows `*` in label                                    |

**Usage:**

```jsx
<FormInput
  label="Full Name"
  name="fullName"
  value={formData.fullName}
  onChange={handleChange}
  error={errors.fullName}
  required
/>
```

---

### FormSelect

**File:** [`src/components/forms/FormSelect.jsx`](../../src/components/forms/FormSelect.jsx)

**Purpose:** Native HTML `<select>` with label and error display.

**Props:** `label`, `name`, `value`, `onChange`, `options` (array of `{value, label}`), `error`, `required`

---

### FormTextarea

**File:** [`src/components/forms/FormTextarea.jsx`](../../src/components/forms/FormTextarea.jsx)

**Purpose:** Controlled `<textarea>` with label and validation.

**Props:** `label`, `name`, `value`, `onChange`, `rows`, `placeholder`, `error`, `required`

---

### ModernDatePicker

**File:** [`src/components/forms/ModernDatePicker.jsx`](../../src/components/forms/ModernDatePicker.jsx)

**Purpose:** Styled date picker using `react-datepicker`. Handles formatting and validation.

**Props:** `label`, `name`, `selectedDate`, `onChange`, `error`, `required`, `placeholder`, `minDate`, `maxDate`

---

### ModernSelect

**File:** [`src/components/forms/ModernSelect.jsx`](../../src/components/forms/ModernSelect.jsx)

**Purpose:** Searchable select dropdown using `react-select`. Used for long option lists (e.g., customer dropdown).

**Props:** `label`, `name`, `value`, `onChange`, `options`, `placeholder`, `error`, `required`, `isDisabled`, `isClearable`

---

## UI Components

### StatusBadge

**File:** [`src/components/ui/StatusBadge.jsx`](../../src/components/ui/StatusBadge.jsx)

**Purpose:** Renders a colored Bootstrap badge for status values.

**Supported status types:** Policy statuses, Claim statuses, Payment statuses, User statuses, Product/Plan statuses.

**Usage:**

```jsx
<StatusBadge status="ACTIVE" />        // → green "Active"
<StatusBadge status="UNDER_REVIEW" />  // → yellow "Under Review"
<StatusBadge status="REJECTED" />      // → red "Rejected"
```

**Color Mapping** (defined inside the component):

| Status                    | Badge Color      |
| ------------------------- | ---------------- |
| ACTIVE                    | success (green)  |
| PENDING_PAYMENT           | warning (yellow) |
| EXPIRED                   | secondary (gray) |
| CANCELLED                 | dark             |
| SUBMITTED                 | info (blue)      |
| UNDER_REVIEW              | warning (yellow) |
| RECOMMENDED_FOR_APPROVAL  | cyan             |
| RECOMMENDED_FOR_REJECTION | orange           |
| APPROVED                  | success (green)  |
| REJECTED                  | danger (red)     |
| SUCCESS                   | success          |
| FAILED                    | danger           |
| PENDING                   | warning          |

---

### EmptyState

**File:** [`src/components/ui/EmptyState.jsx`](../../src/components/ui/EmptyState.jsx)

**Purpose:** Centered empty state UI with icon and message. Shown by `DataTable` when `data.length === 0`.

**Props:** `icon` (Bootstrap Icons class), `message` (string)

---

### ErrorAlert

**File:** [`src/components/ui/ErrorAlert.jsx`](../../src/components/ui/ErrorAlert.jsx)

**Purpose:** Displays a red Bootstrap alert with an error message. Used when a page-level data fetch fails.

**Props:** `message`, `onRetry` (optional retry button handler)

---

### LoadingButton

**File:** [`src/components/ui/LoadingButton.jsx`](../../src/components/ui/LoadingButton.jsx)

**Purpose:** Submit button that shows a spinner and disables itself during an async operation.

**Props:** `isLoading`, `loadingText`, `children` (default button label), `className`, `type`, `id`, `...rest`

**Usage:**

```jsx
<LoadingButton
  id="submit-btn"
  type="submit"
  className="btn btn-primary"
  isLoading={loading}
  loadingText="Saving..."
>
  Save Changes
</LoadingButton>
```

---

### Modal

**File:** [`src/components/ui/Modal.jsx`](../../src/components/ui/Modal.jsx)

**Purpose:** Generic modal dialog with header, body, and footer slots.

**Props:** `isOpen`, `onClose`, `title`, `children`, `footer`, `size` (`'sm' | 'md' | 'lg' | 'xl'`)

---

### FilterPanel

**File:** [`src/components/ui/FilterPanel.jsx`](../../src/components/ui/FilterPanel.jsx)

**Purpose:** Collapsible filter drawer/panel for list pages. Contains filter inputs (status dropdowns, date ranges, search fields).

**Props:** `isOpen`, `onClose`, `onApply`, `onClear`, `children` (the filter form inputs)

---

### FilterChips

**File:** [`src/components/ui/FilterChips.jsx`](../../src/components/ui/FilterChips.jsx)

**Purpose:** Displays active filters as removable chips/tags below the toolbar.

**Props:** `filters` (object), `onRemove(key)`, `labels` (friendly label map)

---

### Drawer

**File:** [`src/components/ui/Drawer.jsx`](../../src/components/ui/Drawer.jsx)

**Purpose:** Side-sliding panel (right or left) for detail views without full navigation.

**Props:** `isOpen`, `onClose`, `title`, `children`, `direction` (`'right' | 'left'`)

---

### CopyToClipboard

**File:** [`src/components/ui/CopyToClipboard.jsx`](../../src/components/ui/CopyToClipboard.jsx)

**Purpose:** Button that copies a text value to the clipboard and shows a brief "Copied!" confirmation.

**Props:** `text` (the value to copy), `label` (optional display text)

---

## Card Components

### DashboardCard

**File:** [`src/components/cards/DashboardCard.jsx`](../../src/components/cards/DashboardCard.jsx)

**Purpose:** KPI metric card for dashboards. Displays a large metric value, label, icon, and optional trend indicator.

**Props:** `title`, `value`, `icon`, `color`, `trend`, `subtitle`

**Usage:**

```jsx
<DashboardCard
  title="Total Customers"
  value={stats.totalCustomers}
  icon="bi-people"
  color="var(--ip-brand)"
/>
```

---

## Modal Components

### ConfirmModal

**File:** [`src/components/modals/ConfirmModal.jsx`](../../src/components/modals/ConfirmModal.jsx)

**Purpose:** Confirmation dialog for destructive or important actions (delete, cancel, approve, reject).

**Props:** `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`, `cancelText`, `isLoading`

---

### AlertModal

**File:** [`src/components/modals/AlertModal.jsx`](../../src/components/modals/AlertModal.jsx)

**Purpose:** Informational modal with a single dismiss button.

**Props:** `isOpen`, `onClose`, `title`, `message`, `type` (`'info' | 'warning' | 'error' | 'success'`)

---

### DocumentPreviewModal

**File:** [`src/components/modals/DocumentPreviewModal.jsx`](../../src/components/modals/DocumentPreviewModal.jsx)

**Purpose:** Opens a modal to preview uploaded claim documents (images shown inline, other files as download links).

**Props:** `isOpen`, `onClose`, `document` (ClaimDocumentResponseDTO)

---

## Common Components

### PageHeader

**File:** [`src/components/common/PageHeader.jsx`](../../src/components/common/PageHeader.jsx)

**Purpose:** Standard page header with title, optional subtitle, optional back button, and optional action slot.

**Props:** `title`, `subtitle`, `action` (React node, e.g., a button), `onBack` (`false` = hide back button, `function` = custom handler, `undefined` = default `navigate(-1)`)

**Usage:**

```jsx
<PageHeader
  title="Create Policy Plan"
  subtitle="Fill in the plan details below"
  action={<button className="btn btn-primary">Save Plan</button>}
/>
```

---

### ExportButton

**File:** [`src/components/common/ExportButton.jsx`](../../src/components/common/ExportButton.jsx)

**Purpose:** Exports table data to CSV. Can export all records by calling a `fetchAll` function (not just the current page).

**Props:** `data` (current page rows), `fetchAll` (async function returning all rows), `columns`, `filename`, `label`

**Column format for export:**

```js
const columns = [
  { header: "Policy Number", accessor: "policyNumber" },
  {
    header: "Status",
    exportValue: (row) => row.policyStatus.replace(/_/g, " "),
  },
];
```

---

### GlobalToaster

**File:** [`src/components/common/GlobalToaster.jsx`](../../src/components/common/GlobalToaster.jsx)

**Purpose:** Renders the `react-hot-toast` `<Toaster />` with custom configuration (position, style, max toasts).

This is placed once in `App.jsx` and handles all toasts globally.

---

### GlobalApiHandler

**File:** [`src/components/common/GlobalApiHandler.jsx`](../../src/components/common/GlobalApiHandler.jsx)

**Purpose:** Listens to DOM custom events fired by `axiosInstance` and handles app-level responses (401 → logout, 403 → unauthorized page, 500 → error toast).

Returns `null` - renders nothing in the UI. It's purely a side-effect component.

---

## Related Documentation

- [Design System](../design-system/design-system.md)
- [Layout Components](./layouts.md)
- [Developer Guide](../developer-guide.md)

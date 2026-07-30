# Components and Pages

A comprehensive index of the major components and pages used in the application.

## 🧩 Components (`src/components/`)

### Authentication (`auth/`)
- `ResendOtp.jsx`: Component to handle resending OTP logic.

### Cards (`cards/`)
- `DashboardCard.jsx`: Reusable card widget for displaying dashboard statistics and summaries.

### Common (`common/`)
- `GlobalToaster.jsx`: Toast container for application-wide notifications.
- `LoadingSpinner.jsx`: Displays a spinning indicator during data fetches.
- `PageHeader.jsx`: Standardized header for page titles and actions.
- `RoleBadge.jsx`: Visual badge denoting a user's role (e.g., Admin, Agent, Customer).
- `ThemeToggle.jsx`: Switch to toggle between light and dark modes.

### Forms (`forms/`)
- `FormInput.jsx`, `FormSelect.jsx`, `FormTextarea.jsx`: Standardized, styled form inputs.
- `RichSelect.jsx`: An advanced select dropdown element.

### Layouts (`layouts/`)
- `UnifiedLayout.jsx`: Main application wrapper ensuring consistent sidebar, navbar, and content areas.

### Modals (`modals/`)
- `AlertModal.jsx`: Modal for displaying warnings or informational messages.
- `ConfirmModal.jsx`: Modal requiring user confirmation (e.g., for deletions or status changes).

### Navigation (`navigation/`)
- `Sidebar.jsx`: The side navigation menu dynamically rendering based on user role.
- `TopNavbar.jsx`: The top application bar containing user profile and theme controls.

### Tables (`tables/`)
- `DataTable.jsx`: Reusable data grid for rendering lists of records.
- `PaginationBar.jsx`: Handles pagination controls for `DataTable`.
- `SortableHeader.jsx`: Table headers with sorting functionality.

### UI Elements (`ui/`)
- `EmptyState.jsx`: Visual placeholder when no data is available.
- `ErrorAlert.jsx`: Component to display inline error messages.
- `StatusBadge.jsx`: Visual badge indicating the status of a policy or claim (e.g., Active, Pending, Rejected).

---

## 📄 Pages (`src/pages/`)

### Admin View (`admin/`)
- **Claims**: `AdminClaimHistoryPage.jsx`, `ClaimDetailPage.jsx`, `ClaimListPage.jsx`
- **Customers**: `CustomerDetailPage.jsx`, `CustomerListPage.jsx`
- **Payments**: `PaymentListPage.jsx`
- **Plans**: `CreatePlanPage.jsx`, `EditPlanPage.jsx`, `PlanDetailPage.jsx`, `PlanListPage.jsx`
- **Policies**: `IssuePolicyPage.jsx`, `PolicyDetailPage.jsx`, `PolicyListPage.jsx`
- **Products**: `CreateProductPage.jsx`, `EditProductPage.jsx`, `ProductDetailPage.jsx`, `ProductListPage.jsx`
- **Users (Agents)**: `CreateAgentPage.jsx`, `UserDetailPage.jsx`, `UserListPage.jsx`
- **Dashboard**: `AdminDashboard.jsx`

### Agent View (`agent/`)
- **Claims**: `AgentClaimDetailPage.jsx`, `AgentClaimHistory.jsx`, `AgentClaimListPage.jsx`
- **Customers**: `AgentCustomerDetailPage.jsx`, `AgentCustomerListPage.jsx`
- **Payments**: `AgentPaymentListPage.jsx`, `AgentRecordPaymentPage.jsx`
- **Policies**: `AgentIssuePolicyPage.jsx`, `AgentPolicyDetailPage.jsx`, `AgentPolicyListPage.jsx`
- **Dashboard**: `AgentDashboard.jsx`

### Customer View (`customer/`)
- **Claims**: `ClaimDetailsPage.jsx`, `ClaimStatusHistoryPage.jsx`, `CustomerClaimListPage.jsx`, `RaiseClaimPage.jsx`, `UploadDocumentsPage.jsx`
- **Payments**: `CustomerPaymentHistoryPage.jsx`, `RecordPaymentPage.jsx`
- **Plans**: `CustomerPlanListPage.jsx`
- **Policies**: `CustomerPolicyDetailPage.jsx`, `CustomerPolicyListPage.jsx`, `PurchasePolicyPage.jsx`
- **Products**: `CustomerProductListPage.jsx`
- **Profile**: `CustomerProfilePage.jsx`, `EditProfilePage.jsx`, `ProfilePage.jsx`
- **Dashboard**: `CustomerDashboard.jsx`

### Auth & Public (`auth/` & `shared/`)
- **Auth**: `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `VerifyOtp.jsx`
- **Shared**: `NotFound.jsx` (404 Page), `Unauthorized.jsx` (403 Page), `PlaceholderPage.jsx`

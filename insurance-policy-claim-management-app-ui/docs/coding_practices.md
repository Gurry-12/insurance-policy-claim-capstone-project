# Coding Practices & Architecture

This document outlines the coding practices and project structure for the Insurance Policy Claim Management App UI.

## Project Structure
The project follows a scalable, feature-based organization strategy.

- **`src/components/`**: Reusable UI elements, grouped by functionality:
  - `auth/`: Authentication related components (e.g., `ResendOtp`).
  - `cards/`: Card layouts (`DashboardCard`).
  - `common/`: Global shared components (`GlobalToaster`, `PageHeader`, `ThemeToggle`).
  - `forms/`: Form elements (`FormInput`, `FormSelect`, `FormTextarea`, `RichSelect`).
  - `layouts/`: Layout wrappers (`UnifiedLayout.jsx` for consistent page structures).
  - `modals/`: Popup dialogs (`AlertModal`, `ConfirmModal`).
  - `navigation/`: Navbars and sidebars (`Sidebar`, `TopNavbar`).
  - `tables/`: Table components (`DataTable`, `PaginationBar`, `SortableHeader`).
  - `ui/`: Generic UI components (`EmptyState`, `ErrorAlert`, `StatusBadge`).

- **`src/pages/`**: View components corresponding to specific application routes, further grouped by user role:
  - `admin/`: Admin-specific pages for managing claims, customers, plans, policies, products, and users.
  - `agent/`: Agent-specific pages for managing their operations.
  - `customer/`: Customer-specific pages for managing their profile, claims, payments, policies, and products.
  - `auth/`: Authentication flow pages (Login, Register, ForgotPassword, VerifyOtp).
  - `shared/`: Shared pages across all roles (`NotFound`, `PlaceholderPage`, `Unauthorized`).

- **`src/api/` & `src/services/`**: Abstraction layers for making HTTP requests (using Axios). Keeps components clean from direct API logic.
- **`src/context/`**: React Context providers for global state management (e.g., Auth, Theme).
- **`src/hooks/`**: Custom React hooks for encapsulating complex state logic.
- **`src/utils/`**: Helper functions and shared utilities.

## Coding Standards
1. **Functional Components**: All components are written as functional components using React Hooks (`useState`, `useEffect`, etc.).
2. **Prop Types & Linting**: ESLint is actively configured. Props should be validated, and components should remain modular.
3. **Routing Configuration**: Pages are statically imported and managed via React Router in `App.jsx` based on the user's role extracted via `jwt-decode`.
4. **API Abstraction**: Axios calls are placed outside the components (in `services/` or `api/`), utilizing try-catch blocks and returning standardized responses or throwing errors handled by the UI.
5. **UI Consistency**: Reusable UI elements like `FormInput` and `DataTable` should be used instead of building elements from scratch in pages. Modals and alerts are preferred for non-blocking feedback.
6. **Error Handling**: `GlobalToaster` (powered by `react-hot-toast`) and `ErrorAlert` are used extensively to provide immediate feedback on API success/failures.

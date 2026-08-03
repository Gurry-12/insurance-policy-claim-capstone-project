import { Navigate, Outlet, Routes, Route, useLocation } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import { ROLES } from "./utils/roles";

import MainLayout from "./components/layouts/UnifiedLayout";
import GlobalToaster from "./components/common/GlobalToaster";
import GlobalApiHandler from "./components/common/GlobalApiHandler";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/shared/NotFound";
import Unauthorized from "./pages/shared/Unauthorized";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserListPage from "./pages/admin/users/UserListPage";
import CreateStaffPage from "./pages/admin/users/CreateStaffPage";
import UserDetailPage from "./pages/admin/users/UserDetailPage";
import CustomerListPage from "./pages/admin/customers/CustomerListPage";
import CustomerDetailPage from "./pages/admin/customers/CustomerDetailPage";
import ProductListPage from "./pages/admin/products/ProductListPage";
import CreateProductPage from "./pages/admin/products/CreateProductPage";
import EditProductPage from "./pages/admin/products/EditProductPage";
import ProductDetailPage from "./pages/admin/products/ProductDetailPage";
import PlanListPage from "./pages/admin/plans/PlanListPage";
import CreatePlanPage from "./pages/admin/plans/CreatePlanPage";
import EditPlanPage from "./pages/admin/plans/EditPlanPage";
import PlanDetailPage from "./pages/admin/plans/PlanDetailPage";
import PolicyListPage from "./pages/admin/policies/PolicyListPage";
import PolicyDetailPage from "./pages/admin/policies/PolicyDetailPage";
import IssuePolicyPage from "./pages/admin/policies/IssuePolicyPage";
import ClaimListPage from "./pages/admin/claims/ClaimListPage";
import ClaimDetailPage from "./pages/admin/claims/ClaimDetailPage";
import PaymentListPage from "./pages/admin/payments/PaymentListPage";

import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffCustomerListPage from "./pages/staff/customers/StaffCustomerListPage";
import StaffCustomerDetailPage from "./pages/staff/customers/StaffCustomerDetailPage";
import StaffPolicyListPage from "./pages/staff/policies/StaffPolicyListPage";
import StaffPolicyDetailPage from "./pages/staff/policies/StaffPolicyDetailPage";
import StaffIssuePolicyPage from "./pages/staff/policies/StaffIssuePolicyPage";
import StaffClaimListPage from "./pages/staff/claims/StaffClaimListPage";
import StaffClaimDetailPage from "./pages/staff/claims/StaffClaimDetailPage";
import StaffPaymentListPage from "./pages/staff/payments/StaffPaymentListPage";
import StaffRecordPaymentPage from "./pages/staff/payments/StaffRecordPaymentPage";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ProfilePage from "./pages/customer/profile/ProfilePage";
import EditProfilePage from "./pages/customer/profile/EditProfilePage";
import CustomerProductListPage from "./pages/customer/products/CustomerProductListPage";
import CustomerPlanListPage from "./pages/customer/plans/CustomerPlanListPage";
import PurchasePolicyPage from "./pages/customer/policies/PurchasePolicyPage";
import CustomerPolicyListPage from "./pages/customer/policies/CustomerPolicyListPage";
import CustomerPolicyDetailPage from "./pages/customer/policies/CustomerPolicyDetailPage";
import CustomerPaymentHistoryPage from "./pages/customer/payments/CustomerPaymentHistoryPage";
import RecordPaymentPage from "./pages/customer/payments/RecordPaymentPage";
import CustomerClaimListPage from "./pages/customer/claims/CustomerClaimListPage";
import RaiseClaimPage from "./pages/customer/claims/RaiseClaimPage";
import ClaimDetailsPage from "./pages/customer/claims/ClaimDetailsPage";
import UploadDocumentsPage from "./pages/customer/claims/UploadDocumentsPage";

const AuthLoading = () => (
  <div className="d-flex align-items-center justify-content-center vh-100">
    <div className="spinner-border text-primary" role="status" aria-label="Restoring session" />
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();
  if (isRestoring) {
    return <AuthLoading />;
  }
  if (!isAuthenticated) {
    const isLoggingOut = localStorage.getItem("isLoggingOut");
    if (isLoggingOut) {
      localStorage.removeItem("isLoggingOut");
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

const GuestRoute = () => {
  const { isAuthenticated, user, isRestoring } = useAuth();
  if (isRestoring) {
    return <AuthLoading />;
  }
  if (isAuthenticated && user) {
    if (user.role === ROLES.ADMIN)
      return <Navigate to="/admin/dashboard" replace />;
    if (user.role === ROLES.INTERNAL_STAFF)
      return <Navigate to="/staff/dashboard" replace />;
    if (user.role === ROLES.CUSTOMER)
      return <Navigate to="/customer/dashboard" replace />;
  }
  return <Outlet />;
};

const RoleProtectedRoute = ({ allowedRole }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== allowedRole) {
    if (user?.role === "ADMIN")
      return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === "INTERNAL_STAFF")
      return <Navigate to="/staff/dashboard" replace />;
    if (user?.role === "CUSTOMER")
      return <Navigate to="/customer/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === ROLES.ADMIN)
    return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === ROLES.INTERNAL_STAFF)
    return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
};

const App = () => (
  <>
    <GlobalApiHandler />
    <GlobalToaster />
    <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <MainLayout>
                <Outlet />
              </MainLayout>
            }
          >
            <Route path="/dashboard" element={<DashboardRedirect />} />

            <Route element={<RoleProtectedRoute allowedRole={ROLES.ADMIN} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserListPage />} />
              <Route path="/admin/users/create" element={<CreateStaffPage />} />
              <Route path="/admin/users/:id" element={<UserDetailPage />} />
              <Route path="/admin/customers" element={<CustomerListPage />} />
              <Route
                path="/admin/customers/:id"
                element={<CustomerDetailPage />}
              />
              <Route path="/admin/products" element={<ProductListPage />} />
              <Route
                path="/admin/products/create"
                element={<CreateProductPage />}
              />
              <Route
                path="/admin/products/edit/:id"
                element={<EditProductPage />}
              />
              <Route
                path="/admin/products/:id"
                element={<ProductDetailPage />}
              />
              <Route path="/admin/plans" element={<PlanListPage />} />
              <Route path="/admin/plans/create" element={<CreatePlanPage />} />
              <Route path="/admin/plans/edit/:id" element={<EditPlanPage />} />
              <Route path="/admin/plans/:id" element={<PlanDetailPage />} />
              <Route path="/admin/policies" element={<PolicyListPage />} />
              <Route
                path="/admin/policies/:id"
                element={<PolicyDetailPage />}
              />
              <Route
                path="/admin/policies/issue"
                element={<IssuePolicyPage />}
              />
              <Route path="/admin/claims" element={<ClaimListPage />} />
              <Route path="/admin/claims/:id" element={<ClaimDetailPage />} />
              <Route path="/admin/payments" element={<PaymentListPage />} />
            </Route>

            <Route
              element={
                <RoleProtectedRoute allowedRole={ROLES.INTERNAL_STAFF} />
              }
            >
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route
                path="/staff/customers"
                element={<StaffCustomerListPage />}
              />
              <Route
                path="/staff/customers/:id"
                element={<StaffCustomerDetailPage />}
              />
              <Route path="/staff/profile" element={<ProfilePage />} />
              <Route path="/staff/profile/edit" element={<EditProfilePage />} />
              <Route path="/staff/policies" element={<StaffPolicyListPage />} />
              <Route
                path="/staff/policies/:policyId"
                element={<StaffPolicyDetailPage />}
              />
              <Route path="/staff/claims" element={<StaffClaimListPage />} />
              <Route
                path="/staff/claims/:id"
                element={<StaffClaimDetailPage />}
              />
              <Route
                path="/staff/issue-policy"
                element={<StaffIssuePolicyPage />}
              />
              <Route
                path="/staff/payments"
                element={<StaffPaymentListPage />}
              />
              <Route
                path="/staff/payments/pay/:policyId"
                element={<StaffRecordPaymentPage />}
              />
            </Route>

            <Route
              element={<RoleProtectedRoute allowedRole={ROLES.CUSTOMER} />}
            >
              <Route
                path="/customer/dashboard"
                element={<CustomerDashboard />}
              />
              <Route path="/customer/profile" element={<ProfilePage />} />
              <Route
                path="/customer/profile/edit"
                element={<EditProfilePage />}
              />
              <Route
                path="/customer/products"
                element={<CustomerProductListPage />}
              />
              <Route
                path="/customer/products/:productId/plans"
                element={<CustomerPlanListPage />}
              />
              <Route
                path="/customer/plans"
                element={<CustomerPlanListPage />}
              />
              <Route
                path="/customer/purchase-policy/:planId"
                element={<PurchasePolicyPage />}
              />
              <Route
                path="/customer/policies"
                element={<CustomerPolicyListPage />}
              />
              <Route
                path="/customer/policies/:policyId"
                element={<CustomerPolicyDetailPage />}
              />
              <Route
                path="/customer/payments"
                element={<CustomerPaymentHistoryPage />}
              />
              <Route
                path="/customer/payments/pay/:policyId"
                element={<RecordPaymentPage />}
              />
              <Route
                path="/customer/claims"
                element={<CustomerClaimListPage />}
              />
              <Route
                path="/customer/claims/raise"
                element={<RaiseClaimPage />}
              />
              <Route
                path="/customer/claims/upload/:claimId"
                element={<UploadDocumentsPage />}
              />
              <Route
                path="/customer/claims/:claimId"
                element={<ClaimDetailsPage />}
              />
            </Route>
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
  </>
);

export default App;

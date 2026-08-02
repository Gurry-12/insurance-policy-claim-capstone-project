import { useState } from "react";
import { useOutlet } from "react-router-dom";
import Sidebar from "../navigation/Sidebar";
import TopNavbar from "../navigation/TopNavbar";
import useAuth from "../../hooks/useAuth";
import { ROLES } from "../../utils/roles";
// Page transition removed for instant navigation

// Define navigation items dynamically per role
const NAV_ITEMS_BY_ROLE = {
  [ROLES.ADMIN]: [
    {
      to: "/admin/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      end: true,
      section: null,
    },
    {
      to: "/admin/users",
      icon: "bi-people",
      label: "Users",
      section: "Management",
    },
    {
      to: "/admin/customers",
      icon: "bi-person-badge",
      label: "Customers",
      section: null,
    },
    {
      to: "/admin/products",
      icon: "bi-box-seam",
      label: "Products",
      section: "Catalog",
    },
    { to: "/admin/plans", icon: "bi-layers", label: "Plans", section: null },
    {
      to: "/admin/policies",
      icon: "bi-file-earmark-text",
      label: "Policies",
      section: "Operations",
    },
    {
      to: "/admin/claims",
      icon: "bi-shield-exclamation",
      label: "Claims",
      section: null,
    },
    {
      to: "/admin/payments",
      icon: "bi-credit-card",
      label: "Payments",
      section: null,
    },
    ],
  [ROLES.INTERNAL_STAFF]: [
    {
      to: "/staff/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      end: true,
      section: null,
    },
    {
      to: "/staff/customers",
      icon: "bi-people",
      label: "Customers",
      section: "Manage",
    },
    {
      to: "/staff/policies",
      icon: "bi-file-earmark-text",
      label: "Policies",
      section: null,
    },
    {
      to: "/staff/claims",
      icon: "bi-shield-exclamation",
      label: "Claims",
      section: null,
    },
    {
      to: "/staff/payments",
      icon: "bi-credit-card",
      label: "Payments",
      section: null,
    },
    {
      to: "/staff/issue-policy",
      icon: "bi-file-earmark-plus",
      label: "Issue Policy",
      section: "Actions",
    },
  ],
  [ROLES.CUSTOMER]: [
    {
      to: "/customer/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      end: true,
      section: null,
    },
    {
      to: "/customer/profile",
      icon: "bi-person-circle",
      label: "My Profile",
      section: "Account",
    },
    {
      to: "/customer/products",
      icon: "bi-box-seam",
      label: "Insurance Products",
      section: "Explore",
    },
    {
      to: "/customer/policies",
      icon: "bi-file-earmark-text",
      label: "My Policies",
      section: null,
    },
    {
      to: "/customer/payments",
      icon: "bi-credit-card",
      label: "Payment History",
      section: null,
    },
    {
      to: "/customer/claims",
      icon: "bi-shield-exclamation",
      label: "My Claims",
      section: null,
    },
  ],
};

const THEME_CLASS_BY_ROLE = {
  [ROLES.ADMIN]: "theme-admin",
  [ROLES.INTERNAL_STAFF]: "theme-staff",
  [ROLES.CUSTOMER]: "theme-customer",
};

const PORTAL_TITLE_BY_ROLE = {
  [ROLES.ADMIN]: "Admin Panel",
  [ROLES.INTERNAL_STAFF]: "Staff Console",
  [ROLES.CUSTOMER]: "Customer Portal",
};

const MainLayout = () => {
  const { user } = useAuth();
  const currentOutlet = useOutlet();
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // For desktop

  const userRole = user?.role || ROLES.CUSTOMER;
  const navItems = NAV_ITEMS_BY_ROLE[userRole] || [];
  const themeClass = THEME_CLASS_BY_ROLE[userRole] || "theme-customer";
  const portalTitle = PORTAL_TITLE_BY_ROLE[userRole] || "Portal";

  // Map user role for nice visual breadcrumb
  const formattedRole = userRole.replace("ROLE_", "");
  const breadcrumb = `${formattedRole.charAt(0) + formattedRole.slice(1).toLowerCase()} Portal`;

  return (
    <div
      className={themeClass}
      style={{ minHeight: "100vh", backgroundColor: "var(--ip-bg)" }}
    >
      {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Sidebar
        navItems={navItems}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        title={portalTitle}
      />

      {/* â”€â”€ Main area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className={`ip-main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {/* Top Navbar */}
        <TopNavbar
          onMenuClick={() => setSidebarOpen((v) => !v)}
          breadcrumb={breadcrumb}
        />

        {/* Page content */}
        <main className="ip-content" style={{ padding: "1.75rem 1.5rem", position: "relative" }}>
          <>
            {currentOutlet}
          </>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

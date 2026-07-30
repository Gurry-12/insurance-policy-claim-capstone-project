# Layout Components

> **What:** The shell components that wrap all authenticated pages.  
> **Why:** Provides the unified navigation, sidebar, topbar, and page transition system. Every protected page inherits this shell automatically via the route tree.  
> **Where:** `src/components/layouts/`, `src/components/navigation/`

---

## UnifiedLayout.jsx

**File:** [`src/components/layouts/UnifiedLayout.jsx`](../../src/components/layouts/UnifiedLayout.jsx)

### Purpose

The single layout shell used by all authenticated pages (admin, staff, customer). It:

- Reads the user's role
- Selects the correct navigation items from `NAV_ITEMS_BY_ROLE`
- Applies the correct CSS theme class
- Renders Sidebar + TopNavbar + page content (via `<Outlet />`)

### Props

None. Reads state from `useAuth()` and `useLocation()`.

### State

| State              | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `sidebarOpen`      | Mobile overlay sidebar open/close          |
| `sidebarCollapsed` | Desktop collapsed sidebar (icon-only mode) |

### NAV_ITEMS_BY_ROLE

Defines which navigation items appear in the sidebar for each role:

```js
const NAV_ITEMS_BY_ROLE = {
  [ROLES.ADMIN]: [
    { to: "/admin/dashboard", icon: "bi-speedometer2", label: "Dashboard", end: true, section: null },
    { to: "/admin/users", icon: "bi-people", label: "Users", section: "Management" },
    { to: "/admin/customers", icon: "bi-person-badge", label: "Customers", section: null },
    { to: "/admin/products", icon: "bi-box-seam", label: "Products", section: "Catalog" },
    { to: "/admin/plans", icon: "bi-layers", label: "Plans", section: null },
    { to: "/admin/policies", icon: "bi-file-earmark-text", label: "Policies", section: "Operations" },
    { to: "/admin/claims", icon: "bi-shield-exclamation", label: "Claims", section: null },
    { to: "/admin/payments", icon: "bi-credit-card", label: "Payments", section: null },
  ],
  [ROLES.INTERNAL_STAFF]: [ ... ],
  [ROLES.CUSTOMER]: [ ... ]
};
```

**Adding a new nav item:**

1. Add an entry to the appropriate role array
2. Specify `to` (route), `icon` (Bootstrap Icons class), `label`, and optionally `section`

### THEME_CLASS_BY_ROLE

```js
{
  [ROLES.ADMIN]: "theme-admin",
  [ROLES.INTERNAL_STAFF]: "theme-Staff",
  [ROLES.CUSTOMER]: "theme-customer",
}
```

These CSS classes are defined in `src/index.css` and control CSS custom property values for colors.

### Render Structure

```jsx
<div className={themeClass}>
  <Sidebar navItems={navItems} isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} ... />
  <div className={`ip-main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <TopNavbar onMenuClick={...} breadcrumb={breadcrumb} />
    <main className="ip-content">
      <PageTransition key={location.pathname}>
        <Outlet />   {/* ← Current page renders here */}
      </PageTransition>
    </main>
  </div>
</div>
```

---

## Sidebar.jsx

**File:** [`src/components/navigation/Sidebar.jsx`](../../src/components/navigation/Sidebar.jsx)

### Purpose

Collapsible navigation sidebar. Shows branding, nav links grouped by section, and user info with logout button.

### Props

| Prop             | Type       | Description                                         |
| ---------------- | ---------- | --------------------------------------------------- |
| `navItems`       | `array`    | Navigation items from `NAV_ITEMS_BY_ROLE`           |
| `isOpen`         | `boolean`  | Mobile overlay open state                           |
| `setIsOpen`      | `function` | Toggle mobile overlay                               |
| `isCollapsed`    | `boolean`  | Desktop collapsed (icon-only) state                 |
| `setIsCollapsed` | `function` | Toggle collapsed state                              |
| `title`          | `string`   | Portal title ("Admin Panel", "Staff Console", etc.) |

### Collapsed Mode

When `isCollapsed = true`:

- Logo is hidden, only toggle button shows
- Nav items show icon only (no label)
- User info is hidden, only avatar shows
- Logout shows icon only

### Mobile Mode

When `isOpen = true`:

- Sidebar slides in as overlay (via CSS `mobile-open` class)
- Clicking outside (overlay div) closes it
- Each nav link click also calls `setIsOpen(false)`

### Product Speciality Filtering

```js
navItems.filter((item) => {
  if (
    user?.role === "INTERNAL_STAFF" &&
    user?.productSpeciality &&
    item.speciality
  ) {
    return (
      item.speciality === user.productSpeciality ||
      user.productSpeciality === "ALL"
    );
  }
  return true;
});
```

Nav items can have a `speciality` field. Staff members only see items matching their speciality.

### Logout

```js
const handleLogout = () => {
  logout();
  notify.success("Logged out successfully!");
  navigate("/login", { replace: true });
};
```

### Active Nav Link Styling

Uses `NavLink` from React Router with a callback for active class:

```jsx
<NavLink
  to={to}
  end={end}
  className={({ isActive }) => `ip-nav-item ${isActive ? "active" : ""}`}
>
```

---

## TopNavbar.jsx

**File:** [`src/components/navigation/TopNavbar.jsx`](../../src/components/navigation/TopNavbar.jsx)

### Purpose

Top horizontal bar with:

- Mobile menu hamburger button
- Back/Forward navigation buttons (desktop)
- Breadcrumb / portal name
- Light/Dark theme toggle
- User avatar and name

### Props

| Prop          | Type       | Description                      |
| ------------- | ---------- | -------------------------------- |
| `onMenuClick` | `function` | Opens mobile sidebar             |
| `breadcrumb`  | `string`   | Override text for the breadcrumb |

### Breadcrumb Generation

If `breadcrumb` prop is provided, it's used directly. Otherwise, it parses `location.pathname`:

```js
const pathSegments = location.pathname.split("/").filter(Boolean);
return pathSegments
  .map((segment) =>
    segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  )
  .join(" / ");
```

Example: `/admin/claims/42` → `"Admin / Claims / 42"`

### Theme Toggle

```jsx
<button onClick={toggleTheme}>
  <i className={`bi ${theme === "dark" ? "bi-sun-fill" : "bi-moon-fill"}`} />
</button>
```

---

## PageTransition.jsx

**File:** [`src/components/common/PageTransition.jsx`](../../src/components/common/PageTransition.jsx)

### Purpose

Wraps each page in a Framer Motion animation so navigation between pages has a smooth fade/slide effect.

### How it works

```jsx
<PageTransition key={location.pathname}>
  <Outlet />
</PageTransition>
```

The `key` prop changes on every navigation, triggering a re-mount and the animation.

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Routing](../routing/routing.md)
- [Design System](../design-system/design-system.md)
- [Developer Guide - Adding a Nav Item](../developer-guide.md#adding-a-nav-item)

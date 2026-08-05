# Component Architecture
> Modular, reusable React components built with Bootstrap 5.

---

## Purpose
This document outlines the organization and hierarchy of React components in the InsuranceFlow frontend, focusing on reusability, shared UI elements, and separation of concerns across different user roles.

---

## Overview
- Uses a centralized `src/components/` directory for shared components.
- Role-specific components are organized under `src/pages/` or distinct feature folders.
- Leverages Bootstrap 5.3 for rapid UI development and responsive design.
- Encourages small, single-responsibility components.

---

## Component Hierarchy Diagram
```mermaid
flowchart TD
    App[App.jsx] --> UnifiedLayout[UnifiedLayout]
    App --> PublicPages[Public Pages (Login, etc.)]
    
    UnifiedLayout --> Sidebar[Sidebar]
    UnifiedLayout --> Topbar[Topbar]
    UnifiedLayout --> Outlet[Outlet (Page Content)]
    
    Outlet --> Dashboard[Role Dashboard]
    Outlet --> FeaturePages[Feature Pages (Policies, Claims)]
    
    Dashboard --> StatTile[StatTile]
    Dashboard --> QuickAction[QuickAction]
    Dashboard --> Table[Shared Data Table]
    
    Table --> StatusBadge[StatusBadge]
    Table --> ActionMenu[Action Menu]
```

---

## Shared Components Table
These components are located in `src/components/shared/` and are used across multiple features and roles.

| Component | Purpose | Used By |
|-----------|---------|---------|
| `StatusBadge` | Renders a styled Bootstrap badge based on status (e.g., green for ACTIVE). | Dashboards, Policy Lists, Claim Lists |
| `SpecialityBadge` | Displays a formatted badge for product types (e.g., MOTOR, HEALTH). | Policy lists, Quote flows |
| `StatTile` | A card component displaying a summary metric (e.g., Total Policies). | Admin, Staff, Customer Dashboards |
| `QuickAction` | A button card used for quick navigation (e.g., "File a Claim"). | Customer Dashboard |
| `DataTable` | A generic table component supporting pagination and sorting. | All list views (Users, Policies, Claims) |
| `LoadingSpinner`| A centralized loading indicator for async operations. | Everywhere |

---

## UI Components
- **StatusBadge**: Takes a `status` string and maps it to a Bootstrap color class.
- **SpecialityBadge**: Takes a `type` string (ProductType) and applies an icon and color.
- **StatTile**: Accepts `title`, `value`, `icon`, and `color` props to render a dashboard metric card.
- **QuickAction**: Accepts `icon`, `title`, and `onClick`/`to` props for easy dashboard navigation.

---

## Role-Specific Components
Role-specific logic is generally kept at the Page level, utilizing shared components for the UI.
- **Admin**: `AdminDashboard`, `UserManagement`, `SystemSettings`.
- **Staff**: `StaffDashboard`, `ClaimReviewQueue`, `PolicyApprovals`.
- **Customer**: `CustomerDashboard`, `MyPolicies`, `FileClaimForm`, `QuoteCalculator`.

---

## Design Decisions

| Decision | Reason | Trade-offs |
|----------|--------|------------|
| **Bootstrap 5.3 over Custom CSS/Tailwind** | Faster initial development, extensive pre-built component library, familiar to many developers. | Less granular control over design compared to Tailwind; can look "bootstrappy" without customization. |
| **Shared UI Component Library** | Ensures visual consistency across the app. Reduces code duplication (e.g., only one place to change how a 'PENDING' status looks). | Requires upfront effort to design generic, reusable interfaces. |
| **Separating Pages from Components** | Pages handle routing, data fetching, and layout structure. Components handle purely UI rendering (dumb components). | Standard React pattern, makes testing UI easier. |

---

## Interview Notes

1. **Why do we separate components into `pages/` and `components/`?**
   It separates "Smart" components (Pages: data fetching, routing logic, state) from "Dumb" components (pure UI, reusable buttons, badges).
2. **How does `StatusBadge` work?**
   It takes a status prop, looks up a mapping object to find the corresponding Bootstrap color class (e.g., `ACTIVE` -> `success`), and renders a `<span className="badge bg-success">`.
3. **What is the benefit of a `StatTile` component?**
   Instead of writing HTML for a dashboard card 10 times across different dashboards, we write it once and pass the title and value as props.
4. **Why use Bootstrap instead of a utility-first framework like Tailwind?**
   For this specific project, Bootstrap provides ready-to-use structural components (modals, navbars) which speeds up development when complex custom design isn't the primary goal.

---

## Related Documents
- [Layout](Layout.md)
- [UI Workflows](UI_Workflows.md)

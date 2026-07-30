# Design System

> **What:** The visual design language of InsureFlow - colors, typography, components, spacing, and theming.  
> **Why:** A unified design system ensures visual consistency and makes it easy to maintain the look and feel.  
> **How:** CSS custom properties in `src/index.css`, Bootstrap 5 as a foundation, Bootstrap Icons for iconography.  
> **Where:** `src/index.css`, `src/components/` styles

---

## Theming Architecture

The application supports **Light** and **Dark** themes. Theme is controlled by:

1. `ThemeContext` - stores `'light'` or `'dark'` in `localStorage:ss_theme`
2. `data-theme` attribute - set on `<html>` element via `document.documentElement.setAttribute('data-theme', theme)`
3. `data-bs-theme` attribute - enables Bootstrap 5 built-in dark mode

CSS custom properties change based on `[data-theme]`:

```css
:root, [data-theme="light"] {
  --ip-bg: #f5f7fa;
  --ip-brand: #2563eb;
  --ip-text: #1e293b;
  /* ... */
}

[data-theme="dark"] {
  --ip-bg: #0f172a;
  --ip-brand: #3b82f6;
  --ip-text: #e2e8f0;
  /* ... */
}
```

---

## Role-Specific Themes

Each user role gets a distinct visual identity via CSS theme classes applied by `UnifiedLayout`:

| Role | CSS Class | Primary Color Feel |
|---|---|---|
| Admin | `theme-admin` | Deep blue / authoritative |
| Staff | `theme-Staff` | Teal / operational |
| Customer | `theme-customer` | Sky blue / friendly |

These classes can customize sidebar gradients, accent colors, and badge colors per role.

---

## CSS Custom Properties (Design Tokens)

| Token | Purpose |
|---|---|
| `--ip-bg` | Page background |
| `--ip-body-bg` | Component background |
| `--ip-brand` | Primary brand color |
| `--ip-secondary` | Secondary accent |
| `--ip-text` | Primary text |
| `--ip-text-muted` | Secondary/muted text |
| `--ip-border` | Default border color |
| `--ip-sidebar-bg` | Sidebar background |
| `--ip-sidebar-text` | Sidebar text |
| `--ip-topbar-bg` | Top navbar background |

---

## Typography

**Font:** System font stack (Bootstrap 5 default + browser defaults)  
**Weight usage:**
- `fw-bold` / `600` - headings, labels
- `fw-medium` / `500` - button text, column headers
- `fw-normal` / `400` - body text
- `fw-light` - secondary info

**Scale:**
| Usage | Class / Size |
|---|---|
| Page title | `.ip-page-title` / `1.5rem` |
| Page subtitle | `.ip-page-subtitle` / `0.95rem text-muted` |
| Table cell | `0.875rem` (14px) |
| Badge / label | `0.75rem` (12px) |
| Dashboard metric | `2rem+` |

---

## Color Palette

### Status Colors

| Status | Color |
|---|---|
| Active / Success / Approved | `#22c55e` (green) |
| Pending / Under Review | `#f59e0b` (amber) |
| Submitted | `#3b82f6` (blue) |
| Recommended Approval | `#06b6d4` (cyan) |
| Recommended Rejection | `#f97316` (orange) |
| Rejected / Failed | `#ef4444` (red) |
| Cancelled / Expired | `#6b7280` (gray) |

### Brand Colors

| Token | Value (Light) |
|---|---|
| Primary | `#2563eb` (blue-600) |
| Secondary | `#1e3a8a` (blue-900) |
| Accent | varies by role |

---

## Buttons

Built on Bootstrap 5 button system:

| Style | Class | Usage |
|---|---|---|
| Primary action | `btn btn-primary` | Create, Submit, Purchase |
| Secondary | `btn btn-outline-secondary` | Back, Cancel |
| Danger | `btn btn-danger` | Delete, Reject |
| Success | `btn btn-success` | Approve, Activate |
| Export | `btn btn-outline-primary` | CSV Export |
| Icon button | `btn btn-icon border-0` | Navigation, toggle |

**Loading state:** Wrap with `<LoadingButton isLoading={loading}>` - shows spinner + disables button.

---

## Forms

**Standard Form Field:**

```jsx
<div className="mb-3">
  <label htmlFor="fieldName" className="form-label">
    Label <span className="text-danger">*</span>
  </label>
  <input
    id="fieldName"
    className={`form-control ${error ? 'is-invalid' : ''}`}
  />
  {error && <div className="invalid-feedback">{error}</div>}
</div>
```

**Custom Classes:**
- `.pristine-input` - styled input with custom focus ring
- `.custom-field-label` - label weight + spacing style
- `.input-embedded-wrapper` - container for input with embedded button (e.g., password toggle)
- `.input-embedded-trigger` - the embedded button (eye icon)
- `.input-error-tip` - small error text below field

---

## Tables

Built on Bootstrap 5 `table table-hover`:

```jsx
<table className="table table-hover align-middle mb-0">
  <thead style={{ position: 'sticky', top: 0 }}>...</thead>
  <tbody className="animate-slide-up">...</tbody>
</table>
```

**Features:**
- Sticky header (stays visible during scroll)
- Hover row highlight
- Inline spinner (cold load) and Stale-While-Revalidate dimming (warm load)
- `animate-slide-up` class for row entry animation

---

## Cards

**Dashboard Card** (`DashboardCard`):
- Gradient background per role
- Large metric number
- Icon in top-right
- Hover elevation effect

**Product/Plan Cards:**
- Rounded corners (`border-radius: 12px`)
- Soft shadow (`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`)
- Hover scale transform (`transform: scale(1.02)`)

---

## Sidebar

**Layout classes:**
- `.ip-sidebar` - fixed-position sidebar
- `.ip-sidebar-header` - brand + collapse toggle area
- `.ip-sidebar-brand` - logo + title row
- `.ip-sidebar-logo` - logo image
- `.ip-sidebar-portal-name` - role portal name text
- `.ip-nav-section` - section divider label
- `.ip-nav-item` - individual nav link
- `.ip-nav-item.active` - active route highlight
- `.ip-sidebar-footer` - user info + logout area
- `.ip-sidebar-avatar` - initials avatar circle
- `.ip-sidebar-toggle` - collapse/expand button
- `.collapsed` modifier - icon-only mode
- `.mobile-open` modifier - mobile overlay visible
- `.ip-sidebar-overlay` - backdrop behind mobile sidebar

**Main area classes:**
- `.ip-main-wrapper` - content area next to sidebar
- `.ip-topbar` - top navigation bar
- `.ip-content` - page content area

---

## Modals

Modals use a layered approach:
- `Modal.jsx` - base modal with overlay, close button, scroll body
- `ConfirmModal.jsx` - extends Modal with Yes/No buttons
- `AlertModal.jsx` - extends Modal with single OK button
- `DocumentPreviewModal.jsx` - extends Modal for file preview

All modals animate in using CSS transition classes.

---

## Dropdowns

Two types used:

1. **Native `<select>`** - via `FormSelect` component for simple option lists
2. **React Select** - via `ModernSelect` component for searchable, long option lists (e.g., 100+ customers)

React Select uses custom styling to match the design system theme.

---

## Badges / Status Indicators

`StatusBadge` renders Bootstrap badges with semantic colors:

```jsx
<StatusBadge status="ACTIVE" />
// → <span class="badge bg-success">Active</span>
```

---

## Date Picker

`ModernDatePicker` uses `react-datepicker` with:
- Custom trigger button styled to match form inputs
- Locale format: `MM/dd/yyyy`
- `minDate` and `maxDate` props for business rule constraints

---

## Icons

Two icon libraries used:

| Library | Usage | Import |
|---|---|---|
| Bootstrap Icons | Sidebar nav, table actions, badges | `<i className="bi bi-icon-name" />` |
| Lucide React | Layout controls (collapse, logout arrows) | `import { ChevronLeft, LogOut } from 'lucide-react'` |
| React Icons | Additional icons in some pages | `import { FiSomething } from 'react-icons/fi'` |

**Common Bootstrap Icons:**

| Icon | Class |
|---|---|
| Dashboard | `bi-speedometer2` |
| Users | `bi-people` |
| Customer | `bi-person-badge` |
| Products | `bi-box-seam` |
| Plans | `bi-layers` |
| Policies | `bi-file-earmark-text` |
| Claims | `bi-shield-exclamation` |
| Payments | `bi-credit-card` |
| Download | `bi-download` |
| Edit | `bi-pencil` |
| View | `bi-eye` |
| Delete | `bi-trash` |

---

## Spacing

Bootstrap 5 spacing utilities (`m-`, `p-`, `gap-`) are used throughout.

**Common values:**
- Component padding: `1.25rem` to `1.75rem`
- Page content padding: `1.75rem 1.5rem`
- Card internal padding: `1.5rem`
- Form group margin: `mb-3`

---

## Animations

| Animation | Mechanism | Applied To |
|---|---|---|
| Page transitions | Framer Motion (`PageTransition.jsx`) | Every route change |
| Table row entry | CSS class `animate-slide-up` | `<tbody>` |
| Card hover | CSS `transform: scale(1.02), box-shadow` | Dashboard cards, plan cards |
| Sidebar collapse | CSS `transition: width 0.3s ease` | Sidebar |
| NProgress bar | `nprogress` library | Any API call start/end |
| Toast notifications | React Hot Toast | Every notify.success/error call |

---

## Adding to the Design System

### To add a new status badge color:
Edit the color map inside `src/components/ui/StatusBadge.jsx`.

### To add a new CSS token:
Add to both `:root` (light) and `[data-theme="dark"]` blocks in `src/index.css`.

### To add a new role theme:
1. Add the class to `THEME_CLASS_BY_ROLE` in `UnifiedLayout.jsx`
2. Add the CSS class with its custom properties in `index.css`

---

## Related Documentation

- [Layout Components](../components/layouts.md)
- [UI Components](../components/ui-components.md)
- [Developer Guide](../developer-guide.md)

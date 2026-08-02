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

Each user role gets a distinct accent color via CSS theme classes applied on the layout wrapper by `UnifiedLayout` (`THEME_CLASS_BY_ROLE`):

| Role | CSS Class | Brand Color | Accent Feel |
|---|---|---|---|
| Admin | `theme-admin` | `#2563eb` (blue) | Authoritative (explicit defaults) |
| Staff | `theme-staff` | `#7c3aed` (violet) | Operational |
| Customer | `theme-customer` | `#0d9488` (teal) | Friendly |

The classes are **accent-only overrides**: each `theme-*` block redefines `--ip-brand`, `--ip-brand-hover`, `--ip-brand-light`, `--ip-brand-muted`, `--ip-sidebar-accent`, and `--ip-border-focus` (plus dark-mode variants). They live under the `ROLE THEMES` section in `src/index.css`.

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

### Semantic Status Tokens

Status badges and pills are driven entirely by CSS variables (light + dark variants), so a single hue is reused across contexts for the same meaning.

| Token Group | Meaning | Example Tokens |
|---|---|---|
| `--ip-claim-*` | Claim lifecycle (`submitted`, `under-review`, `rec-approval`, `rec-rejection`, `approved`, `rejected`) | `--ip-claim-approved`, `--ip-claim-approved-bg` |
| `--ip-policy-*` | Policy lifecycle (`active`, `pending`, `expired`, `cancelled`) | `--ip-policy-expired`, `--ip-policy-expired-bg` |
| `--ip-payment-*` | Payment status (`success`, `pending`, `failed`) | `--ip-payment-failed`, `--ip-payment-failed-bg` |
| `--ip-role-*` | User role badges (`admin`, `staff`, `customer`) | `--ip-role-admin`, `--ip-role-admin-bg` |
| `--ip-{success,warning,danger,info}-border` | Shared border/bg tint for each meaning | `--ip-success-border` |
| `--ip-{success,warning,danger,info,secondary}-subtle` | Border colors consumed by badges (alias to the `*-border` tokens) | `--ip-success-subtle` |

Dark mode redefines the `-bg`/`-border`/foreground variants in the `[data-theme="dark"]` block.

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

Statuses follow a **unified palette — one hue per meaning** (mapped in `STATUS_CONFIG` inside `StatusBadge.jsx`). Both light and dark themes provide matching `-bg`, foreground, and border tokens.

| Meaning | Statuses | Hue |
|---|---|---|
| Success | Active, Approved, Success, Recommended for Approval | `#16a34a` green |
| Warning | Pending, Under Review, Pending Payment, **Expired** | `#d97706` amber |
| Info | Submitted, Assigned | `#0284c7` blue |
| Caution | Recommended for Rejection | `#ea580c` orange |
| Danger | Rejected, Cancelled, Failed | `#dc2626` red |
| Neutral | Inactive, unknown / default | slate `#64748b` |

### Brand Colors

| Token | Value (Light) |
|---|---|
| Primary | `#2563eb` (blue-600) |
| Secondary | `#1e3a8a` (blue-900) |
| Accent | varies by role theme (blue / violet / teal) |

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

**`StatusBadge`** (`src/components/ui/StatusBadge.jsx`) renders pill badges using the semantic status palette. It reads from the `STATUS_CONFIG` map — each entry defines `bg`, `color`, `border`, and an icon resolved from CSS-variable tokens (with hardcoded fallbacks). Status strings are normalized (trimmed, uppercased, spaces → underscores) and fall back to a neutral `DEFAULT` style for unknown values.

```jsx
<StatusBadge status="ACTIVE" />
// → <span> (pill) ✓ Active</span>
```

Supports statuses such as: `ACTIVE`, `APPROVED`, `SUCCESS`, `ASSIGNED`, `PENDING`, `UNDER_REVIEW`, `SUBMITTED`, `PENDING_PAYMENT`, `REJECTED`, `CANCELLED`, `EXPIRED`, `FAILED`, `INACTIVE`, `RECOMMENDED_FOR_APPROVAL`, `RECOMMENDED_FOR_REJECTION`.

**`SpecialityBadge`** (`src/components/ui/SpecialityBadge.jsx`) renders a staff specialist pill with a per-specialty icon and color. Mapped via `SPECIALITY_META`:

| Speciality | Icon | Accent |
|---|---|---|
| `HEALTH` | `bi-heart-pulse-fill` | Rose |
| `LIFE` | `bi-umbrella-fill` | Green |
| `MOTOR` | `bi-car-front-fill` | Blue |
| `TRAVEL` | `bi-airplane-fill` | Cyan |
| `INSURANCE` | `bi-shield-check-fill` | Violet |
| `ALL` / unknown | `bi-grid-fill` / `bi-star-fill` | Slate (generalist) |

```jsx
<SpecialityBadge speciality="HEALTH" />
<SpecialityBadge speciality="MOTOR" size="sm" />
```

Size variants: default, `size="sm"`, `size="lg"`. Colors come from `.ip-spec-{KEY}` classes (`--spec-color`, `--spec-bg`, `--spec-border` custom properties) with dark-mode overrides.

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
1. Add the matching tokens (foreground, `-bg`, `-border`) to both `:root` and `[data-theme="dark"]` in `src/index.css` (reuse an existing hue if the meaning overlaps).
2. Add an entry to the `STATUS_CONFIG` map in `src/components/ui/StatusBadge.jsx`.

### To add a new speciality badge:
1. Add the meta (icon + label) to `SPECIALITY_META` in `src/components/ui/SpecialityBadge.jsx`.
2. Add an `.ip-spec-{KEY}` class with `--spec-color` / `--spec-bg` / `--spec-border` (plus a dark-mode override) in `src/index.css`.

### To add a new CSS token:
Add to both `:root` (light) and `[data-theme="dark"]` blocks in `src/index.css`.

### To add a new role theme:
1. Add the class to `THEME_CLASS_BY_ROLE` in `UnifiedLayout.jsx`
2. Add the CSS class with its custom properties in `index.css`

---

## Related Documentation

- [Frontend Architecture (layout & components)](../../docs/architecture/04-frontend-architecture.md)
- [Developer Guide](../05-deployment/frontend-developer-guide.md)

# Insurance App: Role-Based Visual Themes & Brand Integration

In an Insurance Policy & Claim management portal, different user roles have fundamentally different needs. The user interface layout, visual hierarchy, and accents should reflect these goals.

This guide details the styling focus and visual requirements for **Admin**, **Agent**, and **Customer** portals, and explains how to integrate your brand assets (such as your logo) cleanly.

---

## 1. Role-Based Accent Colors & Brand Mood

Each role has a custom accent theme defined by class bindings or inline custom properties. You can toggle these variables based on the active route prefix (e.g. `/admin`, `/agent`, `/customer`).

| User Role    | Brand Accent Color                               | Semantic Meaning & Mood                 | Main Visual Focus                                                 |
| :----------- | :----------------------------------------------- | :-------------------------------------- | :---------------------------------------------------------------- |
| **Admin**    | Slate / Deep Cobalt Blue (`#0f172a` / `#1e3a8a`) | **Security, Control, and Audits**       | System metrics, high density tables, logs, approval queues.       |
| **Agent**    | Teal / Emerald Green (`#0d9488` / `#059669`)     | **Productivity, Sales, Action**         | Policy issuing screens, client lists, claim recommendation logs.  |
| **Customer** | Sky Blue / Sage Green (`#0284c7` / `#10b981`)    | **Reassurance, Simplicity, Protection** | Large clear buttons, claim progression trackers, payment options. |

---

## 2. Role Theme Specifics

### A. Admin Theme: The Control Center

The Admin UI requires **maximum data density** with minimal distraction. Colors should highlight discrepancies, approvals, and system state.

- **Theme Style Variables**:
  ```css
  .theme-admin {
    --role-accent: #1e3a8a; /* Royal Navy Blue */
    --role-accent-light: #eff6ff; /* Soft Tint */
    --role-border-focus: #3b82f6;
  }
  ```
- **Visual Design Rules**:
  - Use clean grids with thin borders (`var(--color-border)`).
  - Stat cards should focus on absolute numbers (Total Customers, Active Claims, Total Agents).
  - Use badge colors strictly for semantic flags:
    - `Approved` &rarr; Green badge (`bg-success`)
    - `Under Review` &rarr; Yellow badge (`bg-warning`)
    - `Rejected` &rarr; Red badge (`bg-danger`)

### B. Agent Theme: The Active Workspace

Field agents need to scan tables quickly, create recommendations, and issue new policies. The layout should guide the eye to pending actions.

- **Theme Style Variables**:
  ```css
  .theme-agent {
    --role-accent: #0d9488; /* Ocean Teal */
    --role-accent-light: #f0fdfa; /* Soft Mint Tint */
    --role-border-focus: #14b8a6;
  }
  ```
- **Visual Design Rules**:
  - Emphasize actions: "Issue Policy", "Verify Claim" using primary action buttons accented with Teal.
  - Highlight customers assigned to the agent.
  - Use sidebars with light, clean backgrounds for visual comfort during long work sessions.

### C. Customer Theme: Reassurance & Simplicity

Customers only visit to make a payment, buy a policy, or check claim statuses. They need **large, clear, comforting components** with high contrast and friendly readability.

- **Theme Style Variables**:
  ```css
  .theme-customer {
    --role-accent: #0284c7; /* Reassurance Sky Blue */
    --role-accent-light: #f0f9ff; /* Friendly Ice Blue Tint */
    --role-border-focus: #0ea5e9;
  }
  ```
- **Visual Design Rules**:
  - Keep information density **low**.
  - Use large cards with shadows (`--shadow-md`) and rounded corners (`--border-radius-lg`).
  - Implement a **Claim Progress Tracker** using a simple progress bar or stepper.
  - Call-to-action buttons should be large, clear, and prominently colored (e.g., "Raise a Claim" or "Renew Policy").

---

## 3. Logo Integration Guidelines

You have your branding logo in your assets folder (`src/assets/`). Integrating the logo correctly across both Light/Dark themes and various role layouts requires a clean containment strategy.

### A. Implementing The Logo in Code

Use a flexible Image tag wrapped inside your header, navbar, or login screens:

```jsx
import logoImg from "../assets/hero.png"; // Replace with your actual logo filename

const BrandLogo = ({ size = "32px", showText = true }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <img
        src={logoImg}
        alt="SecureShield Logo"
        style={{
          height: size,
          width: "auto",
          objectFit: "contain",
          // Filter inversion for dark theme toggle if logo is dark colored
          filter: "var(--logo-filter, none)",
          transition: "filter 0.25s ease",
        }}
      />
      {showText && (
        <span
          className="h5 mb-0 fw-bold text-dark"
          style={{ letterSpacing: "-0.5px" }}
        >
          SecureShield
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
```

### B. Logo Display Styles for Light vs. Dark Backgrounds

Add this configuration to your root theme overrides:

```css
/* In light mode, display logo normally */
[data-theme="light"] {
  --logo-filter: none;
}

/* In dark mode, if your logo has a dark background or dark lines,
   you can use filter: invert() to automatically adjust the logo color */
[data-theme="dark"] {
  --logo-filter: brightness(1.2) contrast(1.1); /* Tweaks for clarity */
  /* Or if the logo is black and needs to be white in dark mode: */
  /* --logo-filter: invert(1) brightness(2); */
}
```

### C. Sidebar Placement Strategy

1. **Admin/Agent Sidebar (Dark Background)**: Wrap the logo inside a clean header div with a slight white opacity background if the logo needs high contrast:
   ```css
   .sidebar-brand-wrapper {
     background-color: rgba(
       255,
       255,
       255,
       0.05
     ); /* Soft background to contain the logo */
     border-radius: var(--border-radius-sm);
     padding: 8px 12px;
   }
   ```
2. **Customer Portal Header (Light Background)**: Render the logo cleanly on the left side of the top navbar with plenty of breathing room (padding: `12px 20px`).

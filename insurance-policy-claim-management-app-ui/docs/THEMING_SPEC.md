# SecureShield Insurance: Theming & Color Specification

This document defines the color systems, typography, and styling variables for the light and dark modes of the Insurance Policy & Claim Management application. 

By using CSS Custom Properties (Variables), you can easily toggle between light and dark modes by modifying the `data-theme` attribute on the root element.

---

## 1. Core Color System (Design Tokens)

Insurance products require a feeling of **trust, security, and clarity**. We achieve this using a base color palette centered around deep blues, clean slate grays, and clear alert indicators.

### CSS Custom Variables Definition
Create or import these in your main CSS file (e.g., `src/index.css`):

```css
/* Custom variables for light/dark theme toggling */
:root {
  /* Common Alert Colors (semantic utility tokens) */
  --color-success: #0d9488;       /* Teal - Claim Approved / Active Policy */
  --color-warning: #f59e0b;       /* Amber - Pending Claim / Review Required */
  --color-danger: #ef4444;        /* Red - Rejected Claim / Payment Overdue */
  --color-info: #3b82f6;          /* Blue - Status Info / Guide */

  --transition-speed: 0.25s;
  --transition-ease: ease-in-out;
  --border-radius-sm: 6px;
  --border-radius-md: 12px;
  --border-radius-lg: 18px;
}

/* Light Theme Variables */
[data-theme="light"] {
  --color-primary: #1e3a8a;          /* Deep Trust Royal Blue */
  --color-primary-light: #eff6ff;    /* Very Soft Blue Tint */
  --color-secondary: #475569;        /* Slate Gray */
  --color-bg-app: #f8fafc;           /* Light Cool Gray Background */
  --color-bg-card: #ffffff;          /* Pure White Cards */
  --color-text-main: #0f172a;        /* Near Black Main Text */
  --color-text-muted: #64748b;       /* Soft Gray Muted Text */
  --color-border: #e2e8f0;           /* Soft Border Gray */
  --color-navbar: #ffffff;
  --color-sidebar: #0f172a;          /* Keep sidebar dark even in light theme for contrast */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
}

/* Dark Theme Variables */
[data-theme="dark"] {
  --color-primary: #3b82f6;          /* Vibrant Reassurance Blue */
  --color-primary-light: #1e3a8a;    /* Deep Blue Tint */
  --color-secondary: #94a3b8;        /* Light Slate Gray */
  --color-bg-app: #0f172a;           /* Dark Blue-Gray Background */
  --color-bg-card: #1e293b;          /* Charcoal Blue Cards */
  --color-text-main: #f8fafc;        /* Off-white Main Text */
  --color-text-muted: #94a3b8;       /* Medium Gray Muted Text */
  --color-border: #334155;           /* Slate Border */
  --color-navbar: #1e293b;
  --color-sidebar: #0b0f19;          /* Deepest Charcoal for sidebar */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
}
```

---

## 2. Applying Custom Themes in CSS

To use these variables inside your application's custom components (such as dashboards, logins, cards, and headers), reference them in your CSS selectors:

```css
/* Card example */
.dashboard-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-main);
  transition: background-color var(--transition-speed) var(--transition-ease),
              border-color var(--transition-speed) var(--transition-ease);
}

.dashboard-card:hover {
  border-color: var(--color-primary);
}

/* Page title headers */
.page-title {
  color: var(--color-text-main);
  font-weight: 700;
}

.page-subtitle {
  color: var(--color-text-muted);
}
```

---

## 3. Light/Dark Toggle Implementation

You can manage the theme toggle state in React using standard state and the `useEffect` hook. Here is a simple implementation guide.

### Simple React Toggle Switch
Place this code snippet in your header, navigation bar, or settings page:

```jsx
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  // Read initial preference from localStorage, default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "light";
  });

  // Apply the theme to html tag whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="btn btn-outline-secondary rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-2"
    >
      {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
};

export default ThemeToggle;
```

---

## 4. Bootstrap 5 Custom Styling Overrides

To integrate your CSS variables with Bootstrap 5 utility classes, you can declare overrides directly in your `src/index.css`:

```css
/* Bootstrap button primary override */
.btn-primary {
  background-color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
}

.btn-primary:hover {
  filter: brightness(0.9);
}

/* Background Utility Classes Overrides */
.bg-light {
  background-color: var(--color-bg-app) !important;
}

.bg-white {
  background-color: var(--color-bg-card) !important;
}

/* Text Utility Classes Overrides */
.text-dark {
  color: var(--color-text-main) !important;
}

.text-muted {
  color: var(--color-text-muted) !important;
}

.border-bottom {
  border-bottom: 1px solid var(--color-border) !important;
}
```

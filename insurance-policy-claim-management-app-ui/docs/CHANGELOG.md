# Documentation Changelog

## 2026-07-17

**Summary:** Massive architectural pivot documented. The application was migrated from a lazy-loaded, Suspense-reliant SPA to a zero-latency, statically-bundled desktop-class architecture. All documentation was updated to reflect this new paradigm.

### Affected Features
- **Routing:** Removed `React.lazy()` and `<Suspense>`.
- **Navigation:** Synchronous, zero-latency component mounting (removed `AnimatePresence`).
- **Data Tables:** Removed `PageSkeleton` and replaced with Stale-While-Revalidate dimming and inline `<LoadingSpinner />`.

### Files Updated
- **`docs/architecture/overview.md`**
  - *Reason:* Documented the removal of lazy-loaded pages and Suspense from the `<Routes>` layer in the App Bootstrap Sequence diagram.
- **`docs/routing/routing.md`**
  - *Reason:* Deleted the "Lazy Loading" section entirely and replaced it with a detailed explanation of the "Zero-Latency Static Routing" strategy using ES6 imports.
- **`docs/deep-dives/01-Architecture-and-Global-Flow-Deep-Dive.md`**
  - *Reason:* Rewrote the render sequence flows for `<App />` and `<Login />` to remove references to network chunk fetching and Suspense fallbacks.
- **`docs/developer-guide.md`**
  - *Reason:* Updated the "Adding a New Page" tutorial to instruct developers to use static imports in `App.jsx` rather than `lazy()`.
- **`docs/components/ui-components.md`**
  - *Reason:* Completely overhauled the `DataTable` loading state documentation, replacing skeleton placeholders with the new cold-load (spinner) and warm-load (dimming) implementations.
- **`docs/design-system/design-system.md`**
  - *Reason:* Removed skeleton loading states from the Tables design specification.
- **`docs/coding_practices.md`**
  - *Reason:* Updated the Routing Configuration rule to mandate static imports over lazy-loading.
- **`docs/debugging/debugging.md`**
  - *Reason:* Updated routing troubleshooting steps to check standard `import` paths instead of `lazy(() => import(...))`.

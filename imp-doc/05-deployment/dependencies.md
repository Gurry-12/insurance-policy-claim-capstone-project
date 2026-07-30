# Dependencies

This document outlines the key dependencies used in the Insurance Policy Claim Management App UI.

## Core Libraries
- **React (`^19.2.6`)**: Core library for building the user interface.
- **React DOM (`^19.2.6`)**: Serves as the entry point to the DOM and server renderers for React.
- **React Router DOM (`^7.18.0`)**: Used for client-side routing, enabling navigation across the different roles (Admin, Agent, Customer) and shared pages.

## UI and Styling
- **Bootstrap (`^5.3.8`)**: Primary CSS framework used for responsive layouts and styling.
- **Bootstrap Icons (`^1.13.1`)**, **Lucide React (`^1.21.0`)**, **React Icons (`^5.6.0`)**: Various icon libraries used across components to enhance visual feedback and UI aesthetics.

## HTTP & API
- **Axios (`^1.18.0`)**: Promise-based HTTP client used for communicating with the backend API services.

## Authentication & Security
- **JWT Decode (`^4.0.0`)**: Used to decode JSON Web Tokens (JWT) for extracting user roles and verifying authentication status.

## Utilities & Feedback
- **React Hot Toast (`^2.6.0`)**: Lightweight library for displaying toast notifications to the user (e.g., success, error messages).
- **Loading (`^1.13.3`)**: Library/component for displaying loading indicators or spinners during asynchronous operations.

## Development Tools
- **Vite (`^8.0.12`)**: Fast build tool and development server.
- **ESLint (`^10.3.0`)**: Used for linting the codebase, ensuring code quality and consistency across React components.

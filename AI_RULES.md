# AI Development Rules for LogiReverseIA

This document outlines the core technologies and best practices for developing the LogiReverseIA application. Adhering to these rules ensures consistency, maintainability, and optimal performance.

## Tech Stack Overview

The LogiReverseIA project is built upon a modern and robust set of technologies:

*   **React & TypeScript:** The primary frontend library and language, providing a strong foundation for building interactive user interfaces with type safety.
*   **Vite:** A fast and efficient build tool that significantly improves the development experience.
*   **Tailwind CSS:** A utility-first CSS framework used for all styling, enabling rapid and consistent UI development.
*   **shadcn/ui & Radix UI:** A collection of beautifully designed, accessible, and customizable UI components built on Radix UI primitives and styled with Tailwind CSS.
*   **React Router:** Manages client-side routing, ensuring smooth navigation between different sections of the application.
*   **TanStack Query:** Handles server state management, data fetching, caching, and synchronization, improving performance and developer experience.
*   **Supabase:** Provides backend services including authentication and database interactions, integrated for seamless data management.
*   **Lucide React:** A comprehensive icon library used for all visual icons throughout the application.
*   **Sonner:** A modern toast notification library for providing user feedback.
*   **Mapbox GL JS:** Powers interactive maps, enabling dynamic route visualization and location-based features.
*   **jsPDF & html2canvas:** Libraries used for generating and exporting PDF reports directly from the browser.
*   **React Hook Form & Zod:** Used together for efficient form management and robust schema-based validation.

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please follow these guidelines when implementing new features or modifying existing ones:

*   **UI Components:**
    *   **Always** prioritize `shadcn/ui` components for building the user interface.
    *   If a specific `shadcn/ui` component does not exist or requires significant customization, create a new component that either wraps `shadcn/ui` primitives or is built from scratch using Tailwind CSS. **Do not modify `shadcn/ui` component files directly.**
*   **Styling:**
    *   **Exclusively** use Tailwind CSS for all styling. Avoid inline styles or separate CSS files unless absolutely necessary for third-party integrations that cannot be styled otherwise.
    *   Leverage the custom colors, gradients, and animations defined in `tailwind.config.ts` and `src/index.css` to maintain the futuristic design aesthetic.
*   **Routing:**
    *   Use `react-router-dom` for all client-side navigation. Define routes within `src/App.tsx`.
*   **State Management & Data Fetching:**
    *   For server-side data fetching, caching, and synchronization, use `TanStack Query`.
    *   For local component state, use React's `useState` and `useReducer` hooks.
*   **Icons:**
    *   All icons should be imported from `lucide-react`.
*   **Forms & Validation:**
    *   Use `react-hook-form` for managing form state and submissions.
    *   Implement `zod` for defining validation schemas for all forms.
*   **Notifications:**
    *   Use `sonner` for displaying all toast notifications to the user.
*   **Maps:**
    *   `mapbox-gl` should be used for any interactive map functionalities. Ensure that Mapbox access tokens are handled securely (e.g., via environment variables).
*   **PDF Generation:**
    *   For generating PDF reports, use `jspdf` in conjunction with `html2canvas` if converting HTML elements to PDF.
*   **Backend & Authentication:**
    *   All interactions with the backend, including user authentication and database operations, must be done using the `supabase-js` client.
*   **Utility Functions:**
    *   Use the `cn` utility function (from `src/lib/utils.ts`) for conditionally applying and merging Tailwind CSS classes.
    *   For date manipulation, `date-fns` is the preferred library.
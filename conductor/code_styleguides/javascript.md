# JavaScript Style Guide - B2B Product Exhibition Website

## 1. General Principles
- **Readability First:** Prioritize clear, self-documenting code over clever or overly concise patterns.
- **Consistency:** Follow these rules throughout the backend (Workers) and frontend (Vanilla JS).

## 2. Naming Conventions
- **Variables & Functions:** Use `camelCase`.
- **Classes:** Use `PascalCase`.
- **Constants:** Use `UPPER_SNAKE_CASE`.
- **Files:** Use `kebab-case.js`.

## 3. Cloudflare Workers (Backend)
- **Asynchronous Code:** Use `async/await` exclusively. Avoid raw `.then()` calls.
- **Error Handling:** Every API endpoint should be wrapped in a `try/catch` block, returning standardized JSON error responses.
- **Dependency Minimization:** Since Workers have a limited bundle size (especially on the Free plan), only use essential dependencies.
- **Env Vars:** Use `env` bindings for all configuration (D1, KV, ImageKit credentials).

## 4. Vanilla JavaScript (Frontend)
- **DOM Manipulation:** Use `document.querySelector` and `document.querySelectorAll`.
- **Event Listeners:** Use `.addEventListener()` instead of inline `on*` attributes.
- **Component Separation:** Separate HTML templates, CSS, and JS logic as much as possible, even in a vanilla setup.
- **State Management:** For this project, a simple global state object or localized state for each page is preferred.

## 5. Security Best Practices
- **Input Sanitization:** Sanitize all user-provided data before storing it in the D1 database.
- **CORS:** Ensure appropriate CORS headers are set if the frontend and backend ever diverge in origin.
- **JWT:** Use secure, HttpOnly cookies or localized storage as per the auth strategy, ensuring tokens are always validated in the Worker.

## 6. ImageKit.io Integration
- **Optimization:** Use ImageKit's transformation parameters to deliver the appropriately sized images for each device.
- **Secure Uploads:** Always perform ImageKit uploads from the backend (Cloudflare Worker) to keep API keys secure.

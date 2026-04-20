# Tech Stack - B2B Product Exhibition Website

## Core Technologies
- **JavaScript (Vanilla):** The primary programming language for both backend (Cloudflare Workers) and frontend logic.
- **Cloudflare Workers:** Serverless platform for hosting the backend API and serving frontend assets.
- **Cloudflare D1 (SQLite):** Relational database for storing structured product, inquiry, and admin data.
- **Cloudflare KV:** Key-Value storage used for dynamic website settings and configuration.

## Storage & Media
- **Cloudflare R2:** (Current) Object storage for images and technical documentation.
- **ImageKit.io:** (Planned Integration) Transitioning image storage to ImageKit.io for real-time image optimization, delivery, and transformation.

## Security & Auth
- **JWT (JSON Web Tokens):** Used for stateless authentication of admin users.
- **SHA-256 Hashing:** Secure password hashing for admin accounts stored in the D1 database.
- **Role-Based Access Control (RBAC):** Restricting access to specific admin features based on user permissions.

## Tooling
- **Wrangler CLI:** Used for local development and deployment to the Cloudflare network.
- **Node.js:** Local environment for running scripts and managing dependencies via npm.

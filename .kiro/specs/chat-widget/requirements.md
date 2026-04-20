# Chat Widget — Requirements

## Overview

Add a live chat widget to the B2B website that lets visitors send messages and admins reply in real time. Chat history is persisted in the existing Cloudflare D1 database. The widget sits fixed in the lower-right corner of every public page.

## Requirements

### REQ-1: Visitor Chat Widget

- **REQ-1.1** A chat bubble button is fixed to the lower-right corner of every public page (home, products, product detail, about, contact).
- **REQ-1.2** Clicking the bubble opens a chat panel (350×500px) without navigating away.
- **REQ-1.3** Visitors can type and send messages without logging in. A visitor name/nickname is asked once per session (stored in `sessionStorage`).
- **REQ-1.4** Sent messages appear immediately in the chat panel with a timestamp.
- **REQ-1.5** When the admin replies, the reply appears in the visitor's panel in real time (via polling every 3 seconds — no WebSocket dependency on the main worker).
- **REQ-1.6** Each visitor session gets a unique `session_id` (UUID generated client-side, stored in `sessionStorage`).

### REQ-2: Chat Persistence (D1)

- **REQ-2.1** All messages (visitor and admin) are stored in a new `chat_messages` table in the existing D1 database.
- **REQ-2.2** Schema: `id`, `session_id`, `sender_type` (`visitor` | `admin`), `sender_name`, `message`, `created_at`.
- **REQ-2.3** A `chat_sessions` table tracks each visitor session: `session_id`, `visitor_name`, `page_url`, `status` (`open` | `closed`), `created_at`, `updated_at`.
- **REQ-2.4** Messages are loaded on widget open (last 50 messages for the session).

### REQ-3: Chat API (added to existing Worker)

- **REQ-3.1** `POST /api/chat/session` — create or resume a session (body: `{ session_id, visitor_name, page_url }`).
- **REQ-3.2** `GET /api/chat/messages?session_id=xxx` — fetch messages for a session (last 50).
- **REQ-3.3** `POST /api/chat/message` — send a message (body: `{ session_id, sender_type, sender_name, message }`). Admin messages require a valid JWT in the `Authorization` header.
- **REQ-3.4** All chat API endpoints are added to the existing `src/api/router.js`.

### REQ-4: Admin Chat Interface

- **REQ-4.1** The admin dashboard gets a new "Live Chat" tab showing all open sessions.
- **REQ-4.2** Each session shows visitor name, last message preview, and timestamp.
- **REQ-4.3** Clicking a session opens a reply panel where the admin can read the full conversation and send replies.
- **REQ-4.4** Admin replies are sent via `POST /api/chat/message` with the JWT token.
- **REQ-4.5** The admin panel auto-refreshes the session list every 5 seconds.

### REQ-5: UI & Styling

- **REQ-5.1** The chat widget matches the existing site design (uses `--primary-color: #2563eb` and existing font stack).
- **REQ-5.2** The widget is fully responsive and works on mobile.
- **REQ-5.3** The bubble shows an unread message badge (red dot) when there are new admin replies since the panel was last opened.
- **REQ-5.4** The widget is injected via the existing `createLayout()` function in `src/pages/layout.js` so it appears on all public pages automatically.

### REQ-6: No New Worker Required

- **REQ-6.1** All chat API logic is added to the existing `cf-b2b-website` Worker — no separate Worker or Cloudflare Pages project is needed.
- **REQ-6.2** Real-time feel is achieved via client-side polling (3s for visitors, 5s for admin) rather than WebSockets, keeping the implementation simple and within the existing architecture.

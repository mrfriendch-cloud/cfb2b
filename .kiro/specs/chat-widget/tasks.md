# Chat Widget — Tasks

## Task 1: Database Schema

Add chat tables to the D1 schema.

- [ ] Add `chat_sessions` and `chat_messages` tables to `schema/schema.sql`
- [ ] Add indexes for `session_id` and `status`
- [ ] Run migration against the remote D1 database via `wrangler d1 execute`

## Task 2: Chat API Handler

Create `src/api/handlers/chat.js` with all chat endpoints.

- [ ] `POST /api/chat/session` — upsert a session (INSERT OR IGNORE + UPDATE updated_at)
- [ ] `GET /api/chat/messages` — fetch messages by `session_id`, support `after` param for polling
- [ ] `POST /api/chat/message` — insert a message; validate JWT for `sender_type: admin`
- [ ] `GET /api/chat/sessions` — list sessions with last message preview (JWT required)
- [ ] `PUT /api/chat/session/:id/close` — mark session closed (JWT required)
- [ ] Rate limit: reject if visitor sends >30 messages/session/hour

## Task 3: Wire up Router

Add the chat route to the existing API router.

- [ ] Add `if (path.startsWith('/api/chat'))` block to `src/api/router.js`
- [ ] Import and call `handleChat` from `./handlers/chat`

## Task 4: Visitor Chat Widget

Inject the chat widget into all public pages via `layout.js`.

- [ ] Add widget HTML (bubble button + panel) to `createLayout()` in `src/pages/layout.js`
- [ ] Add widget CSS (fixed positioning, bubble, panel, message bubbles, badge)
- [ ] Add widget JS:
  - Generate/restore `session_id` from `sessionStorage`
  - Ask for visitor name on first open (simple inline prompt in the panel)
  - `POST /api/chat/session` on name submit
  - `POST /api/chat/message` on send
  - Poll `GET /api/chat/messages?session_id=xxx&after=<last_id>` every 3s when panel is open
  - Show unread badge on bubble when panel is closed and new messages arrive
  - Stop polling when panel is closed

## Task 5: Admin Live Chat Tab

Add a "Live Chat" tab to the admin dashboard.

- [ ] Add "Live Chat" tab button to the existing tab bar in `src/pages/admin-dashboard.js`
- [ ] Add tab panel HTML with sessions list and reply panel side-by-side layout
- [ ] Add JS:
  - `loadChatSessions()` — fetch and render session list, poll every 5s
  - `openChatSession(sessionId)` — load messages for selected session, poll every 3s
  - `sendAdminReply()` — POST message with JWT from `localStorage`
  - Highlight sessions with unread visitor messages
  - "Close Session" button

## Task 6: Deploy & Migrate

- [ ] Run `wrangler d1 execute b2b_database --remote --file=schema/schema.sql` to apply new tables
- [ ] Run `npx wrangler deploy` to push the updated worker
- [ ] Verify widget appears on the live site
- [ ] Verify admin chat tab works in the dashboard

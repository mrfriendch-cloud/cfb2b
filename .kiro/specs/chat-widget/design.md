# Chat Widget — Design

## Architecture

Everything lives inside the existing `cf-b2b-website` Cloudflare Worker. No new Worker or Pages project is needed.

```
Browser (Visitor)
  └── Chat Widget (injected by layout.js)
        ├── POST /api/chat/session      → create/resume session
        ├── POST /api/chat/message      → send visitor message
        └── GET  /api/chat/messages     → poll for new messages (every 3s)

Browser (Admin Dashboard)
  └── Live Chat Tab (in admin-dashboard.js)
        ├── GET  /api/chat/sessions     → list all open sessions (poll 5s)
        ├── GET  /api/chat/messages     → read a session's messages
        └── POST /api/chat/message      → send admin reply (JWT required)

Cloudflare Worker (cf-b2b-website)
  └── src/api/router.js
        └── /api/chat/* → src/api/handlers/chat.js

Cloudflare D1 (b2b_database)
  ├── chat_sessions
  └── chat_messages
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  page_url TEXT,
  status TEXT DEFAULT 'open',   -- open | closed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,    -- visitor | admin
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
```

## File Changes

| File                           | Change                                         |
| ------------------------------ | ---------------------------------------------- |
| `schema/schema.sql`            | Add `chat_sessions` and `chat_messages` tables |
| `src/api/handlers/chat.js`     | New file — all chat API logic                  |
| `src/api/router.js`            | Add `/api/chat` route                          |
| `src/pages/layout.js`          | Inject chat widget HTML + JS before `</body>`  |
| `src/pages/admin-dashboard.js` | Add "Live Chat" tab                            |

## API Design

### POST /api/chat/session

```json
// Request
{ "session_id": "uuid", "visitor_name": "John", "page_url": "/products" }

// Response
{ "success": true, "session_id": "uuid" }
```

### GET /api/chat/messages?session_id=xxx

```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender_type": "visitor",
      "sender_name": "John",
      "message": "Hello",
      "created_at": "..."
    },
    {
      "id": 2,
      "sender_type": "admin",
      "sender_name": "Support",
      "message": "Hi!",
      "created_at": "..."
    }
  ]
}
```

### POST /api/chat/message

```json
// Request (visitor — no auth)
{ "session_id": "uuid", "sender_type": "visitor", "sender_name": "John", "message": "I need help" }

// Request (admin — requires Authorization: Bearer <jwt>)
{ "session_id": "uuid", "sender_type": "admin", "sender_name": "Support", "message": "Sure!" }

// Response
{ "success": true, "id": 3 }
```

### GET /api/chat/sessions (admin only, JWT required)

```json
// Response
{
  "success": true,
  "data": [
    {
      "session_id": "uuid",
      "visitor_name": "John",
      "page_url": "/products",
      "status": "open",
      "last_message": "I need help",
      "last_message_at": "...",
      "unread_count": 1
    }
  ]
}
```

## Widget UI

```
┌─────────────────────────────┐  ← fixed, bottom-right, z-index: 9999
│  💬 Chat with us        [×] │  ← header
├─────────────────────────────┤
│                             │
│  [visitor bubble]           │
│              [admin bubble] │
│  [visitor bubble]           │
│                             │
├─────────────────────────────┤
│  [input field]    [Send]    │  ← footer
└─────────────────────────────┘

[💬]  ← collapsed bubble (lower-right)
 [●]  ← red dot badge for unread
```

## Polling Strategy

- Visitor widget polls `GET /api/chat/messages?session_id=xxx&after=<last_id>` every 3 seconds when the panel is open.
- Admin panel polls `GET /api/chat/sessions` every 5 seconds.
- Admin reply panel polls `GET /api/chat/messages?session_id=xxx&after=<last_id>` every 3 seconds when a session is open.
- Polling stops when the panel/tab is closed or hidden.

## Security

- Visitor messages: no auth required, rate-limited by session_id (max 30 messages per session per hour — enforced in handler).
- Admin messages: require valid JWT in `Authorization: Bearer <token>` header (reuses existing `verifyToken` from `src/utils/auth.js`).
- `GET /api/chat/sessions`: requires JWT (admin only).
- Session IDs are UUIDs — not guessable, but not secret. Message content is not sensitive beyond normal business chat.

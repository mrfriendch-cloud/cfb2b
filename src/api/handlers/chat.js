/**
 * Chat API Handler
 * Handles all /api/chat/* endpoints
 */

import { verifyToken } from "../../utils/auth.js";

const RATE_LIMIT_MAX = 30; // max visitor messages per session per hour

async function getAdminFromRequest(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const secret = env.JWT_SECRET || "your-secret-key-change-this-in-production";
  return await verifyToken(token, secret);
}

async function checkRateLimit(env, sessionId) {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const result = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM chat_messages
     WHERE session_id = ? AND sender_type = 'visitor' AND created_at > ?`,
  )
    .bind(sessionId, oneHourAgo)
    .first();
  return result.count < RATE_LIMIT_MAX;
}

export async function handleChat(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // POST /api/chat/session — create or resume a session
  if (path === "/api/chat/session" && method === "POST") {
    try {
      const { session_id, visitor_name, page_url } = await request.json();
      if (!session_id || !visitor_name) {
        return json(
          { success: false, error: "session_id and visitor_name are required" },
          400,
        );
      }

      await env.DB.prepare(
        `INSERT INTO chat_sessions (session_id, visitor_name, page_url, status)
         VALUES (?, ?, ?, 'open')
         ON CONFLICT(session_id) DO UPDATE SET
           updated_at = CURRENT_TIMESTAMP,
           status = CASE WHEN status = 'closed' THEN 'open' ELSE status END`,
      )
        .bind(
          session_id,
          visitor_name.slice(0, 100),
          (page_url || "").slice(0, 500),
        )
        .run();

      return json({ success: true, session_id });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  // GET /api/chat/messages?session_id=xxx&after=0
  if (path === "/api/chat/messages" && method === "GET") {
    try {
      const sessionId = url.searchParams.get("session_id");
      const after = parseInt(url.searchParams.get("after") || "0", 10);

      if (!sessionId) {
        return json({ success: false, error: "session_id is required" }, 400);
      }

      // Admin can read any session; visitor can only read their own (no auth check needed
      // since session_id is a UUID — not guessable)
      const messages = await env.DB.prepare(
        `SELECT id, session_id, sender_type, sender_name, message, created_at
         FROM chat_messages
         WHERE session_id = ? AND id > ?
         ORDER BY id ASC
         LIMIT 50`,
      )
        .bind(sessionId, after)
        .all();

      return json({ success: true, data: messages.results });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  // POST /api/chat/message — send a message
  if (path === "/api/chat/message" && method === "POST") {
    try {
      const body = await request.json();
      const { session_id, sender_type, sender_name, message } = body;

      if (!session_id || !sender_type || !sender_name || !message) {
        return json({ success: false, error: "Missing required fields" }, 400);
      }
      if (!["visitor", "admin"].includes(sender_type)) {
        return json({ success: false, error: "Invalid sender_type" }, 400);
      }
      if (message.trim().length === 0 || message.length > 2000) {
        return json(
          { success: false, error: "Message must be 1–2000 characters" },
          400,
        );
      }

      // Admin messages require JWT
      if (sender_type === "admin") {
        const admin = await getAdminFromRequest(request, env);
        if (!admin) {
          return json({ success: false, error: "Unauthorized" }, 401);
        }
      } else {
        // Rate limit visitors
        const allowed = await checkRateLimit(env, session_id);
        if (!allowed) {
          return json(
            {
              success: false,
              error:
                "Rate limit exceeded. Please wait before sending more messages.",
            },
            429,
          );
        }
      }

      // Ensure session exists
      const session = await env.DB.prepare(
        `SELECT session_id FROM chat_sessions WHERE session_id = ?`,
      )
        .bind(session_id)
        .first();
      if (!session) {
        return json({ success: false, error: "Session not found" }, 404);
      }

      const result = await env.DB.prepare(
        `INSERT INTO chat_messages (session_id, sender_type, sender_name, message)
         VALUES (?, ?, ?, ?)`,
      )
        .bind(
          session_id,
          sender_type,
          sender_name.slice(0, 100),
          message.trim(),
        )
        .run();

      // Update session updated_at
      await env.DB.prepare(
        `UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      )
        .bind(session_id)
        .run();

      return json({ success: true, id: result.meta.last_row_id });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  // GET /api/chat/sessions — list sessions (admin only)
  if (path === "/api/chat/sessions" && method === "GET") {
    try {
      const admin = await getAdminFromRequest(request, env);
      if (!admin) {
        return json({ success: false, error: "Unauthorized" }, 401);
      }

      const status = url.searchParams.get("status") || "open";

      const sessions = await env.DB.prepare(
        `SELECT
           s.session_id,
           s.visitor_name,
           s.page_url,
           s.status,
           s.created_at,
           s.updated_at,
           m.message as last_message,
           m.sender_type as last_sender_type,
           m.created_at as last_message_at,
           (SELECT COUNT(*) FROM chat_messages
            WHERE session_id = s.session_id AND sender_type = 'visitor') as total_messages
         FROM chat_sessions s
         LEFT JOIN chat_messages m ON m.id = (
           SELECT id FROM chat_messages
           WHERE session_id = s.session_id
           ORDER BY id DESC LIMIT 1
         )
         WHERE s.status = ?
         ORDER BY s.updated_at DESC
         LIMIT 100`,
      )
        .bind(status)
        .all();

      return json({ success: true, data: sessions.results });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  // PUT /api/chat/session/close — close a session (admin only)
  if (path === "/api/chat/session/close" && method === "PUT") {
    try {
      const admin = await getAdminFromRequest(request, env);
      if (!admin) {
        return json({ success: false, error: "Unauthorized" }, 401);
      }

      const { session_id } = await request.json();
      if (!session_id) {
        return json({ success: false, error: "session_id is required" }, 400);
      }

      await env.DB.prepare(
        `UPDATE chat_sessions SET status = 'closed', updated_at = CURRENT_TIMESTAMP
         WHERE session_id = ?`,
      )
        .bind(session_id)
        .run();

      return json({ success: true });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  // DELETE /api/chat/session — delete session + all messages (admin only)
  if (path === "/api/chat/session" && method === "DELETE") {
    try {
      const admin = await getAdminFromRequest(request, env);
      if (!admin) {
        return json({ success: false, error: "Unauthorized" }, 401);
      }

      const { session_id } = await request.json();
      if (!session_id) {
        return json({ success: false, error: "session_id is required" }, 400);
      }

      // Delete messages first (FK constraint), then session
      await env.DB.prepare(`DELETE FROM chat_messages WHERE session_id = ?`)
        .bind(session_id)
        .run();

      await env.DB.prepare(`DELETE FROM chat_sessions WHERE session_id = ?`)
        .bind(session_id)
        .run();

      return json({ success: true });
    } catch (err) {
      return json({ success: false, error: err.message }, 500);
    }
  }

  return json({ success: false, error: "Not found" }, 404);
}

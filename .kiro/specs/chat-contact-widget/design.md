# Design Document: Chat Contact Widget

## Overview

This feature extends the existing chat bubble widget — rendered on every public page via `createLayout()` in `src/pages/layout.js` — to support two operating modes:

- **Live Chat** (existing behavior, unchanged): clicking the bubble opens the live chat panel.
- **Contact Form**: clicking the bubble opens a floating contact form panel that submits to `POST /api/inquiries`.

An admin toggle in the Settings tab controls which mode is active. The selected mode is persisted in Cloudflare KV under the `website_settings` key as `chat_widget_mode`. Public pages read this value on load and render only the appropriate panel.

The design is intentionally minimal: it reuses existing CSS variables, the existing `API` helper, the existing `showNotification` utility, and the existing `validateEmail` helper already present in `createLayout()`. No new dependencies are introduced.

---

## Architecture

The feature touches three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Panel (src/pages/admin-dashboard.js)                 │
│  • Settings tab: adds "Chat Widget Mode" radio group        │
│  • Reads/writes chat_widget_mode via /api/settings          │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /api/settings
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Settings API (src/api/handlers/settings.js)                │
│  • GET: returns chat_widget_mode (default: "live_chat")     │
│  • POST: persists chat_widget_mode alongside other fields   │
└────────────────────────┬────────────────────────────────────┘
                         │ KV: website_settings
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Public Layout (src/pages/layout.js — createLayout())       │
│  • On DOMContentLoaded: fetches /api/settings               │
│  • Branches on chat_widget_mode:                            │
│    "live_chat"    → existing chat IIFE runs normally        │
│    "contact_form" → contact form panel is shown on click;   │
│                     live chat IIFE is never initialized     │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Mode read at page load, not at build time.** The widget fetches `/api/settings` on `DOMContentLoaded` (the same call already made by `loadWebsiteSettings()`). We reuse that existing response rather than making a second request.

2. **Mode isolation via conditional initialization.** The live chat IIFE and the contact form panel are mutually exclusive. When `chat_widget_mode === "contact_form"`, the live chat IIFE's `initSession()` / `startPolling()` paths are never entered. When `chat_widget_mode === "live_chat"`, the contact form panel DOM is never inserted.

3. **No server-side rendering of mode.** The mode is applied client-side after the settings fetch. This avoids adding async KV reads to the `createLayout()` render path (which is already synchronous) and keeps the layout function simple.

4. **Settings API: additive field.** `chat_widget_mode` is added to the settings object in both GET and POST handlers. Existing fields are unaffected. The default value `"live_chat"` is returned when the field is absent from KV, preserving backward compatibility.

---

## Components and Interfaces

### 1. Settings API (`src/api/handlers/settings.js`)

**GET `/api/settings`** — no changes to the request shape. Response gains one field:

```json
{
  "success": true,
  "data": {
    "site_name": "...",
    "chat_widget_mode": "live_chat"
  }
}
```

`chat_widget_mode` defaults to `"live_chat"` when absent from KV.

**POST `/api/settings`** — accepts the new field alongside existing fields:

```json
{
  "site_name": "...",
  "chat_widget_mode": "contact_form"
}
```

If `chat_widget_mode` is absent from the POST body, the existing stored value is preserved (not overwritten with a default). This is achieved by reading the current KV value before constructing the new settings object.

### 2. Admin Panel Settings Tab (`src/pages/admin-dashboard.js`)

A "Chat Widget Mode" section is added to the existing settings form, rendered as a radio button group:

```html
<div class="form-group">
  <label class="form-label">Chat Widget Mode</label>
  <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
    <label
      style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"
    >
      <input
        type="radio"
        name="chat_widget_mode"
        value="live_chat"
        id="mode-live-chat"
      />
      Live Chat
    </label>
    <label
      style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"
    >
      <input
        type="radio"
        name="chat_widget_mode"
        value="contact_form"
        id="mode-contact-form"
      />
      Contact Form
    </label>
  </div>
</div>
```

The `loadSettings()` function already reads `/api/settings` and populates form fields; it will additionally set the correct radio button. The `save-settings-btn` submit handler already serializes the form; it will include `chat_widget_mode` from the selected radio.

### 3. Public Widget (`src/pages/layout.js` — `createLayout()`)

The existing `loadWebsiteSettings()` function already fetches `/api/settings`. After applying the existing settings (logo, footer, etc.), it will also read `chat_widget_mode` and call `initWidgetMode(mode)`.

**`initWidgetMode(mode)`** — new function injected into the layout script block:

```
initWidgetMode("live_chat")   → enables existing chat IIFE, hides/removes contact form panel
initWidgetMode("contact_form") → disables live chat IIFE entry points, inserts contact form panel
```

The existing chat IIFE is refactored minimally: `toggleChatPanel()` checks a module-level `widgetMode` variable before opening the chat panel. If `widgetMode !== "live_chat"`, it delegates to `toggleContactFormPanel()` instead.

**`toggleContactFormPanel()`** — new function:

- Toggles the `#contact-form-panel` element's `open` class.
- Updates the bubble icon (💬 ↔ ✕).
- Manages focus on open.

### 4. Contact Form Panel (HTML injected by `createLayout()`)

The panel is injected into the DOM alongside the existing chat panel markup. It is hidden by default (`display: none`) and only shown when `chat_widget_mode === "contact_form"`.

Structure:

```
#contact-form-panel  (fixed, bottom-right, above bubble)
  #cfp-header        (primary-color background, title + ✕ button)
  #cfp-body          (scrollable form area)
    #cfp-form
      name input     (optional)
      email input    (required)
      phone input    (optional)
      message textarea (required)
      submit button  ("Send Message")
  #cfp-success-msg   (hidden until success)
  #cfp-error-msg     (hidden until error)
```

CSS reuses the same variables and class patterns as `#chat-panel`:

- `border-radius: 1rem`
- `box-shadow: 0 8px 32px rgba(0,0,0,0.18)`
- Header: `background: var(--primary-color); color: white`
- Mobile breakpoint `<480px`: `width: calc(100vw - 16px); right: 8px`

---

## Data Models

### KV: `website_settings`

Existing shape (stored as JSON string in Cloudflare KV under key `website_settings`):

```json
{
  "site_name": "string",
  "site_description": "string",
  "company_intro": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "linkedin": "string",
  "facebook": "string",
  "twitter": "string",
  "updated_at": "ISO8601 string"
}
```

**New field added:**

```json
{
  "chat_widget_mode": "live_chat" | "contact_form"
}
```

Default when absent: `"live_chat"`.

### Contact Form Submission Payload

Submitted to `POST /api/inquiries` — same shape as the existing contact page:

```json
{
  "name": "string (optional, may be empty)",
  "email": "string (required, valid email format)",
  "phone": "string (optional, may be empty)",
  "message": "string (required, non-empty)"
}
```

No changes to the Inquiries API are required.

---
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

This feature involves pure validation logic, state-machine-like UI transitions, and data transformation. These are well-suited to property-based testing.

### Property 1: Settings round-trip preserves chat_widget_mode

*For any* valid chat_widget_mode value, writing it via POST /api/settings and reading it back via GET /api/settings SHALL return the same value, and the response SHALL always include the chat_widget_mode field.

**Validates: Requirements 1.2, 1.5**

---

### Property 2: Absent chat_widget_mode in POST preserves existing value

*For any* chat_widget_mode value already stored in KV, submitting a POST /api/settings request that omits the chat_widget_mode field SHALL leave the stored value unchanged.

**Validates: Requirements 1.3**

---

### Property 3: Mode routing opens the correct panel

*For any* valid chat_widget_mode value, when the widget is initialized with that mode and the bubble is clicked, the correct panel SHALL open and the other SHALL remain hidden.

**Validates: Requirements 3.2, 3.3**

---

### Property 4: Invalid or error mode defaults to live_chat

*For any* unrecognized string or error condition from the Settings_API, the widget SHALL behave as if chat_widget_mode is live_chat.

**Validates: Requirements 3.4**

---

### Property 5: Admin panel pre-selects the stored mode

*For any* chat_widget_mode value returned by GET /api/settings, the matching radio button SHALL be checked and the other SHALL be unchecked.

**Validates: Requirements 2.3**

---

### Property 6: Admin form submission includes the selected mode

*For any* radio button selection, the POST body SHALL contain a chat_widget_mode field equal to the selected value.

**Validates: Requirements 2.4**

---

### Property 7: Panel toggle produces correct icon state

*For any* initial panel state, toggling the Contact_Form_Panel SHALL flip the bubble icon: open produces the X icon, closed produces the chat icon. Toggling twice returns to the original icon.

**Validates: Requirements 4.3, 6.1, 6.2**

---

### Property 8: Email validation correctly classifies addresses

*For any* string input to the email field, validateEmail SHALL return true for valid email patterns and false otherwise. When false, the form SHALL not be submitted.

**Validates: Requirements 5.1, 5.2**

---

### Property 9: Empty or whitespace-only message is rejected

*For any* string composed entirely of whitespace in the message field, the form SHALL not submit and SHALL display an inline error.

**Validates: Requirements 5.3**

---

### Property 10: Submit button disabled during in-progress submission

*For any* valid form state triggering a submission, the submit button SHALL be disabled for the entire duration of the in-flight API call and re-enabled after completion.

**Validates: Requirements 5.7**

---

### Property 11: Mode isolation prevents cross-panel initialization

*For any* chat_widget_mode value, the widget SHALL initialize only the components for that mode: contact_form mode results in zero live chat sessions and zero polling timers; live_chat mode results in the Contact_Form_Panel not being present in the DOM.

**Validates: Requirements 7.1, 7.2**

---

### Property 12: Panels do not share state

*For any* sequence of interactions with the Contact_Form_Panel, the Chat_Panel session ID, message history, and polling state SHALL remain unaffected, and vice versa.

**Validates: Requirements 7.3**

---


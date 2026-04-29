# Requirements Document

## Introduction

This feature enhances the existing chat bubble widget (currently fixed in the bottom-right corner of every page) to support two operating modes: **Live Chat** (the current behavior) and **Contact Form** (a modal overlay containing the existing contact form). An admin toggle in the Settings panel controls which mode is active. When Contact Form mode is active, clicking the chat bubble opens a floating contact form panel instead of the live chat panel. The contact form panel includes a close button, mirrors the fields from the existing `/contact` page, and submits to the same `/api/inquiries` endpoint. The live chat mode retains all existing behavior unchanged.

## Glossary

- **Widget**: The fixed-position chat bubble button rendered on every public-facing page via `createLayout()` in `src/pages/layout.js`.
- **Chat_Panel**: The existing live chat overlay panel (`#chat-panel`) that opens when the Widget is clicked in Live Chat mode.
- **Contact_Form_Panel**: The new floating modal panel containing the contact form, shown when the Widget is clicked in Contact Form mode.
- **Widget_Mode**: A setting stored in Cloudflare KV (`website_settings`) under the key `chat_widget_mode`. Accepted values: `"live_chat"` (default) or `"contact_form"`.
- **Settings_API**: The `/api/settings` endpoint handled by `src/api/handlers/settings.js`.
- **Admin_Panel**: The admin dashboard at `src/pages/admin-dashboard.js`, specifically the Settings tab.
- **Contact_Form**: The HTML form with fields: Name (optional), Email (required), Phone (optional), Message (required), submitting to `POST /api/inquiries`.
- **Inquiries_API**: The existing `POST /api/inquiries` endpoint that receives contact form submissions.

---

## Requirements

### Requirement 1: Widget Mode Setting Storage

**User Story:** As an admin, I want to configure whether the chat bubble opens a live chat or a contact form, so that I can choose the most appropriate visitor engagement method for the current business period.

#### Acceptance Criteria

1. THE Settings_API SHALL accept a `chat_widget_mode` field with values `"live_chat"` or `"contact_form"` when processing a POST request to `/api/settings`.
2. THE Settings_API SHALL persist the `chat_widget_mode` value in the `website_settings` Cloudflare KV entry alongside existing settings fields.
3. WHEN the `chat_widget_mode` field is absent from a POST request to `/api/settings`, THE Settings_API SHALL preserve the existing `chat_widget_mode` value already stored in KV.
4. WHEN no `chat_widget_mode` value has ever been stored, THE Settings_API SHALL return `"live_chat"` as the default value in GET responses.
5. THE Settings_API SHALL include the `chat_widget_mode` field in every GET `/api/settings` response.

---

### Requirement 2: Admin Panel Toggle Control

**User Story:** As an admin, I want a clearly labeled toggle in the Settings tab of the admin panel, so that I can switch the Widget_Mode without editing configuration files or making API calls manually.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a "Chat Widget Mode" control in the Settings tab, within the existing settings form.
2. THE Admin_Panel SHALL render the "Chat Widget Mode" control as a radio button group or select element with exactly two options: "Live Chat" and "Contact Form".
3. WHEN the Settings tab is loaded, THE Admin_Panel SHALL fetch the current `chat_widget_mode` value from GET `/api/settings` and pre-select the matching option.
4. WHEN the admin submits the settings form, THE Admin_Panel SHALL include the selected `chat_widget_mode` value in the POST `/api/settings` request body.
5. WHEN the settings form is submitted successfully, THE Admin_Panel SHALL display a success notification confirming the settings were saved.
6. WHEN the settings form submission fails, THE Admin_Panel SHALL display an error notification and retain the previously selected option.

---

### Requirement 3: Widget Mode Delivery to Public Pages

**User Story:** As a site visitor, I want the chat bubble to behave according to the admin's current configuration, so that I always reach the correct contact channel.

#### Acceptance Criteria

1. WHEN a public page is rendered via `createLayout()`, THE Widget SHALL read the `chat_widget_mode` value from the GET `/api/settings` response on page load.
2. WHEN `chat_widget_mode` is `"live_chat"`, THE Widget SHALL open the Chat_Panel when clicked, preserving all existing live chat behavior.
3. WHEN `chat_widget_mode` is `"contact_form"`, THE Widget SHALL open the Contact_Form_Panel when clicked instead of the Chat_Panel.
4. WHEN the Settings_API returns an error or an unrecognized `chat_widget_mode` value, THE Widget SHALL default to `"live_chat"` behavior.

---

### Requirement 4: Contact Form Panel UI

**User Story:** As a site visitor, I want a floating contact form panel that I can open and close from the chat bubble, so that I can send a message without navigating away from the current page.

#### Acceptance Criteria

1. THE Contact_Form_Panel SHALL be positioned fixed in the bottom-right corner of the viewport, above the Widget button, matching the visual placement of the existing Chat_Panel.
2. THE Contact_Form_Panel SHALL contain a header bar with a title (e.g., "Send us a message") and a close button (✕).
3. WHEN the close button is clicked, THE Contact_Form_Panel SHALL hide and the Widget button SHALL return to its default chat bubble icon.
4. THE Contact_Form_Panel SHALL contain the following fields: Name (text, optional), Email (email, required), Phone (tel, optional), Message (textarea, required).
5. THE Contact_Form_Panel SHALL display a submit button labeled "Send Message".
6. THE Contact_Form_Panel SHALL be visually consistent with the existing Chat_Panel, using the same border-radius, box-shadow, header background color, and font styles defined in `createLayout()`.
7. THE Contact_Form_Panel SHALL be responsive: on viewports narrower than 480px, THE Contact_Form_Panel SHALL expand to fill the available width minus 16px margins, matching the existing Chat_Panel mobile behavior.

---

### Requirement 5: Contact Form Panel Submission

**User Story:** As a site visitor, I want to submit the contact form from the floating panel and receive clear feedback, so that I know my message was sent successfully.

#### Acceptance Criteria

1. WHEN the visitor submits the Contact_Form_Panel form, THE Contact_Form_Panel SHALL validate that the Email field contains a properly formatted email address before sending.
2. WHEN the Email field is empty or invalid on submission, THE Contact_Form_Panel SHALL display an inline error message and SHALL NOT submit the form to the Inquiries_API.
3. WHEN the Message field is empty on submission, THE Contact_Form_Panel SHALL display an inline error message and SHALL NOT submit the form to the Inquiries_API.
4. WHEN all required fields are valid, THE Contact_Form_Panel SHALL POST the form data (name, email, phone, message) to `POST /api/inquiries`.
5. WHEN the Inquiries_API returns a success response, THE Contact_Form_Panel SHALL display a success message to the visitor and SHALL reset all form fields.
6. WHEN the Inquiries_API returns an error response, THE Contact_Form_Panel SHALL display an error message and SHALL retain the visitor's entered data so they can retry.
7. WHILE a form submission is in progress, THE Contact_Form_Panel SHALL disable the submit button to prevent duplicate submissions.

---

### Requirement 6: Widget Icon State

**User Story:** As a site visitor, I want the chat bubble icon to reflect the current panel state, so that I can tell at a glance whether the panel is open or closed.

#### Acceptance Criteria

1. WHEN the Contact_Form_Panel is closed, THE Widget SHALL display the default chat bubble icon (💬).
2. WHEN the Contact_Form_Panel is open, THE Widget SHALL display a close icon (✕) to indicate that clicking will close the panel.
3. WHEN `chat_widget_mode` is `"live_chat"`, THE Widget icon state behavior SHALL remain unchanged from the existing implementation.

---

### Requirement 7: Mode Isolation

**User Story:** As a developer, I want the live chat and contact form modes to be fully isolated, so that switching modes does not cause unintended side effects.

#### Acceptance Criteria

1. WHEN `chat_widget_mode` is `"contact_form"`, THE Widget SHALL NOT initialize a live chat session, SHALL NOT start polling for chat messages, and SHALL NOT render the Chat_Panel.
2. WHEN `chat_widget_mode` is `"live_chat"`, THE Widget SHALL NOT render the Contact_Form_Panel.
3. THE Contact_Form_Panel SHALL NOT share state (session IDs, message history, or polling timers) with the Chat_Panel.

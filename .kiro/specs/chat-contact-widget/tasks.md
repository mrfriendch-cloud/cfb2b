# Implementation Plan: Chat Contact Widget

## Overview

Extend the existing chat bubble widget to support two operating modes — Live Chat (existing) and Contact Form (new) — controlled by an admin toggle in the Settings tab. The implementation touches three layers: the Settings API, the Admin Panel, and the public layout widget.

## Tasks

- [x] 1. Extend Settings API to support `chat_widget_mode`
  - Modify `src/api/handlers/settings.js` `getSettings()` to include `chat_widget_mode` in the response, defaulting to `"live_chat"` when absent from KV
  - Modify `updateSettings()` to read the existing KV value before constructing the new settings object, so that an absent `chat_widget_mode` in the POST body preserves the stored value rather than being overwritten
  - Add `chat_widget_mode` to the settings object written to KV when it is present in the POST body
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]\* 1.1 Write property test for Settings round-trip (Property 1)
    - **Property 1: Settings round-trip preserves chat_widget_mode**
    - For each valid value (`"live_chat"`, `"contact_form"`), POST then GET and assert the returned value matches
    - Assert the GET response always includes the `chat_widget_mode` field
    - **Validates: Requirements 1.2, 1.5**

  - [ ]\* 1.2 Write property test for absent field preservation (Property 2)
    - **Property 2: Absent chat_widget_mode in POST preserves existing value**
    - Seed KV with a known value, POST settings without `chat_widget_mode`, GET and assert value is unchanged
    - **Validates: Requirements 1.3**

- [x] 2. Add Chat Widget Mode control to Admin Panel Settings tab
  - In `src/pages/admin-dashboard.js`, add a "Chat Widget Mode" radio button group (values `"live_chat"` / `"contact_form"`) inside the existing settings form, after the social media section
  - Update the `loadSettings()` JavaScript function to read `chat_widget_mode` from the GET `/api/settings` response and check the matching radio button
  - Update the settings form submit handler to include the selected `chat_widget_mode` radio value in the POST body
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]\* 2.1 Write property test for admin panel pre-selection (Property 5)
    - **Property 5: Admin panel pre-selects the stored mode**
    - For each valid `chat_widget_mode` value returned by the API, assert the matching radio is checked and the other is unchecked after `loadSettings()` runs
    - **Validates: Requirements 2.3**

  - [ ]\* 2.2 Write property test for admin form submission payload (Property 6)
    - **Property 6: Admin form submission includes the selected mode**
    - For each radio selection, assert the serialized POST body contains `chat_widget_mode` equal to the selected value
    - **Validates: Requirements 2.4**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add Contact Form Panel markup and styles to `createLayout()`
  - In `src/pages/layout.js`, inject the `#contact-form-panel` HTML structure (header with title + ✕ button, form body with Name/Email/Phone/Message fields, submit button, success/error message areas) alongside the existing `#chat-panel` markup
  - Add CSS for `#contact-form-panel` reusing existing CSS variables (`--primary-color`, `border-radius: 1rem`, `box-shadow: 0 8px 32px rgba(0,0,0,0.18)`) and the same mobile breakpoint (`<480px`) as `#chat-panel`
  - The panel is hidden by default (`display: none`)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 5. Implement widget mode routing and `initWidgetMode()` in `createLayout()`
  - Add a module-level `widgetMode` variable (default `"live_chat"`) inside the chat IIFE in `src/pages/layout.js`
  - Add `initWidgetMode(mode)` function: when `"contact_form"`, show `#contact-form-panel` on bubble click and prevent live chat initialization; when `"live_chat"`, remove/hide `#contact-form-panel` and preserve existing behavior
  - Modify `toggleChatPanel()` to check `widgetMode`: if `"contact_form"`, delegate to `toggleContactFormPanel()` instead
  - Extend the existing `loadWebsiteSettings()` call to read `chat_widget_mode` from the settings response and call `initWidgetMode(mode)`, defaulting to `"live_chat"` on error or unrecognized value
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2_

  - [ ]\* 5.1 Write property test for mode routing (Property 3)
    - **Property 3: Mode routing opens the correct panel**
    - For each valid mode, simulate bubble click and assert the correct panel has class `open` and the other does not
    - **Validates: Requirements 3.2, 3.3**

  - [ ]\* 5.2 Write property test for invalid mode fallback (Property 4)
    - **Property 4: Invalid or error mode defaults to live_chat**
    - For unrecognized strings and simulated API errors, assert widget behaves as `"live_chat"`
    - **Validates: Requirements 3.4**

  - [ ]\* 5.3 Write property test for mode isolation (Property 11)
    - **Property 11: Mode isolation prevents cross-panel initialization**
    - In `"contact_form"` mode: assert zero live chat sessions started and zero polling timers active
    - In `"live_chat"` mode: assert `#contact-form-panel` is not present in the DOM
    - **Validates: Requirements 7.1, 7.2**

- [x] 6. Implement `toggleContactFormPanel()` and widget icon state
  - Add `toggleContactFormPanel()` in `src/pages/layout.js`: toggles `open` class on `#contact-form-panel`, updates bubble icon (💬 when closed, ✕ when open), manages focus on open
  - Wire the ✕ button inside `#cfp-header` to call `toggleContactFormPanel()`
  - _Requirements: 4.2, 4.3, 6.1, 6.2, 6.3_

  - [ ]\* 6.1 Write property test for panel toggle icon state (Property 7)
    - **Property 7: Panel toggle produces correct icon state**
    - Assert open state shows ✕ icon; closed state shows 💬 icon; toggling twice returns to original icon
    - **Validates: Requirements 4.3, 6.1, 6.2**

- [x] 7. Implement Contact Form Panel submission logic
  - Add `submitContactForm()` in `src/pages/layout.js` that:
    - Validates Email using the existing `validateEmail()` helper; shows inline error and aborts if invalid or empty
    - Validates Message is non-empty (not whitespace-only); shows inline error and aborts if empty
    - Disables the submit button for the duration of the in-flight `API.post('/inquiries', ...)` call
    - On success: shows `#cfp-success-msg`, resets all form fields, re-enables submit button
    - On error: shows `#cfp-error-msg`, retains entered data, re-enables submit button
  - Wire the form's submit event to `submitContactForm()`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]\* 7.1 Write property test for email validation (Property 8)
    - **Property 8: Email validation correctly classifies addresses**
    - For a range of valid and invalid email strings, assert `validateEmail` returns the correct boolean and the form does not submit when false
    - **Validates: Requirements 5.1, 5.2**

  - [ ]\* 7.2 Write property test for empty/whitespace message rejection (Property 9)
    - **Property 9: Empty or whitespace-only message is rejected**
    - For strings composed entirely of whitespace, assert the form does not submit and an inline error is shown
    - **Validates: Requirements 5.3**

  - [ ]\* 7.3 Write property test for submit button disabled during submission (Property 10)
    - **Property 10: Submit button disabled during in-progress submission**
    - For any valid form state, assert the submit button is disabled while the API call is in-flight and re-enabled after completion (success or error)
    - **Validates: Requirements 5.7**

- [x] 8. Verify panel state isolation
  - Add a guard in the contact form panel's state (form fields, success/error messages) so it does not read from or write to the live chat IIFE's variables (`chatSessionId`, `lastMsgId`, `pollTimer`, etc.)
  - Confirm the live chat IIFE's state is unaffected by any contact form interaction
  - _Requirements: 7.3_

  - [ ]\* 8.1 Write property test for panel state isolation (Property 12)
    - **Property 12: Panels do not share state**
    - For any sequence of contact form interactions, assert chat session ID, message history, and polling state remain unchanged, and vice versa
    - **Validates: Requirements 7.3**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The implementation reuses existing CSS variables, `API` helper, `showNotification`, and `validateEmail` — no new dependencies are introduced

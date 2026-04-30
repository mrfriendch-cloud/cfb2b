/**
 * renderMarkdown(text)
 *
 * Converts a Markdown string to sanitized HTML using marked.js and DOMPurify.
 * Both libraries are expected to be available as globals (loaded from CDN in the browser).
 *
 * Returns null for empty / whitespace-only input so callers can show a fallback message.
 * Returns a sanitized HTML string otherwise.
 *
 * This module is extracted from product-detail.js to allow unit and property-based testing.
 */

/* global marked, DOMPurify */

/**
 * @param {string|null|undefined} text - Raw Markdown source text.
 * @returns {string|null} Sanitized HTML string, or null if input is empty/whitespace.
 */
function renderMarkdown(text) {
  if (!text || text.trim() === "") return null;
  try {
    const rawHtml = marked.parse(text);
    return DOMPurify.sanitize(rawHtml);
  } catch (_err) {
    return null;
  }
}

// Export for Node.js / test environments.
// In the browser the function is used as a global defined in the inline <script> block.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderMarkdown };
}

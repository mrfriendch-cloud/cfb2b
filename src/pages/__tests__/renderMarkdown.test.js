/**
 * Property-based and unit tests for renderMarkdown()
 *
 * renderMarkdown() is a pure function defined in src/utils/renderMarkdown.js.
 * It depends on `marked` and `DOMPurify` as globals (CDN libraries in the browser).
 * In this test environment we provide lightweight stand-ins so the module can be
 * exercised without a real browser.
 *
 * Property tests use fast-check (https://fast-check.dev/).
 * Minimum 100 runs per property as specified in the design document.
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Browser-global shims for marked and DOMPurify
// ---------------------------------------------------------------------------
// These shims are intentionally minimal — they replicate the contracts that
// renderMarkdown() relies on:
//   • marked.parse(text)  → returns an HTML string
//   • DOMPurify.sanitize(html) → returns a sanitized HTML string
//
// The real libraries are loaded from CDN in the browser; the shims let us
// test the renderMarkdown() logic in Node without bundling the CDN scripts.

import { marked } from "marked"; // available via vitest's node environment
import DOMPurify from "dompurify"; // available via jsdom / happy-dom

// ---------------------------------------------------------------------------
// NOTE: marked and DOMPurify are NOT added to package.json as runtime deps.
// They are only used here as test-environment shims.  The actual browser page
// loads them from CDN.  If this import fails, install them as devDependencies:
//   npm install --save-dev marked dompurify jsdom
// ---------------------------------------------------------------------------

// Expose as globals so renderMarkdown.js can find them (it uses `marked` and
// `DOMPurify` as bare globals, matching the browser CDN usage).
globalThis.marked = marked;
globalThis.DOMPurify = DOMPurify;

// Now import the module under test (after globals are set).
// Using a dynamic import inside beforeAll ensures globals are in place first.
let renderMarkdown;
beforeAll(async () => {
  const mod = await import("../../utils/renderMarkdown.js");
  renderMarkdown = mod.renderMarkdown;
});

// ---------------------------------------------------------------------------
// Scaffold — structure verification
// ---------------------------------------------------------------------------

describe("renderMarkdown — module structure", () => {
  it("exports a renderMarkdown function", () => {
    // This test confirms the module is importable and exports the expected API.
    // Full behavioural tests follow in the property-based sections below.
    expect(typeof renderMarkdown).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Property 1 — Markdown render round-trip produces valid HTML
// Feature: product-markdown-description, Property 1: Markdown render round-trip produces valid HTML
// Validates: Requirements 1.1, 4.2
// ---------------------------------------------------------------------------

describe("Property 1: Markdown render round-trip produces valid HTML", () => {
  it("returns a non-null, non-empty string for any non-empty Markdown input", () => {
    // Feature: product-markdown-description, Property 1: Markdown render round-trip produces valid HTML
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (mdText) => {
          const result = renderMarkdown(mdText);
          return result !== null && result.length > 0;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2 — Empty and whitespace-only input returns null
// Feature: product-markdown-description, Property 2: Empty and whitespace-only input returns null
// Validates: Requirements 1.3
// ---------------------------------------------------------------------------

describe("Property 2: Empty and whitespace-only input returns null", () => {
  it("returns null for any string composed entirely of whitespace characters", () => {
    // Feature: product-markdown-description, Property 2: Empty and whitespace-only input returns null
    fc.assert(
      fc.property(
        fc
          .array(fc.constantFrom(" ", "\t", "\n", "\r"))
          .map((chars) => chars.join("")),
        (wsText) => {
          return renderMarkdown(wsText) === null;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns null for null input", () => {
    expect(renderMarkdown(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(renderMarkdown(undefined)).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(renderMarkdown("")).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Property 3 — XSS payloads are stripped from rendered output
// Feature: product-markdown-description, Property 3: XSS payloads are stripped from rendered output
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe("Property 3: XSS payloads are stripped from rendered output", () => {
  it("does not include known XSS vectors as executable HTML in the sanitized output", () => {
    // Feature: product-markdown-description, Property 3: XSS payloads are stripped from rendered output
    //
    // We check that the sanitized output, when parsed as a DOM, contains no
    // elements with dangerous attributes or tag types. This correctly handles
    // the case where marked.parse() HTML-encodes the payload as text content
    // (which is safe) vs. when it passes it through as raw HTML (which DOMPurify
    // must strip).
    const xssPayloads = [
      "<script>alert(1)</script>",
      '<img onerror="alert(1)" src="x">',
      '<a href="javascript:alert(1)">click</a>',
      '<iframe src="evil.com"></iframe>',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...xssPayloads),
        fc.string(),
        (payload, surrounding) => {
          const result =
            renderMarkdown(surrounding + payload + surrounding) ?? "";

          // Parse the sanitized HTML into a DOM and check for dangerous nodes.
          // This avoids false positives from HTML-encoded text content like
          // &lt;script&gt; which is safe but contains the substring "<script".
          const doc = new DOMParser().parseFromString(result, "text/html");

          // No <script> elements
          if (doc.querySelectorAll("script").length > 0) return false;
          // No <iframe> elements
          if (doc.querySelectorAll("iframe").length > 0) return false;
          // No elements with event handler attributes (onerror, onclick, etc.)
          const allElements = doc.querySelectorAll("*");
          for (const el of allElements) {
            for (const attr of el.attributes) {
              if (attr.name.startsWith("on")) return false;
            }
            // No javascript: hrefs
            if (
              el.hasAttribute("href") &&
              el
                .getAttribute("href")
                .trim()
                .toLowerCase()
                .startsWith("javascript:")
            ) {
              return false;
            }
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});

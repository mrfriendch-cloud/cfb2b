import { URLManager } from "./url-manager.js";

/**
 * Basic tests for URLManager slug generation and canonical URL generation
 * Note: Database operations (slugExists, saveProductSlug, etc.) will be tested in task 4.2
 */

describe("URLManager", () => {
  let urlManager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      BASE_URL: "https://example.com",
      DB: null, // DB will be needed for task 4.2
    };
    urlManager = new URLManager(mockEnv);
  });

  describe("generateSlug", () => {
    test("converts text to lowercase", () => {
      const result = urlManager.generateSlug("Test Product Name");
      expect(result).toBe("test-product-name");
    });

    test("replaces spaces with hyphens", () => {
      const result = urlManager.generateSlug("Product With Spaces");
      expect(result).toBe("product-with-spaces");
    });

    test("replaces underscores with hyphens", () => {
      const result = urlManager.generateSlug("Product_With_Underscores");
      expect(result).toBe("product-with-underscores");
    });

    test("removes special characters except hyphens", () => {
      const result = urlManager.generateSlug("Product @ Special! Chars#");
      expect(result).toBe("product-special-chars");
    });

    test("removes leading and trailing hyphens", () => {
      const result = urlManager.generateSlug("---Product---");
      expect(result).toBe("product");
    });

    test("enforces 75 character maximum length", () => {
      const longName = "a".repeat(100);
      const result = urlManager.generateSlug(longName);
      expect(result.length).toBeLessThanOrEqual(75);
    });

    test("truncates at word boundary when exceeding max length", () => {
      const longName =
        "super-long-product-name-with-many-words-that-exceeds-the-maximum-length-limit-set-at-75-characters";
      const result = urlManager.generateSlug(longName);
      expect(result.length).toBeLessThanOrEqual(75);
      expect(result.endsWith("-")).toBe(false); // Should not end with hyphen
    });

    test("handles empty string", () => {
      const result = urlManager.generateSlug("");
      expect(result).toBe("");
    });

    test("handles null input", () => {
      const result = urlManager.generateSlug(null);
      expect(result).toBe("");
    });

    test("handles consecutive spaces", () => {
      const result = urlManager.generateSlug(
        "Product    With    Many    Spaces",
      );
      expect(result).toBe("product-with-many-spaces");
    });

    test("combines multiple transformations correctly", () => {
      const result = urlManager.generateSlug(
        "  High-Quality Product @ $99.99!  ",
      );
      expect(result).toBe("high-quality-product-9999");
    });
  });

  describe("generateCanonicalUrl", () => {
    test("generates absolute HTTPS URL from path", () => {
      const result = urlManager.generateCanonicalUrl("/products/123");
      expect(result).toBe("https://example.com/products/123");
    });

    test("adds leading slash if missing", () => {
      const result = urlManager.generateCanonicalUrl("products/456");
      expect(result).toBe("https://example.com/products/456");
    });

    test("uses BASE_URL from env", () => {
      const result = urlManager.generateCanonicalUrl("/home");
      expect(result).toContain("example.com");
    });

    test("uses default BASE_URL when not configured", () => {
      const urlManagerNoBase = new URLManager({ DB: null });
      const result = urlManagerNoBase.generateCanonicalUrl("/test");
      expect(result).toBe("https://yourdomain.com/test");
    });

    test("handles root path", () => {
      const result = urlManager.generateCanonicalUrl("/");
      expect(result).toBe("https://example.com/");
    });

    test("preserves complex paths", () => {
      const result = urlManager.generateCanonicalUrl(
        "/products/electronics/laptops",
      );
      expect(result).toBe("https://example.com/products/electronics/laptops");
    });
  });

  describe("constructor", () => {
    test("stores env and db references", () => {
      expect(urlManager.env).toBe(mockEnv);
      expect(urlManager.db).toBe(mockEnv.DB);
    });

    test("sets baseUrl from env.BASE_URL", () => {
      expect(urlManager.baseUrl).toBe("https://example.com");
    });

    test("uses default baseUrl when BASE_URL not provided", () => {
      const urlManagerNoBase = new URLManager({ DB: null });
      expect(urlManagerNoBase.baseUrl).toBe("https://yourdomain.com");
    });
  });

  describe("_escapeHtml", () => {
    test("escapes ampersand", () => {
      const result = urlManager._escapeHtml("Tom & Jerry");
      expect(result).toBe("Tom &amp; Jerry");
    });

    test("escapes less-than symbol", () => {
      const result = urlManager._escapeHtml("<script>");
      expect(result).toBe("&lt;script&gt;");
    });

    test("escapes greater-than symbol", () => {
      const result = urlManager._escapeHtml("5 > 3");
      expect(result).toBe("5 &gt; 3");
    });

    test("escapes double quotes", () => {
      const result = urlManager._escapeHtml('Product "Premium"');
      expect(result).toBe("Product &quot;Premium&quot;");
    });

    test("escapes single quotes", () => {
      const result = urlManager._escapeHtml("it's a product");
      expect(result).toBe("it&#039;s a product");
    });

    test("escapes all special characters in combination", () => {
      const result = urlManager._escapeHtml(
        '<script>alert("XSS & Injection\'s")</script>',
      );
      expect(result).toBe(
        "&lt;script&gt;alert(&quot;XSS &amp; Injection&#039;s&quot;)&lt;/script&gt;",
      );
    });

    test("handles empty string", () => {
      const result = urlManager._escapeHtml("");
      expect(result).toBe("");
    });

    test("handles null input", () => {
      const result = urlManager._escapeHtml(null);
      expect(result).toBe("");
    });

    test("handles text with no special characters", () => {
      const result = urlManager._escapeHtml("Normal text");
      expect(result).toBe("Normal text");
    });
  });
});

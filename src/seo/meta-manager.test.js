/**
 * Unit tests for MetaTagManager
 */

import { MetaTagManager } from "./meta-manager.js";

// Mock environment
const mockEnv = {
  IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test",
};

describe("MetaTagManager", () => {
  let manager;

  beforeEach(() => {
    manager = new MetaTagManager(mockEnv);
  });

  describe("generateMetaTags", () => {
    test("generates basic meta tags correctly", () => {
      const result = manager.generateMetaTags({
        title: "Test Product Page",
        description: "This is a test product description for SEO purposes.",
        canonicalUrl: "https://example.com/products/test",
        pageType: "website",
      });

      expect(result).toContain("<title>Test Product Page</title>");
      expect(result).toContain(
        '<meta name="description" content="This is a test product description for SEO purposes.">',
      );
      expect(result).toContain(
        '<link rel="canonical" href="https://example.com/products/test">',
      );
      expect(result).toContain('<meta name="robots" content="index, follow">');
    });

    test("generates Open Graph tags", () => {
      const result = manager.generateMetaTags({
        title: "Test Product",
        description: "Test description",
        canonicalUrl: "https://example.com/products/test",
        imageUrl: "https://ik.imagekit.io/test/product.jpg",
        pageType: "product",
      });

      expect(result).toContain(
        '<meta property="og:title" content="Test Product">',
      );
      expect(result).toContain(
        '<meta property="og:description" content="Test description">',
      );
      expect(result).toContain(
        '<meta property="og:url" content="https://example.com/products/test">',
      );
      expect(result).toContain('<meta property="og:type" content="product">');
      expect(result).toContain('<meta property="og:image"');
      expect(result).toContain(
        '<meta property="og:image:width" content="1200">',
      );
      expect(result).toContain(
        '<meta property="og:image:height" content="630">',
      );
    });

    test("generates Twitter Card tags for product pages", () => {
      const result = manager.generateMetaTags({
        title: "Test Product",
        description: "Test description",
        canonicalUrl: "https://example.com/products/test",
        imageUrl: "https://ik.imagekit.io/test/product.jpg",
        pageType: "product",
        product: { name: "Test Product", id: 1 },
      });

      expect(result).toContain(
        '<meta name="twitter:card" content="summary_large_image">',
      );
      expect(result).toContain(
        '<meta name="twitter:title" content="Test Product">',
      );
      expect(result).toContain(
        '<meta name="twitter:description" content="Test description">',
      );
      expect(result).toContain('<meta name="twitter:image"');
    });

    test("does not generate Twitter Card tags for non-product pages", () => {
      const result = manager.generateMetaTags({
        title: "Homepage",
        description: "Test description",
        canonicalUrl: "https://example.com/",
        pageType: "website",
      });

      expect(result).not.toContain("twitter:card");
    });
  });

  describe("_validateTitle", () => {
    test("returns title unchanged if within 50-60 char limit", () => {
      const title = "This is a good title length";
      expect(manager._validateTitle(title)).toBe(title);
    });

    test('truncates title longer than 60 chars to 57 + "..."', () => {
      const longTitle =
        "This is a very long title that exceeds the sixty character limit for SEO optimization";
      const result = manager._validateTitle(longTitle);

      expect(result.length).toBe(60); // 57 chars + "..." = 60
      expect(result).toBe(longTitle.substring(0, 57) + "...");
      expect(result.endsWith("...")).toBe(true);
    });

    test("returns default title if no title provided", () => {
      expect(manager._validateTitle("")).toBe("B2B Product Exhibition");
      expect(manager._validateTitle(null)).toBe("B2B Product Exhibition");
      expect(manager._validateTitle(undefined)).toBe("B2B Product Exhibition");
    });
  });

  describe("_validateDescription", () => {
    test("returns description unchanged if within 150-160 char limit", () => {
      const desc =
        "This is a good description that provides useful information about the product and stays within the recommended character limit.";
      expect(manager._validateDescription(desc)).toBe(desc);
    });

    test('truncates description longer than 160 chars to 157 + "..."', () => {
      const longDesc =
        "This is a very long description that significantly exceeds the one hundred sixty character limit for meta descriptions and needs to be truncated properly for optimal SEO performance and display in search results.";
      const result = manager._validateDescription(longDesc);

      expect(result.length).toBe(160); // 157 chars + "..." = 160
      expect(result.endsWith("...")).toBe(true);
    });

    test("returns default description if no description provided", () => {
      const defaultDesc =
        "High-quality industrial products and B2B solutions for businesses worldwide.";
      expect(manager._validateDescription("")).toBe(defaultDesc);
      expect(manager._validateDescription(null)).toBe(defaultDesc);
      expect(manager._validateDescription(undefined)).toBe(defaultDesc);
    });
  });

  describe("_escapeHtml", () => {
    test("escapes HTML special characters", () => {
      const text = '<script>alert("XSS")</script> & "quotes" \'apostrophes\'';
      const escaped = manager._escapeHtml(text);

      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; &#039;apostrophes&#039;",
      );
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
      expect(escaped).not.toContain('&"');
    });

    test("escapes ampersands correctly", () => {
      expect(manager._escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    test("escapes quotes for attribute safety", () => {
      expect(manager._escapeHtml('He said "hello"')).toBe(
        "He said &quot;hello&quot;",
      );
      expect(manager._escapeHtml("It's working")).toBe("It&#039;s working");
    });
  });

  describe("_getOptimizedImageUrl", () => {
    test("adds ImageKit transformations to valid ImageKit URL", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = manager._getOptimizedImageUrl(
        url,
        "w-1200,h-630,c-at_max",
      );

      // URL encoding converts commas to %2C which is correct
      expect(result).toContain("tr=w-1200");
      expect(result).toContain("ik.imagekit.io");
      expect(result).toContain("product.jpg");
    });

    test("returns original URL if not an ImageKit URL", () => {
      const url = "https://example.com/image.jpg";
      const result = manager._getOptimizedImageUrl(
        url,
        "w-1200,h-630,c-at_max",
      );

      expect(result).toBe(url);
    });

    test("returns original URL if URL is null or undefined", () => {
      expect(manager._getOptimizedImageUrl(null, "w-1200")).toBe(null);
      expect(manager._getOptimizedImageUrl(undefined, "w-1200")).toBe(
        undefined,
      );
    });

    test("handles invalid URLs gracefully", () => {
      const invalidUrl = "not-a-valid-url";
      const result = manager._getOptimizedImageUrl(invalidUrl, "w-1200");

      expect(result).toBe(invalidUrl);
    });
  });
});

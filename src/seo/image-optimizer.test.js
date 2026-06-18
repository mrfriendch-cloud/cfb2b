/**
 * Unit tests for ImageOptimizer
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 21.1, 21.2, 21.3, 21.4
 */

import { ImageOptimizer } from "./image-optimizer.js";

// Mock environment
const mockEnv = {
  IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test",
};

describe("ImageOptimizer", () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new ImageOptimizer(mockEnv);
  });

  describe("generateImageTag", () => {
    test("generates basic image tag with required attributes", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        width: 600,
        height: 400,
      });

      expect(result).toContain("<img");
      expect(result).toContain('alt="High-quality industrial product"');
      expect(result).toContain("width");
      expect(result).toContain("height");
    });

    test("includes lazy loading for below-fold images", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        lazy: true,
        aboveFold: false,
      });

      expect(result).toContain('loading="lazy"');
      expect(result).not.toContain('loading="eager"');
    });

    test("omits lazy loading and uses eager for above-fold images", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        aboveFold: true,
      });

      expect(result).toContain('loading="eager"');
    });

    test("includes title attribute when provided", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        title: "Premium stainless steel industrial equipment for manufacturing",
      });

      expect(result).toContain("title=");
      expect(result).toContain(
        "Premium stainless steel industrial equipment for manufacturing",
      );
    });

    test("includes srcset for responsive images", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        width: 600,
      });

      expect(result).toContain("srcset=");
      expect(result).toContain("1x");
      expect(result).toContain("2x");
      expect(result).toContain("3x");
    });

    test("includes sizes attribute when provided", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        sizes: "(max-width: 600px) 100vw, 600px",
      });

      expect(result).toContain("sizes=");
      expect(result).toContain("(max-width: 600px) 100vw, 600px");
    });

    test("escapes HTML in alt text", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: 'Product with "quotes" & <special> characters',
      });

      expect(result).toContain("&quot;");
      expect(result).toContain("&amp;");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
      expect(result).not.toContain('<img alt="Product with "quotes"');
    });

    test("does not add loading attribute when lazy=false", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "High-quality industrial product",
        lazy: false,
        aboveFold: false,
      });

      expect(result).not.toContain("loading=");
    });
  });

  describe("_validateAltText", () => {
    test("validates alt text between 10 and 125 characters", () => {
      const goodAlt = "High-quality industrial manufacturing equipment";
      const result = optimizer._validateAltText(goodAlt);

      expect(result).toBe(goodAlt);
      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(result.length).toBeLessThanOrEqual(125);
    });

    test("returns fallback for alt text shorter than 10 characters", () => {
      expect(optimizer._validateAltText("short")).toBe("Product image");
      expect(optimizer._validateAltText("")).toBe("Product image");
      expect(optimizer._validateAltText(null)).toBe("Product image");
      expect(optimizer._validateAltText(undefined)).toBe("Product image");
      expect(optimizer._validateAltText("tiny")).toBe("Product image");
    });

    test("truncates alt text longer than 125 characters", () => {
      const longAlt =
        "This is an extremely long and detailed description of a high-quality industrial manufacturing equipment product that far exceeds the recommended character limit and should be truncated properly";
      const result = optimizer._validateAltText(longAlt);

      expect(result.length).toBe(125); // 122 chars + "..." = 125
      expect(result.endsWith("...")).toBe(true);
      expect(result).toBe(longAlt.substring(0, 122) + "...");
    });

    test("rejects placeholder text 'image' and uses fallback", () => {
      expect(optimizer._validateAltText("image")).toBe("Product image");
      expect(optimizer._validateAltText("Image")).toBe("Product image");
      expect(optimizer._validateAltText("IMAGE")).toBe("Product image");
    });

    test("rejects placeholder text 'photo' and uses fallback", () => {
      expect(optimizer._validateAltText("photo")).toBe("Product image");
      expect(optimizer._validateAltText("Photo")).toBe("Product image");
      expect(optimizer._validateAltText("PHOTO")).toBe("Product image");
    });

    test("rejects placeholder text 'picture' and uses fallback", () => {
      expect(optimizer._validateAltText("picture")).toBe("Product image");
      expect(optimizer._validateAltText("Picture")).toBe("Product image");
      expect(optimizer._validateAltText("PICTURE")).toBe("Product image");
    });

    test("allows alt text containing but not exactly matching placeholder words", () => {
      const result = optimizer._validateAltText(
        "Product image of industrial equipment",
      );
      expect(result).toBe("Product image of industrial equipment");

      const result2 = optimizer._validateAltText("Photo of manufacturing");
      expect(result2).toBe("Photo of manufacturing");
    });
  });

  describe("_validateTitle", () => {
    test("returns null if title is too short (< 20 chars)", () => {
      expect(optimizer._validateTitle("short")).toBeNull();
      expect(optimizer._validateTitle("")).toBeNull();
      expect(optimizer._validateTitle(null)).toBeNull();
      expect(optimizer._validateTitle(undefined)).toBeNull();
    });

    test("validates title between 20 and 150 characters", () => {
      const goodTitle = "Premium industrial manufacturing equipment details";
      const result = optimizer._validateTitle(goodTitle);

      expect(result).toBe(goodTitle);
      expect(result.length).toBeGreaterThanOrEqual(20);
      expect(result.length).toBeLessThanOrEqual(150);
    });

    test("truncates title longer than 150 characters", () => {
      const longTitle =
        "This is an extremely long title that provides detailed information about a premium industrial manufacturing equipment product that significantly exceeds the recommended maximum character limit";
      const result = optimizer._validateTitle(longTitle);

      expect(result.length).toBe(150); // 147 chars + "..." = 150
      expect(result.endsWith("...")).toBe(true);
      expect(result).toBe(longTitle.substring(0, 147) + "...");
    });

    test("returns null for titles with exactly 19 characters", () => {
      const shortTitle = "Title with 19 chars"; // exactly 19 chars
      expect(optimizer._validateTitle(shortTitle)).toBeNull();
    });

    test("returns title for exactly 20 characters", () => {
      const twentyChars = "Title with 20 chars!"; // exactly 20 chars
      const result = optimizer._validateTitle(twentyChars);
      expect(result).toBe(twentyChars);
    });
  });

  describe("_getOptimizedUrl", () => {
    test("adds ImageKit transformations with width and height", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._getOptimizedUrl(url, 600, 400);

      expect(result).toContain("ik.imagekit.io");
      expect(result).toContain("tr=");
      expect(result).toContain("w-600");
      expect(result).toContain("h-400");
      expect(result).toContain("f-auto"); // Auto format
      expect(result).toContain("q-auto"); // Auto quality
      expect(result).toContain("c-at_max"); // Fit within dimensions
    });

    test("adds transformations with only width", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._getOptimizedUrl(url, 800);

      expect(result).toContain("w-800");
      expect(result).toContain("f-auto");
      expect(result).toContain("q-auto");
    });

    test("adds transformations with only height", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._getOptimizedUrl(url, undefined, 600);

      expect(result).toContain("h-600");
      expect(result).toContain("f-auto");
    });

    test("returns original URL if not an ImageKit URL", () => {
      const url = "https://example.com/image.jpg";
      const result = optimizer._getOptimizedUrl(url, 600, 400);

      expect(result).toBe(url);
    });

    test("returns original URL if URL is null or undefined", () => {
      expect(optimizer._getOptimizedUrl(null, 600, 400)).toBe(null);
      expect(optimizer._getOptimizedUrl(undefined, 600, 400)).toBe(undefined);
    });

    test("handles invalid URLs gracefully", () => {
      const invalidUrl = "not-a-valid-url";
      const result = optimizer._getOptimizedUrl(invalidUrl, 600, 400);

      expect(result).toBe(invalidUrl);
    });

    test("always includes f-auto, q-auto, and c-at_max transformations", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._getOptimizedUrl(url);

      expect(result).toContain("f-auto");
      expect(result).toContain("q-auto");
      expect(result).toContain("c-at_max");
    });
  });

  describe("_generateSrcset", () => {
    test("generates srcset with 1x, 2x, 3x resolutions", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._generateSrcset(url, 600);

      expect(result).toContain("1x");
      expect(result).toContain("2x");
      expect(result).toContain("3x");
      expect(result.split(",").length).toBe(3); // Three comma-separated entries
    });

    test("generates srcset with correct width multipliers", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._generateSrcset(url, 600);

      expect(result).toContain("w-600");
      expect(result).toContain("w-1200"); // 600 * 2
      expect(result).toContain("w-1800"); // 600 * 3
    });

    test("returns null if URL is not ImageKit URL", () => {
      const url = "https://example.com/image.jpg";
      const result = optimizer._generateSrcset(url, 600);

      expect(result).toBeNull();
    });

    test("returns null if no base width provided", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      expect(optimizer._generateSrcset(url, null)).toBeNull();
      expect(optimizer._generateSrcset(url, undefined)).toBeNull();
    });

    test("returns null if URL is null", () => {
      const result = optimizer._generateSrcset(null, 600);
      expect(result).toBeNull();
    });

    test("each srcset entry has correct ImageKit transformations", () => {
      const url = "https://ik.imagekit.io/test/product.jpg";
      const result = optimizer._generateSrcset(url, 600);

      // Each entry should have f-auto, q-auto, c-at_max
      expect(result).toContain("f-auto");
      expect(result).toContain("q-auto");
      expect(result).toContain("c-at_max");
    });
  });

  describe("_escapeHtml", () => {
    test("escapes ampersand correctly", () => {
      const result = optimizer._escapeHtml("Tom & Jerry");
      expect(result).toBe("Tom &amp; Jerry");
    });

    test("escapes less than and greater than symbols", () => {
      const result = optimizer._escapeHtml("<div>content</div>");
      expect(result).toBe("&lt;div&gt;content&lt;/div&gt;");
    });

    test("escapes double quotes", () => {
      const result = optimizer._escapeHtml('He said "hello"');
      expect(result).toBe("He said &quot;hello&quot;");
    });

    test("escapes single quotes", () => {
      const result = optimizer._escapeHtml("It's working");
      expect(result).toBe("It&#039;s working");
    });

    test("escapes multiple special characters", () => {
      const text = '<script>alert("XSS")</script> & stuff';
      const result = optimizer._escapeHtml(text);

      expect(result).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; stuff",
      );
    });

    test("returns empty string for null or undefined", () => {
      expect(optimizer._escapeHtml(null)).toBe("");
      expect(optimizer._escapeHtml(undefined)).toBe("");
    });

    test("handles empty string", () => {
      expect(optimizer._escapeHtml("")).toBe("");
    });

    test("does not escape regular text", () => {
      const text = "Regular text with no special characters";
      expect(optimizer._escapeHtml(text)).toBe(text);
    });
  });

  describe("Integration Tests", () => {
    test("generates complete optimized image tag with all features", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/industrial-equipment.jpg",
        alt: "Premium stainless steel industrial manufacturing equipment",
        title: "High-quality equipment for factory production",
        width: 800,
        height: 600,
        lazy: true,
        aboveFold: false,
        sizes: "(max-width: 768px) 100vw, 800px",
      });

      // Verify all attributes are present
      expect(result).toContain('src="');
      expect(result).toContain(
        'alt="Premium stainless steel industrial manufacturing equipment"',
      );
      expect(result).toContain("title=");
      expect(result).toContain("width");
      expect(result).toContain("height");
      expect(result).toContain('loading="lazy"');
      expect(result).toContain("srcset=");
      expect(result).toContain("sizes=");

      // Verify ImageKit transformations
      expect(result).toContain("f-auto");
      expect(result).toContain("q-auto");
    });

    test("handles hero image (above-fold) without lazy loading", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/hero.jpg",
        alt: "Company website hero image showing industrial facilities",
        width: 1920,
        height: 1080,
        aboveFold: true,
      });

      expect(result).toContain('loading="eager"');
      expect(result).not.toContain('loading="lazy"');
      expect(result).toContain("width");
      expect(result).toContain("height");
    });

    test("rejects invalid alt text and uses fallback", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "image",
        width: 400,
        height: 300,
      });

      expect(result).toContain('alt="Product image"');
    });

    test("validates all requirements for SEO-compliant image tag", () => {
      const result = optimizer.generateImageTag({
        src: "https://ik.imagekit.io/test/product.jpg",
        alt: "Industrial equipment product with metal components",
        title: "Premium manufacturing equipment specifications",
        width: 600,
        height: 400,
        lazy: true,
        aboveFold: false,
        sizes: "(max-width: 600px) 100vw, 600px",
      });

      // Requirement 7.1: Alt attribute present
      expect(result).toContain("alt=");

      // Requirement 7.2: Alt text valid (10-125 chars)
      const altMatch = result.match(/alt="([^"]*)/);
      expect(altMatch).not.toBeNull();
      expect(altMatch[1].length).toBeGreaterThanOrEqual(10);
      expect(altMatch[1].length).toBeLessThanOrEqual(125);

      // Requirement 8.1: Lazy loading for below-fold
      expect(result).toContain('loading="lazy"');

      // Requirement 8.3: Width and height for CLS prevention
      expect(result).toContain("width");
      expect(result).toContain("height");

      // Requirement 8.4: ImageKit format
      expect(result).toContain("ik.imagekit.io");

      // Requirement 8.6: f-auto transformation
      expect(result).toContain("f-auto");

      // Requirement 8.7: q-auto transformation
      expect(result).toContain("q-auto");

      // Requirement 21.2: Title attribute present (20-150 chars)
      expect(result).toContain("title=");
    });
  });
});

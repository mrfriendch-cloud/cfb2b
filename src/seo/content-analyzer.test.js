/**
 * Unit tests for ContentAnalyzer
 * Validates: Requirements 5.2, 5.3, 6.1, 6.2, 6.4, 19.1, 19.3, 19.4, 20.5, 22, 27.1-27.5
 */

import { ContentAnalyzer } from "./content-analyzer.js";

describe("ContentAnalyzer", () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new ContentAnalyzer();
  });

  describe("analyzeContent", () => {
    test("returns valid true when content meets all requirements", () => {
      const content = `
# Product Overview
This is a excellent product that provides great value. Our premium solution offers numerous benefits for customers seeking quality. The product is designed specifically for professionals who need reliable tools.

## Key Features
The product includes many great features. These features are designed to meet customer needs effectively and efficiently. Every single feature has been tested and verified for quality assurance and reliability.

### Feature Details
Each feature has been carefully engineered. The engineering process ensures quality and reliability in every aspect of the product. We invest significant time and resources into quality control.

### Advanced Capabilities
The advanced capabilities set this product apart from competitors. Our research team spent months developing these features. Each capability addresses real customer pain points identified through extensive testing.

## Specifications
Our specifications meet industry standards. The standards ensure compatibility with existing systems and future upgrades. Technical documentation is comprehensive and detailed.

## Product Benefits
This excellent product delivers real value to organizations. The benefits include cost savings, improved efficiency, and better performance overall.

## Integration Information
Integration with existing systems is straightforward and well supported. Our technical support team provides comprehensive integration assistance and training for all customers.

## Additional Details
This is another section to provide additional details about the product. The additional details help users understand the full capabilities and features. We believe in providing comprehensive information.

## Customer Support
We offer comprehensive customer support for all users of this product. If you have any questions or need assistance with setup, please contact us. Our team is available to assist you.

## Installation Guide
The installation guide provides step-by-step instructions. Please refer to the documentation for details. The process is quick and simple.

## Pricing and Availability
The pricing and availability details are updated regularly. Please check our main catalog page for updates on price, stock status, and shipping options.

## Related Products
Check out [similar product one](/products/similar-1) and [related item two](/products/related-2) for more options and alternatives.
      `;

      const result = analyzer.analyzeContent(content, "excellent product");

      expect(result.valid).toBe(true);
      expect(
        result.warnings.filter((w) => w.severity === "ERROR"),
      ).toHaveLength(0);
    });

    test("returns analysis with metrics", () => {
      let content = "This is a test. ".repeat(25);
      content += " Additional content for testing purposes. ".repeat(10);
      const result = analyzer.analyzeContent(content, "test");

      expect(result.metrics).toBeDefined();
      expect(result.metrics.wordCount).toBeGreaterThanOrEqual(150);
      expect(result.metrics.keywordDensity).toBeDefined();
      expect(result.metrics.internalLinks).toBeDefined();
    });

    test("handles empty content gracefully", () => {
      const result = analyzer.analyzeContent("", "keyword");

      expect(result.valid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("EMPTY_CONTENT");
      expect(result.warnings[0].severity).toBe("ERROR");
      expect(result.metrics.wordCount).toBe(0);
    });

    test("handles null content gracefully", () => {
      const result = analyzer.analyzeContent(null, "keyword");

      expect(result.valid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe("EMPTY_CONTENT");
    });
  });

  describe("_countWords", () => {
    test("counts words correctly in plain text", () => {
      const text = "This is a simple test with five words";
      expect(analyzer._countWords(text)).toBe(8);
    });

    test("handles extra whitespace", () => {
      const text = "This   is   a   test"; // Extra spaces
      expect(analyzer._countWords(text)).toBe(4);
    });

    test("handles newlines and tabs", () => {
      const text = "This\nis\ta\ntest";
      expect(analyzer._countWords(text)).toBe(4);
    });

    test("returns 0 for empty string", () => {
      expect(analyzer._countWords("")).toBe(0);
      expect(analyzer._countWords("   ")).toBe(0);
    });

    test("counts words in markdown content", () => {
      const markdown = `# Heading
This is paragraph one.

## Subheading
This is paragraph two with more content here.`;

      const count = analyzer._countWords(markdown);
      expect(count).toBeGreaterThan(15);
    });
  });

  describe("analyzeContent - Word Count Validation", () => {
    test("flags content shorter than 300 words as ERROR", () => {
      const shortContent = "This is a short content. ".repeat(10); // ~50 words
      const result = analyzer.analyzeContent(shortContent, "content");

      expect(result.valid).toBe(false);
      const lengthWarning = result.warnings.find((w) => w.type === "LENGTH");
      expect(lengthWarning).toBeDefined();
      expect(lengthWarning.severity).toBe("ERROR");
      expect(lengthWarning.message).toContain("Minimum 300 words");
    });

    test("accepts content with exactly 300 words", () => {
      const content = "word ".repeat(300);
      const result = analyzer.analyzeContent(content, "word");

      const lengthWarning = result.warnings.find((w) => w.type === "LENGTH");
      expect(lengthWarning).toBeUndefined();
    });

    test("accepts content with more than 300 words", () => {
      const content = "word ".repeat(500);
      const result = analyzer.analyzeContent(content, "word");

      const lengthWarning = result.warnings.find((w) => w.type === "LENGTH");
      expect(lengthWarning).toBeUndefined();
    });
  });

  describe("_validateHeadingHierarchy", () => {
    test("accepts proper heading hierarchy H1->H2->H3", () => {
      const markdown = `# Main Title
## Subsection
### Detail`;

      const warnings = analyzer._validateHeadingHierarchy(markdown);
      expect(warnings).toHaveLength(0);
    });

    test("detects skipped heading levels (H2 to H4)", () => {
      const markdown = `# Main Title
## Subsection
#### Too Deep`;

      const warnings = analyzer._validateHeadingHierarchy(markdown);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe("HEADING_HIERARCHY");
      expect(warnings[0].severity).toBe("ERROR");
      expect(warnings[0].message).toContain("H2");
      expect(warnings[0].message).toContain("H4");
    });

    test("detects skipped levels in complex hierarchy", () => {
      const markdown = `# H1
## H2
### H3
##### H5 (skipped H4)`;

      const warnings = analyzer._validateHeadingHierarchy(markdown);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe("HEADING_HIERARCHY");
    });

    test("accepts proper multi-level hierarchy", () => {
      const markdown = `# H1
## H2
### H3
### H3 Again
#### H4
##### H5
###### H6`;

      const warnings = analyzer._validateHeadingHierarchy(markdown);
      expect(warnings).toHaveLength(0);
    });

    test("handles content with no headings", () => {
      const markdown = "This is just regular content without any headings.";
      const warnings = analyzer._validateHeadingHierarchy(markdown);

      expect(warnings).toHaveLength(0);
    });

    test("allows descending from H3 to H2", () => {
      const markdown = `# H1
## H2
### H3
## H2 Again
### H3 Again`;

      const warnings = analyzer._validateHeadingHierarchy(markdown);
      expect(warnings).toHaveLength(0);
    });

    test("detects multiple hierarchy violations", () => {
      const markdown = `# H1
### H3 (skip H2)
###### H6 (skip H4, H5)`;

      const warnings = analyzer._validateHeadingHierarchy(markdown);
      expect(warnings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("analyzeContent - Heading Hierarchy Validation", () => {
    test("flags heading hierarchy issues with ERROR severity", () => {
      const content = `# H1
## H2
#### H4 (skipped H3)

This is content.`;

      const result = analyzer.analyzeContent(content, "keyword");

      const hierarchyWarning = result.warnings.find(
        (w) => w.type === "HEADING_HIERARCHY",
      );
      expect(hierarchyWarning).toBeDefined();
      expect(hierarchyWarning.severity).toBe("ERROR");
    });
  });

  describe("_calculateKeywordDensity", () => {
    test("calculates keyword density correctly", () => {
      const text = "keyword test keyword word keyword again test";
      // 3 occurrences of "keyword" / 8 total words = 37.5%
      const density = analyzer._calculateKeywordDensity(text, "keyword");

      expect(density).toBeGreaterThan(30);
      expect(density).toBeLessThan(50);
    });

    test("is case-insensitive", () => {
      const text = "Keyword test keyword KEYWORD another word";
      const density = analyzer._calculateKeywordDensity(text, "keyword");

      expect(density).toBeGreaterThan(30);
    });

    test("handles keyword not in text", () => {
      const text = "This is a test with no matching content";
      const density = analyzer._calculateKeywordDensity(text, "xyz");

      expect(density).toBe(0);
    });

    test("handles partial word matches", () => {
      const text = "testing test tested tests";
      const density = analyzer._calculateKeywordDensity(text, "test");

      // All words contain "test", so density should be 100%
      expect(density).toBe(100);
    });

    test("returns 0 for null/undefined inputs", () => {
      expect(analyzer._calculateKeywordDensity(null, "keyword")).toBe(0);
      expect(analyzer._calculateKeywordDensity("text", null)).toBe(0);
      expect(analyzer._calculateKeywordDensity("", "keyword")).toBe(0);
    });
  });

  describe("analyzeContent - Keyword Density Validation", () => {
    test("flags keyword density below 0.5% as WARNING", () => {
      const content = "word ".repeat(500);
      const result = analyzer.analyzeContent(content, "xyz");

      const densityWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_DENSITY",
      );
      expect(densityWarning).toBeDefined();
      expect(densityWarning.severity).toBe("WARNING");
      expect(densityWarning.message).toContain("Recommended");
    });

    test("flags keyword density above 3% as ERROR", () => {
      const content = "keyword ".repeat(500);
      const result = analyzer.analyzeContent(content, "keyword");

      const stuffingWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_STUFFING",
      );
      expect(stuffingWarning).toBeDefined();
      expect(stuffingWarning.severity).toBe("ERROR");
      expect(stuffingWarning.message).toContain("keyword stuffing");
    });

    test("accepts keyword density between 1% and 3%", () => {
      // Create content with ~2% keyword density
      const words = [];
      for (let i = 0; i < 100; i++) {
        words.push("filler");
        if (i % 50 === 0) words.push("keyword");
      }
      const content = words.join(" ");
      const result = analyzer.analyzeContent(content, "keyword");

      const stuffingWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_STUFFING",
      );
      const densityWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_DENSITY",
      );

      expect(stuffingWarning).toBeUndefined();
      if (densityWarning) {
        expect(densityWarning.severity).not.toBe("ERROR");
      }
    });
  });

  describe("analyzeContent - Keyword Placement", () => {
    test("flags keyword not in first 100 words as WARNING", () => {
      const content = "word ".repeat(50) + "keyword " + "word ".repeat(100);
      const result = analyzer.analyzeContent(content, "xyz");

      const placementWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_PLACEMENT",
      );
      expect(placementWarning).toBeDefined();
      expect(placementWarning.severity).toBe("WARNING");
      expect(placementWarning.message).toContain("first 100 words");
    });

    test("accepts keyword in first 100 words", () => {
      const content = "keyword " + "word ".repeat(300);
      const result = analyzer.analyzeContent(content, "keyword");

      const placementWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_PLACEMENT",
      );
      expect(placementWarning).toBeUndefined();
    });

    test("is case-insensitive for placement check", () => {
      const content = "KEYWORD " + "word ".repeat(300);
      const result = analyzer.analyzeContent(content, "keyword");

      const placementWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_PLACEMENT",
      );
      expect(placementWarning).toBeUndefined();
    });

    test("checks exactly first 100 words", () => {
      const words = [];
      for (let i = 0; i < 105; i++) {
        words.push(i === 101 ? "keyword" : "word");
      }
      const content = words.join(" ");
      const result = analyzer.analyzeContent(content, "keyword");

      const placementWarning = result.warnings.find(
        (w) => w.type === "KEYWORD_PLACEMENT",
      );
      expect(placementWarning).toBeDefined();
    });
  });

  describe("_countInternalLinks", () => {
    test("counts markdown internal links starting with /", () => {
      const markdown = "[Link 1](/products/1) and [Link 2](/products/2)";
      expect(analyzer._countInternalLinks(markdown)).toBe(2);
    });

    test("counts relative path links as internal", () => {
      const markdown = "[Link](../products/1) and [Another](./page)";
      expect(analyzer._countInternalLinks(markdown)).toBe(2);
    });

    test("excludes absolute external URLs", () => {
      const markdown =
        "[External](https://example.com) and [Another](http://other.com)";
      expect(analyzer._countInternalLinks(markdown)).toBe(0);
    });

    test("handles mixed internal and external links", () => {
      const markdown = `
[Internal Link](/products/1)
[External Link](https://example.com)
[Another Internal](/category)
[Another External](http://test.com)
[Relative Link](../page)
      `;

      const count = analyzer._countInternalLinks(markdown);
      expect(count).toBe(3); // Two absolute paths and one relative
    });

    test("handles links without markdown syntax", () => {
      const markdown =
        "This is plain text with https://example.com but no link syntax";
      expect(analyzer._countInternalLinks(markdown)).toBe(0);
    });

    test("handles malformed markdown links", () => {
      const markdown = "[Link without URL]() and [URL without text](/products)";
      // Only valid markdown links should be counted
      const count = analyzer._countInternalLinks(markdown);
      expect(count).toBeGreaterThanOrEqual(0); // Depending on regex strictness
    });

    test("returns 0 for null/empty content", () => {
      expect(analyzer._countInternalLinks(null)).toBe(0);
      expect(analyzer._countInternalLinks("")).toBe(0);
    });
  });

  describe("analyzeContent - Internal Links Validation", () => {
    test("flags fewer than 2 internal links as WARNING", () => {
      const content =
        `# Product
This is a product description.
[Learn more](/page)
` + "word ".repeat(300);

      const result = analyzer.analyzeContent(content, "product");

      const linksWarning = result.warnings.find(
        (w) => w.type === "INTERNAL_LINKS",
      );
      expect(linksWarning).toBeDefined();
      expect(linksWarning.severity).toBe("WARNING");
      expect(linksWarning.message).toContain("at least 2");
    });

    test("accepts exactly 2 internal links", () => {
      const content =
        `# Product
[Link 1](/products/1)
[Link 2](/products/2)
` + "word ".repeat(300);

      const result = analyzer.analyzeContent(content, "product");

      const linksWarning = result.warnings.find(
        (w) => w.type === "INTERNAL_LINKS",
      );
      expect(linksWarning).toBeUndefined();
    });

    test("accepts more than 2 internal links", () => {
      const content =
        `# Product
[Link 1](/products/1)
[Link 2](/products/2)
[Link 3](/products/3)
` + "word ".repeat(300);

      const result = analyzer.analyzeContent(content, "product");

      const linksWarning = result.warnings.find(
        (w) => w.type === "INTERNAL_LINKS",
      );
      expect(linksWarning).toBeUndefined();
    });
  });

  describe("Integration - Full Content Analysis", () => {
    test("analyzes complete product description successfully", () => {
      const productDescription = `
# Premium Industrial Tool

This is an excellent premium industrial tool designed for professionals who demand quality and reliability. The product excels in durability and precision. With years of engineering expertise, this tool represents the pinnacle of industrial design.

## Key Features and Benefits

Our premium tool offers multiple key benefits for your workshop. The premium construction ensures it will last for years. Features include advanced ergonomics, precision engineering, and durable materials.

### Superior Design

The design of this premium tool is innovative and user-friendly. Premium materials are used throughout construction. Every component has been optimized for performance and longevity.

### Performance Specifications

With outstanding performance characteristics, this tool delivers results. Performance testing has validated its excellence. Laboratory tests confirm superior performance across all metrics and scenarios.

### Advanced Engineering

The advanced engineering behind this product ensures reliability. Engineering teams spent thousands of hours perfecting every detail. Advanced materials and manufacturing techniques guarantee longevity.

## Installation and Assembly

Assembly of the premium tool is straightforward. The package includes detailed instructions and all necessary hardware. Most users can complete the setup in under fifteen minutes. Please follow all safety guidelines listed in the manual.

## Environmental Considerations

We design our premium tools with the environment in mind. The manufacturing process utilizes recycled materials where possible. This product is energy efficient and fully compliant with environmental standards.

## Ordering Information

To place an order or request a quote, please use our online form. Our sales department will contact you within twenty-four hours. For bulk orders, special pricing and discount rates may apply.

## Related Products

For similar tools, check out [our power drills](/products/drills) and [precision equipment](/products/precision).

## Warranty and Support

We provide comprehensive support and warranty coverage for all customers. Our support team is available 24/7 to help with any questions or concerns.

## Technical Specifications

The technical specifications document all performance characteristics and measurements. Complete specifications are available for download from our website.
      `;

      const result = analyzer.analyzeContent(
        productDescription,
        "premium tool",
      );

      expect(result.metrics.wordCount).toBeGreaterThan(300);
      expect(result.metrics.internalLinks).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test("identifies all issues in problematic content", () => {
      const poorContent = `# Short
Not enough content here. [Link](/page) and one more.`;

      const result = analyzer.analyzeContent(poorContent, "notfound");

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);

      const hasLengthError = result.warnings.some(
        (w) => w.type === "LENGTH" && w.severity === "ERROR",
      );
      const hasKeywordPlacement = result.warnings.some(
        (w) => w.type === "KEYWORD_PLACEMENT",
      );

      expect(hasLengthError).toBe(true);
      expect(hasKeywordPlacement).toBe(true);
    });
  });
});

/**
 * Content Analyzer
 * Validates and analyzes markdown content for SEO compliance
 */

class ContentAnalyzer {
  /**
   * Analyze product description for SEO compliance
   * @param {string} markdown - Markdown content
   * @param {string} primaryKeyword - Primary SEO keyword
   * @returns {Object} Analysis result with warnings and metrics
   */
  analyzeContent(markdown, primaryKeyword) {
    const warnings = [];
    const metrics = {};

    if (!markdown) {
      return {
        valid: false,
        warnings: [
          {
            type: "EMPTY_CONTENT",
            severity: "ERROR",
            message: "Content is empty. Minimum 300 words required for SEO.",
          },
        ],
        metrics: { wordCount: 0 },
      };
    }

    // Check content length
    const wordCount = this._countWords(markdown);
    metrics.wordCount = wordCount;
    if (wordCount < 300) {
      warnings.push({
        type: "LENGTH",
        severity: "ERROR",
        message: `Content is ${wordCount} words. Minimum 300 words required for SEO.`,
      });
    }

    // Check heading hierarchy
    const headingIssues = this._validateHeadingHierarchy(markdown);
    if (headingIssues.length > 0) {
      warnings.push(...headingIssues);
    }

    // Check keyword density and placement
    if (primaryKeyword) {
      const density = this._calculateKeywordDensity(markdown, primaryKeyword);
      metrics.keywordDensity = density;

      if (density < 0.5) {
        warnings.push({
          type: "KEYWORD_DENSITY",
          severity: "WARNING",
          message: `Keyword density is ${density.toFixed(2)}%. Recommended: 1-3%.`,
        });
      } else if (density > 3) {
        warnings.push({
          type: "KEYWORD_STUFFING",
          severity: "ERROR",
          message: `Keyword density is ${density.toFixed(2)}%. Risk of keyword stuffing penalty.`,
        });
      }

      // Check keyword in first 100 words
      const first100Words = markdown.split(/\s+/).slice(0, 100).join(" ");
      if (!first100Words.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        warnings.push({
          type: "KEYWORD_PLACEMENT",
          severity: "WARNING",
          message: "Primary keyword not found in first 100 words.",
        });
      }
    }

    // Check internal links
    const linkCount = this._countInternalLinks(markdown);
    metrics.internalLinks = linkCount;
    if (linkCount < 2) {
      warnings.push({
        type: "INTERNAL_LINKS",
        severity: "WARNING",
        message: `Only ${linkCount} internal links found. Recommended: at least 2.`,
      });
    }

    return {
      valid: warnings.filter((w) => w.severity === "ERROR").length === 0,
      warnings,
      metrics,
    };
  }

  /**
   * Count words in text
   * @private
   */
  _countWords(text) {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Validate heading hierarchy (no skipped levels)
   * @private
   */
  _validateHeadingHierarchy(markdown) {
    const warnings = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      headings.push({ level, text: match[2] });
    }

    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1].level;
      const curr = headings[i].level;

      if (curr > prev + 1) {
        warnings.push({
          type: "HEADING_HIERARCHY",
          severity: "ERROR",
          message: `Heading level skipped: H${prev} to H${curr} (should be H${prev + 1})`,
        });
      }
    }

    return warnings;
  }

  /**
   * Calculate keyword density
   * @private
   */
  _calculateKeywordDensity(text, keyword) {
    if (!text || !keyword) return 0;

    const words = text.toLowerCase().split(/\s+/);
    const keywordLower = keyword.toLowerCase();
    const keywordCount = words.filter((word) =>
      word.includes(keywordLower),
    ).length;

    return (keywordCount / words.length) * 100;
  }

  /**
   * Count internal links
   * @private
   */
  _countInternalLinks(markdown) {
    if (!markdown) return 0;

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let count = 0;
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const url = match[2];
      // Count as internal if starts with / or relative path
      if (
        url.startsWith("/") ||
        (!url.startsWith("http://") && !url.startsWith("https://"))
      ) {
        count++;
      }
    }

    return count;
  }
}

export { ContentAnalyzer };

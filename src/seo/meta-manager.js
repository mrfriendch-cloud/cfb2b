/**
 * Meta Tag Manager
 * Generates meta tags for all page types
 */

class MetaTagManager {
  constructor(env) {
    this.env = env;
    this.imagekitEndpoint = env.IMAGEKIT_URL_ENDPOINT;
  }

  /**
   * Generate complete meta tags HTML for a page
   * @param {Object} options - Page configuration
   * @param {string} options.title - Page title (50-60 chars)
   * @param {string} options.description - Meta description (150-160 chars)
   * @param {string} options.canonicalUrl - Canonical URL (absolute HTTPS)
   * @param {string} options.imageUrl - Open Graph image URL
   * @param {string} options.pageType - Page type: 'website', 'product', 'category'
   * @param {Object} [options.product] - Product data for product pages
   * @returns {string} HTML meta tags
   */
  generateMetaTags(options) {
    const {
      title,
      description,
      canonicalUrl,
      imageUrl,
      pageType = "website",
      product = null,
    } = options;

    // Validate and enforce character limits
    const validatedTitle = this._validateTitle(title);
    const validatedDescription = this._validateDescription(description);
    const escapedTitle = this._escapeHtml(validatedTitle);
    const escapedDescription = this._escapeHtml(validatedDescription);

    // Build meta tags
    const tags = [];

    // Basic meta tags
    tags.push(`<title>${escapedTitle}</title>`);
    tags.push(`<meta name="description" content="${escapedDescription}">`);
    tags.push(`<link rel="canonical" href="${canonicalUrl}">`);
    tags.push(`<meta name="robots" content="index, follow">`);

    // Open Graph tags
    tags.push(`<meta property="og:title" content="${escapedTitle}">`);
    tags.push(
      `<meta property="og:description" content="${escapedDescription}">`,
    );
    tags.push(`<meta property="og:url" content="${canonicalUrl}">`);
    tags.push(`<meta property="og:type" content="${pageType}">`);

    if (imageUrl) {
      const ogImage = this._getOptimizedImageUrl(
        imageUrl,
        "w-1200,h-630,c-at_max",
      );
      tags.push(`<meta property="og:image" content="${ogImage}">`);
      tags.push(`<meta property="og:image:width" content="1200">`);
      tags.push(`<meta property="og:image:height" content="630">`);
    }

    // Twitter Card tags (for product pages)
    if (pageType === "product" && product) {
      tags.push(`<meta name="twitter:card" content="summary_large_image">`);
      tags.push(`<meta name="twitter:title" content="${escapedTitle}">`);
      tags.push(
        `<meta name="twitter:description" content="${escapedDescription}">`,
      );
      if (imageUrl) {
        tags.push(
          `<meta name="twitter:image" content="${this._getOptimizedImageUrl(imageUrl, "w-1200,h-630,c-at_max")}">`,
        );
      }
    }

    return tags.join("\n  ");
  }

  /**
   * Validate title length (50-60 characters)
   * @private
   */
  _validateTitle(title) {
    if (!title) return "B2B Product Exhibition";
    if (title.length > 60) return title.substring(0, 57) + "...";
    return title;
  }

  /**
   * Validate description length (150-160 characters)
   * @private
   */
  _validateDescription(description) {
    if (!description)
      return "High-quality industrial products and B2B solutions for businesses worldwide.";
    if (description.length > 160) return description.substring(0, 157) + "...";
    return description;
  }

  /**
   * HTML escape to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Get optimized ImageKit URL with transformations
   * @private
   */
  _getOptimizedImageUrl(url, transformations) {
    if (!url || !url.includes("ik.imagekit.io")) return url;
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("tr", transformations);
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }
}

export { MetaTagManager };

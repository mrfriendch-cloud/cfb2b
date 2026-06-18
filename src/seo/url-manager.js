/**
 * URL Manager
 * Handles slug generation, canonical URLs, and redirects
 */

class URLManager {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.baseUrl = env.BASE_URL || "https://yourdomain.com";
  }

  /**
   * Generate URL slug from text
   * @param {string} text - Text to slugify (e.g., product name)
   * @param {number} [maxLength=75] - Maximum slug length
   * @returns {string} URL-safe slug
   */
  generateSlug(text, maxLength = 75) {
    if (!text) return "";

    let slug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    // Enforce max length
    if (slug.length > maxLength) {
      slug = slug.substring(0, maxLength);
      // Remove trailing partial word
      const lastHyphen = slug.lastIndexOf("-");
      if (lastHyphen > 0) {
        slug = slug.substring(0, lastHyphen);
      }
    }

    return slug;
  }

  /**
   * Generate canonical URL
   * @param {string} path - Page path (e.g., '/products/123')
   * @returns {string} Absolute HTTPS canonical URL
   */
  generateCanonicalUrl(path) {
    // Ensure HTTPS and absolute URL
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  /**
   * Check if slug exists for uniqueness
   * @param {string} slug - Proposed slug
   * @param {number} [excludeId] - Product ID to exclude from check
   * @returns {Promise<boolean>} True if slug exists
   */
  async slugExists(slug, excludeId = null) {
    let query = "SELECT COUNT(*) as count FROM product_slugs WHERE slug = ?";
    const params = [slug];

    if (excludeId) {
      query += " AND product_id != ?";
      params.push(excludeId);
    }

    const stmt = this.db.prepare(query).bind(...params);
    if (typeof stmt.first !== "function") {
      return false;
    }
    const result = await stmt.first();
    return result ? result.count > 0 : false;
  }

  /**
   * Ensure slug is unique (append number if needed)
   * @param {string} baseSlug - Base slug
   * @param {number} [excludeId] - Product ID to exclude
   * @returns {Promise<string>} Unique slug
   */
  async ensureUniqueSlug(baseSlug, excludeId = null) {
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Save product slug mapping
   * @param {number} productId - Product ID
   * @param {string} slug - URL slug
   * @returns {Promise<void>}
   */
  async saveProductSlug(productId, slug) {
    const stmt = this.db
      .prepare(
        "INSERT OR REPLACE INTO product_slugs (product_id, slug, created_at) VALUES (?, ?, ?)",
      )
      .bind(productId, slug, new Date().toISOString());
    if (typeof stmt.run === "function") {
      await stmt.run();
    }
  }

  /**
   * Get product by slug
   * @param {string} slug - URL slug
   * @returns {Promise<Object|null>} Product data or null
   */
  async getProductBySlug(slug) {
    const stmt1 = this.db.prepare("SELECT product_id FROM product_slugs WHERE slug = ?").bind(slug);
    if (typeof stmt1.first !== "function") return null;
    const result = await stmt1.first();

    if (!result) return null;

    const stmt2 = this.db.prepare("SELECT * FROM products WHERE id = ?").bind(result.product_id);
    if (typeof stmt2.first !== "function") return null;
    return await stmt2.first();
  }

  /**
   * Create 301 redirect
   * @param {string} fromUrl - Old URL path
   * @param {string} toUrl - New URL path
   * @returns {Promise<void>}
   */
  async createRedirect(fromUrl, toUrl) {
    const stmt = this.db
      .prepare(
        "INSERT OR REPLACE INTO redirects (from_url, to_url, status_code, created_at) VALUES (?, ?, 301, ?)",
      )
      .bind(fromUrl, toUrl, new Date().toISOString());
    if (typeof stmt.run === "function") {
      await stmt.run();
    }
  }

  /**
   * Check for redirect
   * @param {string} path - URL path to check
   * @returns {Promise<Object|null>} Redirect data {to_url, status_code} or null
   */
  async getRedirect(path) {
    const stmt = this.db.prepare("SELECT to_url, status_code FROM redirects WHERE from_url = ?").bind(path);
    if (typeof stmt.first !== "function") return null;
    return await stmt.first();
  }

  /**
   * HTML escape to prevent XSS
   * Reusable pattern for escaping HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} HTML-escaped text
   * @private
   */
  _escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export { URLManager };

/**
 * Sitemap Generator
 * Generates XML sitemaps from database content
 */

class SitemapGenerator {
  constructor(env) {
    this.env = env;
    this.db = env.DB;
    this.baseUrl = "https://yourdomain.com"; // TODO: Make configurable
    this.maxUrls = 50000; // Sitemap limit
  }

  /**
   * Generate complete XML sitemap
   * @param {string} [requestUrl] - Incoming request URL
   * @returns {Promise<string>} XML sitemap content
   */
  async generateSitemap(requestUrl) {
    if (requestUrl) {
      try {
        this.baseUrl = new URL(requestUrl).origin;
      } catch (e) {
        console.error("Error parsing requestUrl origin:", e);
      }
    } else {
      try {
        const query = this.db.prepare("SELECT value FROM seo_settings WHERE key = 'base_url'");
        if (typeof query.first === "function") {
          const setting = await query.first();
          if (setting && setting.value) {
            this.baseUrl = setting.value;
          }
        }
      } catch (e) {
        console.error("Error fetching base_url from seo_settings:", e);
      }
    }

    const urls = [];

    // Add homepage
    urls.push({
      loc: this.baseUrl,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "daily",
      priority: 1.0,
    });

    // Add category pages
    const categories = await this._getCategoryPages();
    urls.push(...categories);

    // Add product pages
    const products = await this._getProductPages();
    urls.push(...products);

    // Limit to 50,000 URLs
    const limitedUrls = urls.slice(0, this.maxUrls);

    return this._generateXML(limitedUrls);
  }

  /**
   * Get category page URLs
   * @private
   */
  async _getCategoryPages() {
    try {
      const categories = await this.db
        .prepare("SELECT name, updated_at FROM categories WHERE id IS NOT NULL")
        .all();

      if (!categories || !categories.results) {
        return [];
      }

      return categories.results.map((cat) => ({
        loc: `${this.baseUrl}/products?category=${encodeURIComponent(cat.name)}`,
        lastmod: cat.updated_at
          ? cat.updated_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
        changefreq: "weekly",
        priority: 0.8,
      }));
    } catch (error) {
      console.error("Error fetching categories for sitemap:", error);
      return [];
    }
  }

  /**
   * Get product page URLs
   * @private
   */
  async _getProductPages() {
    try {
      const products = await this.db
        .prepare(
          `SELECT p.id, p.name, p.updated_at, s.slug 
           FROM products p 
           LEFT JOIN product_slugs s ON p.id = s.product_id 
           WHERE p.is_active = 1`,
        )
        .all();

      if (!products || !products.results) {
        return [];
      }

      const { URLManager } = await import("./url-manager");
      const urlManager = new URLManager(this.env);

      const productPages = [];
      for (const product of products.results) {
        let slug = product.slug;
        if (!slug) {
          try {
            const baseSlug = urlManager.generateSlug(product.name);
            slug = await urlManager.ensureUniqueSlug(baseSlug);
            await urlManager.saveProductSlug(product.id, slug);
          } catch (slugError) {
            console.error(`Error generating slug on-demand for product ${product.id} in sitemap:`, slugError);
            slug = product.id.toString(); // fallback to ID
          }
        }

        productPages.push({
          loc: `${this.baseUrl}/products/${slug}`,
          lastmod: product.updated_at
            ? product.updated_at.split("T")[0]
            : new Date().toISOString().split("T")[0],
          changefreq: "monthly",
          priority: 0.6,
        });
      }

      return productPages;
    } catch (error) {
      console.error("Error fetching products for sitemap:", error);
      return [];
    }
  }

  /**
   * Generate XML from URL array
   * @private
   */
  _generateXML(urls) {
    const urlTags = urls
      .map(
        (url) => `  <url>
    <loc>${this._escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>`;
  }

  /**
   * Escape XML special characters
   * @private
   */
  _escapeXml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

export { SitemapGenerator };

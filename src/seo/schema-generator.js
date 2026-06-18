/**
 * Schema.org Structured Data Generator
 * Generates JSON-LD structured data for all page types
 */

class SchemaGenerator {
  constructor(env) {
    this.env = env;
    // Get base URL from environment or default
    this.baseUrl = env.BASE_URL || env.SITE_URL || "https://yourdomain.com";
  }

  /**
   * Generate Organization schema for homepage
   * @param {Object} settings - Website settings from D1
   * @param {string} [settings.site_name] - Organization name
   * @param {string} [settings.logo_url] - Logo URL
   * @param {string} [settings.email] - Contact email
   * @param {string} [settings.phone] - Contact phone
   * @returns {string} JSON-LD script tag HTML
   */
  generateOrganizationSchema(settings) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.site_name || "B2B Product Exhibition",
      url: this.baseUrl,
      logo: this._ensureAbsoluteUrl(settings.logo_url || "/images/logo.png"),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        email: settings.email,
        telephone: settings.phone,
      },
    };

    return this._wrapInScriptTag(schema);
  }

  /**
   * Generate Product schema for product detail pages
   * @param {Object} product - Product data from D1
   * @param {string} product.name - Product name
   * @param {string} [product.description] - Product description
   * @param {string} [product.detailed_description] - Product detailed description
   * @param {string} [product.image_url] - Product image URL
   * @param {number|string} product.id - Product ID (used as SKU)
   * @param {number} product.quantity - Product quantity (for availability)
   * @param {number} [product.price] - Product price
   * @param {string} productUrl - Absolute product page URL
   * @returns {string} JSON-LD script tag HTML
   */
  generateProductSchema(product, productUrl) {
    // Determine availability based on quantity
    const availability =
      product.quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

    // Build the Product schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || product.detailed_description || "",
      sku: product.id.toString(),
      brand: {
        "@type": "Brand",
        name: "B2B Product Exhibition", // TODO: Make configurable via settings
      },
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: "USD",
        price: product.price || 0,
        availability: availability,
      },
    };

    // Include product image URL if available
    if (product.image_url) {
      schema.image = this._ensureAbsoluteUrl(product.image_url);
    }

    // Validate before returning
    if (this._validateSchema(schema, "Product")) {
      return this._wrapInScriptTag(schema);
    }

    console.error("Invalid Product schema, skipping");
    return "";
  }

  /**
   * Generate BreadcrumbList schema for navigation
   * @param {Array} breadcrumbs - Array of breadcrumb objects [{name, url}, ...]
   * @returns {string} JSON-LD script tag HTML
   */
  generateBreadcrumbSchema(breadcrumbs) {
    if (!breadcrumbs || breadcrumbs.length === 0) {
      return "";
    }

    const itemListElement = breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: this._ensureAbsoluteUrl(crumb.url),
    }));

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement,
    };

    return this._wrapInScriptTag(schema);
  }

  /**
   * Generate ItemList schema for category pages
   * @param {Array} products - Array of product objects with at least an id or slug
   * @param {string} categoryUrl - Absolute category page URL
   * @returns {string} JSON-LD script tag HTML
   */
  generateItemListSchema(products, categoryUrl) {
    if (!products || products.length === 0) {
      return "";
    }

    const itemListElement = products.map((product, index) => {
      // Use slug if available, otherwise use ID
      const productPath = product.slug
        ? `/products/${product.slug}`
        : `/products/${product.id}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: this._ensureAbsoluteUrl(productPath),
      };
    });

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      url: this._ensureAbsoluteUrl(categoryUrl),
      numberOfItems: products.length,
      itemListElement,
    };

    return this._wrapInScriptTag(schema);
  }

  /**
   * Generate multiple schemas wrapped in @graph array
   * @param {Array} schemas - Array of schema objects (not HTML strings)
   * @returns {string} JSON-LD script tag HTML with all valid schemas
   */
  generateMultiSchema(schemas) {
    if (!schemas || schemas.length === 0) {
      return "";
    }

    // Filter out invalid schemas
    const validSchemas = [];

    for (const schema of schemas) {
      // Skip if not a valid object
      if (!schema || typeof schema !== "object") {
        console.error("Invalid schema object skipped (not an object)");
        continue;
      }

      // Basic validation - must have @type
      if (!schema["@type"]) {
        console.error("Invalid schema object skipped (missing @type)");
        continue;
      }

      // Validate based on type
      const schemaType = schema["@type"];
      let isValid = true;

      if (schemaType === "Product") {
        isValid = !!(schema.name && schema.offers);
        if (!isValid) {
          console.error(
            `Invalid Product schema skipped: missing required properties (name: ${!!schema.name}, offers: ${!!schema.offers})`,
          );
        }
      } else if (schemaType === "Organization") {
        isValid = !!(schema.name && schema.url);
        if (!isValid) {
          console.error(
            `Invalid Organization schema skipped: missing required properties (name: ${!!schema.name}, url: ${!!schema.url})`,
          );
        }
      }

      if (isValid) {
        validSchemas.push(schema);
      }
    }

    // If no valid schemas, return empty string
    if (validSchemas.length === 0) {
      console.error("No valid schemas to generate multi-schema output");
      return "";
    }

    // Wrap in @graph format
    const graphSchema = {
      "@context": "https://schema.org",
      "@graph": validSchemas,
    };

    return this._wrapInScriptTag(graphSchema);
  }

  /**
   * Validate schema against basic rules
   * @param {Object} schema - Schema object to validate
   * @param {string} type - Schema type ('Product', 'Organization', etc.)
   * @returns {boolean} True if schema is valid
   * @private
   */
  _validateSchema(schema, type) {
    // Basic validation - check required properties
    if (!schema["@context"] || !schema["@type"]) {
      console.error(`Schema validation failed: missing @context or @type`);
      return false;
    }

    if (type === "Product") {
      const isValid = !!(schema.name && schema.offers);
      if (!isValid) {
        console.error(
          `Product schema validation failed: missing required properties (name: ${!!schema.name}, offers: ${!!schema.offers})`,
        );
      }
      return isValid;
    }

    if (type === "Organization") {
      const isValid = !!(schema.name && schema.url);
      if (!isValid) {
        console.error(
          `Organization schema validation failed: missing required properties (name: ${!!schema.name}, url: ${!!schema.url})`,
        );
      }
      return isValid;
    }

    return true;
  }

  /**
   * Wrap schema in script tag
   * @param {Object} schema - Schema object to wrap
   * @returns {string} JSON-LD script tag HTML
   * @private
   */
  _wrapInScriptTag(schema) {
    try {
      const json = JSON.stringify(schema, null, 2);
      return `<script type="application/ld+json">\n${json}\n</script>`;
    } catch (e) {
      console.error("Schema JSON serialization failed:", e);
      return "";
    }
  }

  /**
   * Ensure URL is absolute with HTTPS protocol
   * @param {string} url - URL to convert
   * @returns {string} Absolute HTTPS URL
   * @private
   */
  _ensureAbsoluteUrl(url) {
    if (!url) return this.baseUrl;

    // If already absolute, ensure HTTPS
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url.replace("http://", "https://");
    }

    // Convert relative URL to absolute
    return `${this.baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }
}

export { SchemaGenerator };

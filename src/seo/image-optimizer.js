/**
 * Image Optimizer
 * Generates SEO-optimized image tags with ImageKit transformations
 */

class ImageOptimizer {
  constructor(env) {
    this.imagekitEndpoint = env.IMAGEKIT_URL_ENDPOINT;
  }

  /**
   * Generate optimized image tag
   * @param {Object} options - Image configuration
   * @param {string} options.src - Image URL
   * @param {string} options.alt - Alt text (10-125 chars)
   * @param {string} [options.title] - Title attribute (20-150 chars)
   * @param {number} [options.width] - Image width
   * @param {number} [options.height] - Image height
   * @param {boolean} [options.lazy=true] - Enable lazy loading
   * @param {boolean} [options.aboveFold=false] - Is image above the fold?
   * @param {string} [options.sizes] - Responsive sizes attribute
   * @returns {string} HTML img tag
   */
  generateImageTag(options) {
    const {
      src,
      alt,
      title,
      width,
      height,
      lazy = true,
      aboveFold = false,
      sizes,
    } = options;

    // Validate alt text
    const validatedAlt = this._validateAltText(alt);
    const escapedAlt = this._escapeHtml(validatedAlt);

    // Get optimized URL with transformations
    const optimizedSrc = this._getOptimizedUrl(src, width, height);

    // Build srcset for responsive images
    const srcset = this._generateSrcset(src, width);

    // Build image tag attributes
    const attrs = [];
    attrs.push(`src="${optimizedSrc}"`);
    attrs.push(`alt="${escapedAlt}"`);

    if (title) {
      const validatedTitle = this._validateTitle(title);
      if (validatedTitle) {
        attrs.push(`title="${this._escapeHtml(validatedTitle)}"`);
      }
    }

    if (width) attrs.push(`width="${width}"`);
    if (height) attrs.push(`height="${height}"`);

    // Lazy loading (skip for above-fold images)
    if (lazy && !aboveFold) {
      attrs.push(`loading="lazy"`);
    } else if (aboveFold) {
      attrs.push(`loading="eager"`);
    }

    // Responsive images
    if (srcset) {
      attrs.push(`srcset="${srcset}"`);
    }

    if (sizes) {
      attrs.push(`sizes="${sizes}"`);
    }

    return `<img ${attrs.join(" ")}>`;
  }

  /**
   * Validate alt text (10-125 characters)
   * Requirement 7.2: alt text must be between 10 and 125 characters
   * Requirement 7.4: prevent empty or placeholder alt text
   * @private
   */
  _validateAltText(alt) {
    if (!alt || alt.length < 10) {
      return "Product image"; // Fallback
    }
    if (alt.length > 125) {
      return alt.substring(0, 122) + "...";
    }
    // Prevent placeholder text
    const lowerAlt = alt.toLowerCase();
    if (
      lowerAlt === "image" ||
      lowerAlt === "photo" ||
      lowerAlt === "picture"
    ) {
      return "Product image";
    }
    return alt;
  }

  /**
   * Validate title attribute (20-150 characters)
   * Requirement 21.2: title attributes should be 20-150 chars
   * @private
   */
  _validateTitle(title) {
    if (!title || title.length < 20) return null;
    if (title.length > 150) return title.substring(0, 147) + "...";
    return title;
  }

  /**
   * Get optimized ImageKit URL with transformations
   * Requirement 8.4: request WebP format from ImageKit with automatic fallback
   * Requirement 8.6: apply ImageKit transformation parameters for automatic format selection (f-auto)
   * Requirement 8.7: apply ImageKit quality optimization (q-auto)
   * @private
   */
  _getOptimizedUrl(url, width, height) {
    if (!url || !url.includes("ik.imagekit.io")) return url;

    const transforms = [];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    transforms.push("f-auto"); // Auto format (WebP with fallback)
    transforms.push("q-auto"); // Auto quality
    transforms.push("c-at_max"); // Fit within dimensions

    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("tr", transforms.join(","));
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }

  /**
   * Generate srcset for responsive images
   * Requirement 8.5: generate srcset with multiple resolutions
   * @private
   */
  _generateSrcset(url, baseWidth) {
    if (!url || !baseWidth || !url.includes("ik.imagekit.io")) return null;

    const widths = [baseWidth, baseWidth * 2, baseWidth * 3]; // 1x, 2x, 3x
    const srcsetParts = widths.map((w, index) => {
      const optimizedUrl = this._getOptimizedUrl(url, w);
      return `${optimizedUrl} ${index + 1}x`;
    });

    return srcsetParts.join(", ");
  }

  /**
   * HTML escape to prevent XSS
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

export { ImageOptimizer };

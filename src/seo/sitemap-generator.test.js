import { SitemapGenerator } from "./sitemap-generator.js";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("SitemapGenerator", () => {
  let sitemapGenerator;
  let mockEnv;
  let mockDb;

  beforeEach(() => {
    // Mock database
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn(),
    };

    mockEnv = {
      DB: mockDb,
    };

    sitemapGenerator = new SitemapGenerator(mockEnv);
  });

  describe("constructor", () => {
    it("stores env and db references", () => {
      expect(sitemapGenerator.env).toBe(mockEnv);
      expect(sitemapGenerator.db).toBe(mockDb);
    });

    it("sets baseUrl to default value", () => {
      expect(sitemapGenerator.baseUrl).toBe("https://yourdomain.com");
    });

    it("sets maxUrls to 50000", () => {
      expect(sitemapGenerator.maxUrls).toBe(50000);
    });
  });

  describe("generateSitemap", () => {
    it("includes homepage in sitemap", async () => {
      mockDb.all.mockResolvedValueOnce({ results: [] }); // categories
      mockDb.all.mockResolvedValueOnce({ results: [] }); // products

      const sitemap = await sitemapGenerator.generateSitemap();

      expect(sitemap).toContain("<urlset");
      expect(sitemap).toContain(`<loc>${sitemapGenerator.baseUrl}</loc>`);
      expect(sitemap).toContain("<changefreq>daily</changefreq>");
      expect(sitemap).toMatch(/<priority>1(\.0)?<\/priority>/); // Match both 1 and 1.0
    });

    it("includes category pages in sitemap", async () => {
      const mockCategories = {
        results: [
          {
            name: "Electronics",
            updated_at: "2024-01-15T10:00:00Z",
          },
          {
            name: "Software",
            updated_at: "2024-01-14T15:30:00Z",
          },
        ],
      };

      mockDb.all
        .mockResolvedValueOnce(mockCategories) // categories
        .mockResolvedValueOnce({ results: [] }); // products

      const sitemap = await sitemapGenerator.generateSitemap();

      expect(sitemap).toContain(
        `<loc>${sitemapGenerator.baseUrl}/products?category=Electronics</loc>`,
      );
      expect(sitemap).toContain(
        `<loc>${sitemapGenerator.baseUrl}/products?category=Software</loc>`,
      );
      expect(sitemap).toContain("<priority>0.8</priority>");
      expect(sitemap).toContain("<changefreq>weekly</changefreq>");
    });

    it("includes product pages in sitemap", async () => {
      const mockProducts = {
        results: [
          {
            id: 1,
            name: "Product 1",
            slug: "product-1",
            updated_at: "2024-01-15T10:00:00Z",
          },
          {
            id: 2,
            name: "Product 2",
            slug: "product-2",
            updated_at: "2024-01-14T15:30:00Z",
          },
        ],
      };

      mockDb.all
        .mockResolvedValueOnce({ results: [] }) // categories
        .mockResolvedValueOnce(mockProducts); // products

      const sitemap = await sitemapGenerator.generateSitemap();

      expect(sitemap).toContain(
        `<loc>${sitemapGenerator.baseUrl}/products/product-1</loc>`,
      );
      expect(sitemap).toContain(
        `<loc>${sitemapGenerator.baseUrl}/products/product-2</loc>`,
      );
      expect(sitemap).toContain("<priority>0.6</priority>");
      expect(sitemap).toContain("<changefreq>monthly</changefreq>");
    });

    it("limits sitemap to 50000 URLs", async () => {
      const manyProducts = {
        results: Array.from({ length: 50005 }, (_, i) => ({
          id: i + 1,
          name: `Product ${i + 1}`,
          slug: `product-${i + 1}`,
          updated_at: new Date().toISOString(),
        })),
      };

      mockDb.all
        .mockResolvedValueOnce({ results: [] }) // categories
        .mockResolvedValueOnce(manyProducts); // products

      const sitemap = await sitemapGenerator.generateSitemap();

      // Count URL entries (1 homepage + up to 50000 products, minus 5 that should be excluded)
      const urlCount = (sitemap.match(/<url>/g) || []).length;
      expect(urlCount).toBeLessThanOrEqual(50000);
    });

    it("returns valid XML structure", async () => {
      mockDb.all
        .mockResolvedValueOnce({ results: [] }) // categories
        .mockResolvedValueOnce({ results: [] }); // products

      const sitemap = await sitemapGenerator.generateSitemap();

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(sitemap).toContain("</urlset>");
      expect(sitemap).toContain("<url>");
      expect(sitemap).toContain("</url>");
      expect(sitemap).toContain("<loc>");
      expect(sitemap).toContain("<lastmod>");
      expect(sitemap).toContain("<changefreq>");
      expect(sitemap).toContain("<priority>");
    });

    it("handles database errors gracefully", async () => {
      mockDb.all.mockRejectedValueOnce(new Error("DB Error"));
      mockDb.all.mockRejectedValueOnce(new Error("DB Error"));

      const sitemap = await sitemapGenerator.generateSitemap();

      // Should still include homepage even if categories/products fail
      expect(sitemap).toContain(`<loc>${sitemapGenerator.baseUrl}</loc>`);
      expect(sitemap).toContain("<urlset");
    });

    it("uses current date when updated_at is null", async () => {
      const mockProducts = {
        results: [
          {
            id: 1,
            name: "Product",
            slug: "product",
            updated_at: null,
          },
        ],
      };

      mockDb.all
        .mockResolvedValueOnce({ results: [] }) // categories
        .mockResolvedValueOnce(mockProducts); // products

      const sitemap = await sitemapGenerator.generateSitemap();

      // Should have a valid lastmod date
      expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    });
  });

  describe("_getCategoryPages", () => {
    it("returns category URLs with proper priority and changefreq", async () => {
      const mockCategories = {
        results: [
          {
            name: "Electronics",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
      };

      mockDb.all.mockResolvedValueOnce(mockCategories);

      const categories = await sitemapGenerator._getCategoryPages();

      expect(categories).toHaveLength(1);
      expect(categories[0].priority).toBe(0.8);
      expect(categories[0].changefreq).toBe("weekly");
      expect(categories[0].loc).toContain("/products?category=");
    });

    it("encodes category name in URL", async () => {
      const mockCategories = {
        results: [
          {
            name: "Electronics & Gadgets",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
      };

      mockDb.all.mockResolvedValueOnce(mockCategories);

      const categories = await sitemapGenerator._getCategoryPages();

      expect(categories[0].loc).toContain("Electronics%20%26%20Gadgets");
    });

    it("returns empty array on database error", async () => {
      mockDb.all.mockRejectedValueOnce(new Error("DB Error"));

      const categories = await sitemapGenerator._getCategoryPages();

      expect(categories).toEqual([]);
    });

    it("returns empty array when results is null", async () => {
      mockDb.all.mockResolvedValueOnce(null);

      const categories = await sitemapGenerator._getCategoryPages();

      expect(categories).toEqual([]);
    });
  });

  describe("_getProductPages", () => {
    it("returns product URLs with proper priority and changefreq", async () => {
      const mockProducts = {
        results: [
          {
            id: 123,
            name: "Test Product",
            slug: "test-product",
            updated_at: "2024-01-15T10:00:00Z",
          },
        ],
      };

      mockDb.all.mockResolvedValueOnce(mockProducts);

      const products = await sitemapGenerator._getProductPages();

      expect(products).toHaveLength(1);
      expect(products[0].priority).toBe(0.6);
      expect(products[0].changefreq).toBe("monthly");
      expect(products[0].loc).toContain("/products/test-product");
    });

    it("returns empty array on database error", async () => {
      mockDb.all.mockRejectedValueOnce(new Error("DB Error"));

      const products = await sitemapGenerator._getProductPages();

      expect(products).toEqual([]);
    });

    it("returns empty array when results is null", async () => {
      mockDb.all.mockResolvedValueOnce(null);

      const products = await sitemapGenerator._getProductPages();

      expect(products).toEqual([]);
    });
  });

  describe("_escapeXml", () => {
    it("escapes ampersands", () => {
      const result = sitemapGenerator._escapeXml("Product & Accessories");
      expect(result).toBe("Product &amp; Accessories");
    });

    it("escapes less-than symbols", () => {
      const result = sitemapGenerator._escapeXml("10 < 20");
      expect(result).toBe("10 &lt; 20");
    });

    it("escapes greater-than symbols", () => {
      const result = sitemapGenerator._escapeXml("20 > 10");
      expect(result).toBe("20 &gt; 10");
    });

    it("escapes double quotes", () => {
      const result = sitemapGenerator._escapeXml('Product "Premium"');
      expect(result).toBe("Product &quot;Premium&quot;");
    });

    it("escapes single quotes", () => {
      const result = sitemapGenerator._escapeXml("Product 'Deluxe'");
      expect(result).toBe("Product &apos;Deluxe&apos;");
    });

    it("escapes multiple special characters", () => {
      const result = sitemapGenerator._escapeXml(
        'Product & "Test" < > Value\'s',
      );
      expect(result).toBe(
        "Product &amp; &quot;Test&quot; &lt; &gt; Value&apos;s",
      );
    });

    it("handles empty string", () => {
      const result = sitemapGenerator._escapeXml("");
      expect(result).toBe("");
    });

    it("returns empty string for null/undefined", () => {
      expect(sitemapGenerator._escapeXml(null)).toBe("");
      expect(sitemapGenerator._escapeXml(undefined)).toBe("");
    });

    it("does not escape safe characters", () => {
      const result = sitemapGenerator._escapeXml("Product Name 123");
      expect(result).toBe("Product Name 123");
    });
  });

  describe("_generateXML", () => {
    it("generates valid XML structure", () => {
      const urls = [
        {
          loc: "https://example.com/",
          lastmod: "2024-01-15",
          changefreq: "daily",
          priority: 1.0,
        },
      ];

      const xml = sitemapGenerator._generateXML(urls);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(xml).toContain("<url>");
      expect(xml).toContain("<loc>https://example.com/</loc>");
      expect(xml).toContain("<lastmod>2024-01-15</lastmod>");
      expect(xml).toContain("<changefreq>daily</changefreq>");
      expect(xml).toMatch(/<priority>1(\.0)?<\/priority>/); // Match both 1 and 1.0
      expect(xml).toContain("</url>");
      expect(xml).toContain("</urlset>");
    });

    it("generates XML for multiple URLs", () => {
      const urls = [
        {
          loc: "https://example.com/",
          lastmod: "2024-01-15",
          changefreq: "daily",
          priority: 1.0,
        },
        {
          loc: "https://example.com/products/1",
          lastmod: "2024-01-14",
          changefreq: "monthly",
          priority: 0.6,
        },
      ];

      const xml = sitemapGenerator._generateXML(urls);

      const urlCount = (xml.match(/<url>/g) || []).length;
      expect(urlCount).toBe(2);
    });

    it("escapes special characters in URLs", () => {
      const urls = [
        {
          loc: "https://example.com/products?category=Electronics & Gadgets",
          lastmod: "2024-01-15",
          changefreq: "daily",
          priority: 1.0,
        },
      ];

      const xml = sitemapGenerator._generateXML(urls);

      expect(xml).toContain("&amp;");
      expect(xml).not.toContain("Electronics & Gadgets");
    });

    it("handles empty URL array", () => {
      const xml = sitemapGenerator._generateXML([]);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("</urlset>");
      expect(xml).not.toContain("<url>");
    });
  });
});

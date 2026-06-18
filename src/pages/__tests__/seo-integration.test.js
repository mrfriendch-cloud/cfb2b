import { describe, test, expect, vi, beforeEach } from "vitest";
import { productDetailPage } from "../product-detail.js";
import { homePage } from "../home.js";
import { productsPage } from "../products.js";
import { aboutPage } from "../about.js";
import { contactPage } from "../contact.js";

describe("SEO Routing and Meta Tag Injection Integration Tests", () => {
  let mockDb;
  let mockEnv;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    };

    mockEnv = {
      DB: mockDb,
      BASE_URL: "https://example.com",
      STATIC_ASSETS: {
        get: vi.fn().mockResolvedValue(null),
      },
    };
  });

  describe("productDetailPage", () => {
    test("redirects numeric ID request to SEO slug URL (301)", async () => {
      const mockProduct = { id: 45, name: "Special Widget", price: 10.99 };
      const mockSlugRow = { slug: "special-widget" };

      mockDb.first
        .mockResolvedValueOnce(mockProduct) // SELECT * FROM products WHERE id = ?
        .mockResolvedValueOnce(mockSlugRow); // SELECT slug FROM product_slugs WHERE product_id = ?

      const request = { url: "https://example.com/products/45" };
      const response = await productDetailPage(request, mockEnv);

      expect(response.status).toBe(301);
      expect(response.headers.get("Location")).toBe("/products/special-widget");
    });

    test("generates slug on-demand if missing for numeric ID and redirects", async () => {
      const mockProduct = { id: 45, name: "Special Widget", price: 10.99 };

      mockDb.first
        .mockResolvedValueOnce(mockProduct) // SELECT * FROM products WHERE id = ?
        .mockResolvedValueOnce(null) // SELECT slug FROM product_slugs WHERE product_id = ?
        .mockResolvedValueOnce({ count: 0 }); // slugExists check (count)

      const request = { url: "https://example.com/products/45" };
      const response = await productDetailPage(request, mockEnv);

      expect(response.status).toBe(301);
      expect(response.headers.get("Location")).toBe("/products/special-widget");
      // Verify slug was saved
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR REPLACE INTO product_slugs"),
      );
    });

    test("renders product details page with meta tags and combined graph schema", async () => {
      const mockProduct = {
        id: 45,
        name: "Special Widget",
        description: "This is a special widget",
        price: 10.99,
        image_url: "/img.jpg",
        quantity: 5,
      };
      const mockSlugRow = { product_id: 45 };

      mockDb.first
        .mockResolvedValueOnce(mockSlugRow) // SELECT product_id FROM product_slugs WHERE slug = ?
        .mockResolvedValueOnce(mockProduct); // SELECT * FROM products WHERE id = ?

      const request = { url: "https://example.com/products/special-widget" };
      const response = await productDetailPage(request, mockEnv);

      expect(response.status).toBe(200);
      const html = await response.text();

      // Verify metadata tags are present
      expect(html).toContain("<title>Special Widget</title>");
      expect(html).toContain('<meta name="description" content="This is a special widget">');
      expect(html).toContain('<link rel="canonical" href="https://example.com/products/special-widget">');
      expect(html).toContain('<meta property="og:title" content="Special Widget">');
      expect(html).toContain('<meta property="og:type" content="product">');

      // Verify combined schema.org JSON-LD
      expect(html).toContain('"@type": "Product"');
      expect(html).toContain('"@type": "BreadcrumbList"');
      expect(html).toContain('"@graph"');
    });
  });

  describe("homePage", () => {
    test("renders homepage with organization schema, website schema, and meta tags", async () => {
      const mockSettings = {
        site_name: "Kazakh Cotton Co",
        site_description: "Kazakhstan wholesale knitted garment store",
      };
      mockEnv.STATIC_ASSETS.get.mockResolvedValueOnce(JSON.stringify(mockSettings));

      const response = await homePage(mockEnv);
      expect(response.status).toBe(200);
      const html = await response.text();

      expect(html).toContain("<title>Kazakh Cotton Co</title>");
      expect(html).toContain('<meta name="description" content="Kazakhstan wholesale knitted garment store">');
      expect(html).toContain('"@type": "Organization"');
      expect(html).toContain('"@type": "WebSite"');
    });
  });

  describe("productsPage", () => {
    test("renders products list with ItemList schema and BreadcrumbList schema", async () => {
      const mockProducts = {
        results: [
          { id: 1, name: "Product A", slug: "product-a" },
          { id: 2, name: "Product B", slug: "product-b" },
        ],
      };
      mockDb.all.mockResolvedValueOnce(mockProducts); // active products query

      const response = await productsPage(mockEnv);
      expect(response.status).toBe(200);
      const html = await response.text();

      expect(html).toContain("<title>Products - B2B Product Exhibition</title>");
      expect(html).toContain('"@type": "ItemList"');
      expect(html).toContain('"@type": "BreadcrumbList"');
      expect(html).toContain("https://example.com/products/product-a");
    });
  });

  describe("aboutPage and contactPage", () => {
    test("aboutPage renders with BreadcrumbList schema", async () => {
      const response = await aboutPage(mockEnv);
      expect(response.status).toBe(200);
      const html = await response.text();

      expect(html).toContain("<title>About Us - B2B Product Exhibition</title>");
      expect(html).toContain('"@type": "BreadcrumbList"');
      expect(html).toContain("https://example.com/about");
    });

    test("contactPage renders with BreadcrumbList schema", async () => {
      const response = await contactPage(mockEnv);
      expect(response.status).toBe(200);
      const html = await response.text();

      expect(html).toContain("<title>Contact Us - B2B Product Exhibition</title>");
      expect(html).toContain('"@type": "BreadcrumbList"');
      expect(html).toContain("https://example.com/contact");
    });
  });
});

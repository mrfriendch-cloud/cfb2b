/**
 * Unit tests for SchemaGenerator - Product Schema
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { SchemaGenerator } from "./schema-generator.js";

// Mock environment
const mockEnv = {
  BASE_URL: "https://example.com",
};

describe("SchemaGenerator - Product Schema", () => {
  let generator;

  beforeEach(() => {
    generator = new SchemaGenerator(mockEnv);
  });

  test("should generate Product schema with all required properties", () => {
    const product = {
      id: 123,
      name: "Industrial Widget",
      description: "High-quality industrial widget",
      image_url: "https://ik.imagekit.io/demo/widget.jpg",
      quantity: 10,
      price: 99.99,
    };

    const productUrl = "https://example.com/products/123";
    const result = generator.generateProductSchema(product, productUrl);

    // Should return a script tag
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain("</script>");

    // Parse the JSON-LD content
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    expect(jsonMatch).toBeTruthy();

    const schema = JSON.parse(jsonMatch[1]);

    // Verify Product schema structure
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBe("Industrial Widget");
    expect(schema.description).toBe("High-quality industrial widget");
    expect(schema.sku).toBe("123");
    expect(schema.image).toBe("https://ik.imagekit.io/demo/widget.jpg");

    // Verify brand
    expect(schema.brand).toBeDefined();
    expect(schema.brand["@type"]).toBe("Brand");
    expect(schema.brand.name).toBe("B2B Product Exhibition");

    // Verify offers
    expect(schema.offers).toBeDefined();
    expect(schema.offers["@type"]).toBe("Offer");
    expect(schema.offers.url).toBe(productUrl);
    expect(schema.offers.priceCurrency).toBe("USD");
    expect(schema.offers.price).toBe(99.99);
    expect(schema.offers.availability).toBe("https://schema.org/InStock");
  });

  test("should map quantity > 0 to InStock", () => {
    const product = {
      id: 1,
      name: "Test Product",
      quantity: 5,
      price: 10,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/1",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.offers.availability).toBe("https://schema.org/InStock");
  });

  test("should map quantity = 0 to OutOfStock", () => {
    const product = {
      id: 2,
      name: "Out of Stock Product",
      quantity: 0,
      price: 20,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/2",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  test("should use detailed_description if description is missing", () => {
    const product = {
      id: 3,
      name: "Product with detailed description",
      detailed_description: "This is a detailed description",
      quantity: 1,
      price: 30,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/3",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.description).toBe("This is a detailed description");
  });

  test("should include image when image_url is provided", () => {
    const product = {
      id: 4,
      name: "Product with image",
      image_url: "/images/product.jpg",
      quantity: 1,
      price: 40,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/4",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.image).toBe("https://example.com/images/product.jpg");
  });

  test("should omit image when image_url is not provided", () => {
    const product = {
      id: 5,
      name: "Product without image",
      quantity: 1,
      price: 50,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/5",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.image).toBeUndefined();
  });

  test("should use product.id as SKU", () => {
    const product = {
      id: 999,
      name: "SKU Test Product",
      quantity: 1,
      price: 60,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/999",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.sku).toBe("999");
  });

  test("should include offers.price and offers.priceCurrency", () => {
    const product = {
      id: 6,
      name: "Price Test Product",
      quantity: 1,
      price: 123.45,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/6",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.offers.price).toBe(123.45);
    expect(schema.offers.priceCurrency).toBe("USD");
  });

  test("should include offers.url as productUrl", () => {
    const product = {
      id: 7,
      name: "URL Test Product",
      quantity: 1,
      price: 70,
    };

    const productUrl = "https://example.com/products/test-product-7";
    const result = generator.generateProductSchema(product, productUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.offers.url).toBe(productUrl);
  });

  test("should validate schema and skip invalid Product schema", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const invalidProduct = {
      // Missing name - required for Product schema
      id: 8,
      quantity: 1,
      price: 80,
    };

    const result = generator.generateProductSchema(
      invalidProduct,
      "https://example.com/products/8",
    );

    // Should return empty string for invalid schema
    expect(result).toBe("");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid Product schema, skipping",
    );

    consoleErrorSpy.mockRestore();
  });

  test("should convert relative image URLs to absolute HTTPS URLs", () => {
    const product = {
      id: 9,
      name: "Relative URL Test",
      image_url: "/images/relative.jpg",
      quantity: 1,
      price: 90,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/9",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.image).toBe("https://example.com/images/relative.jpg");
  });

  test("should convert HTTP image URLs to HTTPS", () => {
    const product = {
      id: 10,
      name: "HTTP to HTTPS Test",
      image_url: "http://example.com/images/http.jpg",
      quantity: 1,
      price: 100,
    };

    const result = generator.generateProductSchema(
      product,
      "https://example.com/products/10",
    );
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.image).toBe("https://example.com/images/http.jpg");
  });
});

describe("SchemaGenerator - Organization Schema", () => {
  let generator;

  beforeEach(() => {
    generator = new SchemaGenerator(mockEnv);
  });

  test("should generate Organization schema with required properties", () => {
    const settings = {
      site_name: "B2B Product Exhibition",
      logo_url: "https://example.com/images/logo.png",
      email: "info@example.com",
      phone: "+1-555-123-4567",
    };

    const result = generator.generateOrganizationSchema(settings);

    // Should return a script tag
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain("</script>");

    // Parse the JSON-LD content
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    expect(jsonMatch).toBeTruthy();

    const schema = JSON.parse(jsonMatch[1]);

    // Verify Organization schema structure
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("B2B Product Exhibition");
    expect(schema.url).toBe("https://example.com");
    expect(schema.logo).toBe("https://example.com/images/logo.png");
  });

  test("should include contactPoint with email and phone", () => {
    const settings = {
      site_name: "Test Company",
      logo_url: "/logo.png",
      email: "contact@test.com",
      phone: "+1-800-555-0100",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.contactPoint).toBeDefined();
    expect(schema.contactPoint["@type"]).toBe("ContactPoint");
    expect(schema.contactPoint.contactType).toBe("Customer Service");
    expect(schema.contactPoint.email).toBe("contact@test.com");
    expect(schema.contactPoint.telephone).toBe("+1-800-555-0100");
  });

  test("should use default site_name when not provided", () => {
    const settings = {
      logo_url: "/logo.png",
      email: "info@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.name).toBe("B2B Product Exhibition");
  });

  test("should use default logo_url when not provided", () => {
    const settings = {
      site_name: "Test Company",
      email: "info@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.logo).toBe("https://example.com/images/logo.png");
  });

  test("should convert relative logo URL to absolute HTTPS", () => {
    const settings = {
      site_name: "Company",
      logo_url: "/images/logo.png",
      email: "info@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.logo).toBe("https://example.com/images/logo.png");
  });

  test("should convert HTTP logo URL to HTTPS", () => {
    const settings = {
      site_name: "Company",
      logo_url: "http://example.com/logo.png",
      email: "info@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.logo).toBe("https://example.com/logo.png");
  });

  test("should use baseUrl as organization url", () => {
    const settings = {
      site_name: "Test Org",
      logo_url: "/logo.png",
      email: "info@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.url).toBe("https://example.com");
  });

  test("should generate valid JSON-LD for homepage", () => {
    const settings = {
      site_name: "B2B Marketplace",
      logo_url: "https://example.com/assets/logo.svg",
      email: "support@example.com",
      phone: "+1-888-123-4567",
    };

    const result = generator.generateOrganizationSchema(settings);

    // Verify it's valid JSON-LD
    expect(result).toContain('<script type="application/ld+json">');
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    expect(jsonMatch).toBeTruthy();

    // Should not throw error when parsing
    expect(() => {
      JSON.parse(jsonMatch[1]);
    }).not.toThrow();
  });

  test("should validate Organization schema before wrapping in script tag", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Test with incomplete settings - should still validate as Organization
    const settings = {
      email: "test@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);

    // Should still return valid script tag with defaults
    expect(result).toContain('<script type="application/ld+json">');
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Should have both required fields
    expect(schema.name).toBeDefined();
    expect(schema.url).toBeDefined();

    consoleErrorSpy.mockRestore();
  });

  test("should handle empty settings object with all defaults", () => {
    const settings = {};

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.name).toBe("B2B Product Exhibition");
    expect(schema.url).toBe("https://example.com");
    expect(schema.logo).toBe("https://example.com/images/logo.png");
    expect(schema.contactPoint).toBeDefined();
  });

  test("should preserve ContactPoint structure", () => {
    const settings = {
      site_name: "Professional Services",
      logo_url: "/branding/logo.png",
      email: "hello@professional.com",
      phone: "+1-212-555-1212",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Verify ContactPoint is properly structured
    expect(schema.contactPoint["@type"]).toBe("ContactPoint");
    expect(schema.contactPoint.contactType).toBe("Customer Service");
    expect(schema.contactPoint.email).toBe("hello@professional.com");
    expect(schema.contactPoint.telephone).toBe("+1-212-555-1212");

    // Verify it's not nested in other objects
    expect(Array.isArray(schema.contactPoint)).toBe(false);
  });

  test("should format logo URL correctly for ImageKit", () => {
    const settings = {
      site_name: "ImageKit Test",
      logo_url: "https://ik.imagekit.io/demo/logo.svg",
      email: "info@example.com",
      phone: "+1-555-0000",
    };

    const result = generator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Should preserve ImageKit URLs with HTTPS
    expect(schema.logo).toBe("https://ik.imagekit.io/demo/logo.svg");
  });

  test("should handle different BaseUrl environments", () => {
    const customEnv = {
      BASE_URL: "https://shop.mycompany.co.uk",
    };
    const customGenerator = new SchemaGenerator(customEnv);

    const settings = {
      site_name: "UK Store",
      logo_url: "/assets/logo.png",
      email: "uk@store.com",
      phone: "+44-20-7123-4567",
    };

    const result = customGenerator.generateOrganizationSchema(settings);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.url).toBe("https://shop.mycompany.co.uk");
    expect(schema.logo).toBe("https://shop.mycompany.co.uk/assets/logo.png");
  });
});

describe("SchemaGenerator - BreadcrumbList Schema", () => {
  let generator;

  beforeEach(() => {
    generator = new SchemaGenerator(mockEnv);
  });

  test("should generate BreadcrumbList schema with ordered items", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" },
      { name: "Electronics", url: "/products?category=electronics" },
    ];

    const result = generator.generateBreadcrumbSchema(breadcrumbs);

    // Should return a script tag
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain("</script>");

    // Parse the JSON-LD content
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    expect(jsonMatch).toBeTruthy();

    const schema = JSON.parse(jsonMatch[1]);

    // Verify BreadcrumbList schema structure
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toBeDefined();
    expect(schema.itemListElement.length).toBe(3);

    // Verify first breadcrumb
    expect(schema.itemListElement[0]["@type"]).toBe("ListItem");
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe("Home");
    expect(schema.itemListElement[0].item).toBe("https://example.com/");

    // Verify second breadcrumb
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].name).toBe("Products");
    expect(schema.itemListElement[1].item).toBe("https://example.com/products");

    // Verify third breadcrumb
    expect(schema.itemListElement[2].position).toBe(3);
    expect(schema.itemListElement[2].name).toBe("Electronics");
    expect(schema.itemListElement[2].item).toBe(
      "https://example.com/products?category=electronics",
    );
  });

  test("should include position, name, and item properties for each breadcrumb", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Category", url: "/category" },
    ];

    const result = generator.generateBreadcrumbSchema(breadcrumbs);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    schema.itemListElement.forEach((item, index) => {
      expect(item).toHaveProperty("@type");
      expect(item).toHaveProperty("position");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("item");
      expect(item.position).toBe(index + 1); // 1-indexed
    });
  });

  test("should convert relative URLs to absolute HTTPS URLs", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" },
    ];

    const result = generator.generateBreadcrumbSchema(breadcrumbs);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.itemListElement[0].item).toBe("https://example.com/");
    expect(schema.itemListElement[1].item).toBe("https://example.com/products");
  });

  test("should return empty string for empty breadcrumbs array", () => {
    const result = generator.generateBreadcrumbSchema([]);
    expect(result).toBe("");
  });

  test("should return empty string for null breadcrumbs", () => {
    const result = generator.generateBreadcrumbSchema(null);
    expect(result).toBe("");
  });

  test("should return empty string for undefined breadcrumbs", () => {
    const result = generator.generateBreadcrumbSchema(undefined);
    expect(result).toBe("");
  });

  test("should handle product page breadcrumbs with category hierarchy", () => {
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Electronics", url: "/products?category=electronics" },
      { name: "Laptop", url: "/products/123" },
    ];

    const result = generator.generateBreadcrumbSchema(breadcrumbs);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.itemListElement.length).toBe(3);
    expect(schema.itemListElement[2].name).toBe("Laptop");
    expect(schema.itemListElement[2].position).toBe(3);
  });
});

describe("SchemaGenerator - ItemList Schema", () => {
  let generator;

  beforeEach(() => {
    generator = new SchemaGenerator(mockEnv);
  });

  test("should generate ItemList schema for category pages", () => {
    const products = [
      { id: 1, name: "Product 1" },
      { id: 2, name: "Product 2" },
      { id: 3, name: "Product 3" },
    ];
    const categoryUrl = "/products?category=electronics";

    const result = generator.generateItemListSchema(products, categoryUrl);

    // Should return a script tag
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain("</script>");

    // Parse the JSON-LD content
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    expect(jsonMatch).toBeTruthy();

    const schema = JSON.parse(jsonMatch[1]);

    // Verify ItemList schema structure
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("ItemList");
    expect(schema.url).toBe(
      "https://example.com/products?category=electronics",
    );
    expect(schema.numberOfItems).toBe(3);
    expect(schema.itemListElement).toBeDefined();
    expect(schema.itemListElement.length).toBe(3);
  });

  test("should set numberOfItems to match actual product count", () => {
    const products = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    const categoryUrl = "/products";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.numberOfItems).toBe(5);
    expect(schema.itemListElement.length).toBe(5);
  });

  test("should include itemListElement with position and url for each product", () => {
    const products = [{ id: 101 }, { id: 102 }];
    const categoryUrl = "/products";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Verify first product
    expect(schema.itemListElement[0]["@type"]).toBe("ListItem");
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].url).toBe(
      "https://example.com/products/101",
    );

    // Verify second product
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[1].url).toBe(
      "https://example.com/products/102",
    );
  });

  test("should use slug if available instead of ID", () => {
    const products = [
      { id: 1, slug: "awesome-product" },
      { id: 2, slug: "another-product" },
    ];
    const categoryUrl = "/products";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.itemListElement[0].url).toBe(
      "https://example.com/products/awesome-product",
    );
    expect(schema.itemListElement[1].url).toBe(
      "https://example.com/products/another-product",
    );
  });

  test("should fall back to ID if slug is not available", () => {
    const products = [
      { id: 99 }, // No slug
    ];
    const categoryUrl = "/products";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.itemListElement[0].url).toBe(
      "https://example.com/products/99",
    );
  });

  test("should convert product URLs to absolute HTTPS format", () => {
    const products = [{ id: 1 }, { id: 2 }];
    const categoryUrl = "/products?category=test";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    schema.itemListElement.forEach((item) => {
      expect(item.url).toMatch(/^https:\/\//);
    });
  });

  test("should convert category URL to absolute HTTPS format", () => {
    const products = [{ id: 1 }];
    const categoryUrl = "/products";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.url).toBe("https://example.com/products");
  });

  test("should return empty string for empty products array", () => {
    const result = generator.generateItemListSchema([], "/products");
    expect(result).toBe("");
  });

  test("should return empty string for null products", () => {
    const result = generator.generateItemListSchema(null, "/products");
    expect(result).toBe("");
  });

  test("should return empty string for undefined products", () => {
    const result = generator.generateItemListSchema(undefined, "/products");
    expect(result).toBe("");
  });

  test("should handle single product in list", () => {
    const products = [{ id: 1, name: "Only Product" }];
    const categoryUrl = "/products";

    const result = generator.generateItemListSchema(products, categoryUrl);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema.numberOfItems).toBe(1);
    expect(schema.itemListElement.length).toBe(1);
    expect(schema.itemListElement[0].position).toBe(1);
  });
});

describe("SchemaGenerator - Multi-Schema Support (@graph)", () => {
  let generator;

  beforeEach(() => {
    generator = new SchemaGenerator(mockEnv);
  });

  test("should generate multi-schema with @graph wrapper", () => {
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Test Product",
      offers: {
        "@type": "Offer",
        price: 99.99,
        priceCurrency: "USD",
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://example.com/",
        },
      ],
    };

    const result = generator.generateMultiSchema([
      productSchema,
      breadcrumbSchema,
    ]);

    // Should return a script tag
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain("</script>");

    // Parse the JSON-LD content
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    expect(jsonMatch).toBeTruthy();

    const schema = JSON.parse(jsonMatch[1]);

    // Verify @graph structure
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@graph"]).toBeDefined();
    expect(Array.isArray(schema["@graph"])).toBe(true);
    expect(schema["@graph"].length).toBe(2);

    // Verify both schemas are present in @graph
    expect(schema["@graph"][0]["@type"]).toBe("Product");
    expect(schema["@graph"][1]["@type"]).toBe("BreadcrumbList");
  });

  test("should filter out invalid schemas (missing @type)", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const validSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Valid Product",
      offers: {
        "@type": "Offer",
        price: 50,
      },
    };

    const invalidSchema = {
      "@context": "https://schema.org",
      // Missing @type
      name: "Invalid Schema",
    };

    const result = generator.generateMultiSchema([validSchema, invalidSchema]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Only valid schema should be included
    expect(schema["@graph"].length).toBe(1);
    expect(schema["@graph"][0]["@type"]).toBe("Product");

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing @type"),
    );

    consoleErrorSpy.mockRestore();
  });

  test("should filter out invalid Product schemas (missing required properties)", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const validProduct = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Valid Product",
      offers: {
        "@type": "Offer",
        price: 100,
      },
    };

    const invalidProduct = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Invalid Product",
      // Missing offers - required for Product
    };

    const result = generator.generateMultiSchema([
      validProduct,
      invalidProduct,
    ]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Only valid Product should be included
    expect(schema["@graph"].length).toBe(1);
    expect(schema["@graph"][0].name).toBe("Valid Product");
    expect(schema["@graph"][0].offers).toBeDefined();

    // Error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid Product schema skipped"),
    );

    consoleErrorSpy.mockRestore();
  });

  test("should filter out invalid Organization schemas (missing required properties)", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const validOrg = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Valid Organization",
      url: "https://example.com",
    };

    const invalidOrg1 = {
      "@context": "https://schema.org",
      "@type": "Organization",
      // Missing name
      url: "https://example.com",
    };

    const invalidOrg2 = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Invalid Org",
      // Missing url
    };

    const result = generator.generateMultiSchema([
      validOrg,
      invalidOrg1,
      invalidOrg2,
    ]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Only valid Organization should be included
    expect(schema["@graph"].length).toBe(1);
    expect(schema["@graph"][0].name).toBe("Valid Organization");
    expect(schema["@graph"][0].url).toBe("https://example.com");

    // Errors should be logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid Organization schema skipped"),
    );

    consoleErrorSpy.mockRestore();
  });

  test("should skip non-object schemas", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const validSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Valid Product",
      offers: {
        "@type": "Offer",
        price: 75,
      },
    };

    const result = generator.generateMultiSchema([
      validSchema,
      null,
      undefined,
      "invalid string",
      123,
    ]);

    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Only valid schema should be included
    expect(schema["@graph"].length).toBe(1);
    expect(schema["@graph"][0]["@type"]).toBe("Product");

    // Errors should be logged for invalid inputs
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("not an object"),
    );

    consoleErrorSpy.mockRestore();
  });

  test("should return empty string when all schemas are invalid", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const invalidSchema1 = {
      "@context": "https://schema.org",
      // Missing @type
      name: "Invalid",
    };

    const invalidSchema2 = {
      "@context": "https://schema.org",
      "@type": "Product",
      // Missing required properties
      description: "No name or offers",
    };

    const result = generator.generateMultiSchema([
      invalidSchema1,
      invalidSchema2,
    ]);

    expect(result).toBe("");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "No valid schemas to generate multi-schema output",
    );

    consoleErrorSpy.mockRestore();
  });

  test("should return empty string for empty schemas array", () => {
    const result = generator.generateMultiSchema([]);
    expect(result).toBe("");
  });

  test("should return empty string for null schemas", () => {
    const result = generator.generateMultiSchema(null);
    expect(result).toBe("");
  });

  test("should return empty string for undefined schemas", () => {
    const result = generator.generateMultiSchema(undefined);
    expect(result).toBe("");
  });

  test("should handle mix of valid Product and BreadcrumbList schemas", () => {
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Laptop",
      offers: {
        "@type": "Offer",
        price: 999.99,
        priceCurrency: "USD",
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://example.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Products",
          item: "https://example.com/products",
        },
      ],
    };

    const result = generator.generateMultiSchema([
      productSchema,
      breadcrumbSchema,
    ]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema["@graph"].length).toBe(2);
    expect(schema["@graph"][0]["@type"]).toBe("Product");
    expect(schema["@graph"][0].name).toBe("Laptop");
    expect(schema["@graph"][1]["@type"]).toBe("BreadcrumbList");
    expect(schema["@graph"][1].itemListElement.length).toBe(2);
  });

  test("should handle three schemas (Product, BreadcrumbList, Organization)", () => {
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Widget",
      offers: {
        "@type": "Offer",
        price: 49.99,
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://example.com/",
        },
      ],
    };

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Test Company",
      url: "https://example.com",
    };

    const result = generator.generateMultiSchema([
      productSchema,
      breadcrumbSchema,
      organizationSchema,
    ]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema["@graph"].length).toBe(3);
    expect(schema["@graph"][0]["@type"]).toBe("Product");
    expect(schema["@graph"][1]["@type"]).toBe("BreadcrumbList");
    expect(schema["@graph"][2]["@type"]).toBe("Organization");
  });

  test("should preserve all schema properties in @graph", () => {
    const detailedProductSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Advanced Widget",
      description: "High-quality widget with advanced features",
      image: "https://example.com/images/widget.jpg",
      sku: "12345",
      brand: {
        "@type": "Brand",
        name: "WidgetCo",
      },
      offers: {
        "@type": "Offer",
        price: 199.99,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    };

    const result = generator.generateMultiSchema([detailedProductSchema]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    const productInGraph = schema["@graph"][0];
    expect(productInGraph.name).toBe("Advanced Widget");
    expect(productInGraph.description).toBe(
      "High-quality widget with advanced features",
    );
    expect(productInGraph.image).toBe("https://example.com/images/widget.jpg");
    expect(productInGraph.sku).toBe("12345");
    expect(productInGraph.brand.name).toBe("WidgetCo");
    expect(productInGraph.offers.price).toBe(199.99);
    expect(productInGraph.offers.availability).toBe(
      "https://schema.org/InStock",
    );
  });

  test("should not break page rendering when invalid schemas are present", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const validSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Valid",
      offers: { "@type": "Offer", price: 50 },
    };

    const invalidSchemas = [
      null,
      undefined,
      {},
      { "@type": "Product" }, // Missing required props
      { name: "No type" }, // Missing @type
    ];

    // This should not throw an error
    const result = generator.generateMultiSchema([
      validSchema,
      ...invalidSchemas,
    ]);

    // Should still return valid output with the one valid schema
    expect(result).toContain('<script type="application/ld+json">');
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    expect(schema["@graph"].length).toBe(1);
    expect(schema["@graph"][0].name).toBe("Valid");

    consoleErrorSpy.mockRestore();
  });

  test("should validate other schema types as valid (pass through)", () => {
    // Non-Product, non-Organization schemas should pass validation
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      url: "https://example.com/products",
      numberOfItems: 5,
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://example.com",
      name: "Test Site",
    };

    const result = generator.generateMultiSchema([
      itemListSchema,
      websiteSchema,
    ]);
    const jsonMatch = result.match(
      /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/,
    );
    const schema = JSON.parse(jsonMatch[1]);

    // Both should be included (no specific validation for these types)
    expect(schema["@graph"].length).toBe(2);
    expect(schema["@graph"][0]["@type"]).toBe("ItemList");
    expect(schema["@graph"][1]["@type"]).toBe("WebSite");
  });
});

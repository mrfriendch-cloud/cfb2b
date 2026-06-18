/**
 * Usage Examples for SchemaGenerator - Multi-Schema Support
 *
 * This file demonstrates how to use the generateMultiSchema() method
 * to combine multiple schemas into a single @graph JSON-LD script.
 */

import { SchemaGenerator } from "./schema-generator.js";

/**
 * Example 1: Combining Product and Breadcrumb schemas on a product page
 */
export function productPageWithBreadcrumbs(env, product, breadcrumbs) {
  const generator = new SchemaGenerator(env);
  const productUrl = `${generator.baseUrl}/products/${product.id}`;

  // Create individual schema objects (not HTML strings)
  const productSchemaObj = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.detailed_description || "",
    sku: product.id.toString(),
    brand: {
      "@type": "Brand",
      name: "B2B Product Exhibition",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: product.price || 0,
      availability:
        product.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  if (product.image_url) {
    productSchemaObj.image = generator._ensureAbsoluteUrl(product.image_url);
  }

  const breadcrumbSchemaObj = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: generator._ensureAbsoluteUrl(crumb.url),
    })),
  };

  // Combine into single @graph output
  return generator.generateMultiSchema([productSchemaObj, breadcrumbSchemaObj]);
}

/**
 * Example 2: Homepage with Organization and multiple schemas
 */
export function homepageWithMultipleSchemas(env, settings) {
  const generator = new SchemaGenerator(env);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.site_name || "B2B Product Exhibition",
    url: generator.baseUrl,
    logo: generator._ensureAbsoluteUrl(settings.logo_url || "/images/logo.png"),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: settings.email,
      telephone: settings.phone,
    },
  };

  // Optional: Add WebSite schema for search functionality
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.site_name || "B2B Product Exhibition",
    url: generator.baseUrl,
  };

  return generator.generateMultiSchema([organizationSchema, websiteSchema]);
}

/**
 * Example 3: Category page with ItemList and Breadcrumbs
 */
export function categoryPageWithSchemas(
  env,
  categoryName,
  products,
  breadcrumbs,
) {
  const generator = new SchemaGenerator(env);
  const categoryUrl = `${generator.baseUrl}/products?category=${encodeURIComponent(categoryName)}`;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: categoryUrl,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => {
      const productPath = product.slug
        ? `/products/${product.slug}`
        : `/products/${product.id}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: generator._ensureAbsoluteUrl(productPath),
      };
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: generator._ensureAbsoluteUrl(crumb.url),
    })),
  };

  return generator.generateMultiSchema([itemListSchema, breadcrumbSchema]);
}

/**
 * Example 4: Handling invalid schemas gracefully
 *
 * The generateMultiSchema method will:
 * - Skip schemas that are not objects
 * - Skip schemas missing required properties
 * - Log errors for debugging
 * - Return empty string if no valid schemas remain
 */
export function safeMultiSchemaGeneration(env, potentialSchemas) {
  const generator = new SchemaGenerator(env);

  // This will filter out any invalid schemas automatically
  // Invalid schemas are logged to console.error but won't break the page
  return generator.generateMultiSchema(potentialSchemas);
}

/**
 * Integration Example: In a page handler
 */
export async function exampleProductPageHandler(request, env) {
  const generator = new SchemaGenerator(env);

  // Fetch product data
  const product = await getProductById(env, productId);

  // Build breadcrumbs
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: product.category, url: `/products?category=${product.category}` },
    { name: product.name, url: `/products/${product.id}` },
  ];

  // Method 1: Using individual methods and combining manually
  const productSchemaHtml = generator.generateProductSchema(
    product,
    `${generator.baseUrl}/products/${product.id}`,
  );
  const breadcrumbSchemaHtml = generator.generateBreadcrumbSchema(breadcrumbs);

  // Method 2: Using generateMultiSchema (RECOMMENDED)
  // Build schema objects first
  const productSchemaObj = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    // ... other properties
  };

  const breadcrumbSchemaObj = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: generator._ensureAbsoluteUrl(crumb.url),
    })),
  };

  // Combine into single JSON-LD with @graph
  const combinedSchema = generator.generateMultiSchema([
    productSchemaObj,
    breadcrumbSchemaObj,
  ]);

  // Inject into HTML <head>
  return new Response(html`
    <!DOCTYPE html>
    <html>
      <head>
        ${combinedSchema}
        <!-- other meta tags -->
      </head>
      <body>
        <!-- page content -->
      </body>
    </html>
  `);
}

// Dummy function for example
async function getProductById(env, id) {
  return {
    id: 1,
    name: "Sample Product",
    description: "Sample description",
    quantity: 10,
    price: 99.99,
    category: "Electronics",
  };
}

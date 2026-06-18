/**
 * Example: Using SchemaGenerator to create Product schema
 *
 * This demonstrates how to use the generateProductSchema() method
 * for product detail pages.
 */

import { SchemaGenerator } from "../src/seo/schema-generator.js";

// Mock environment (in real usage, this comes from Cloudflare Workers env)
const env = {
  BASE_URL: "https://b2bcasablanca.com",
};

// Initialize the generator
const schemaGenerator = new SchemaGenerator(env);

// Example 1: Product with full details (In Stock)
const inStockProduct = {
  id: 42,
  name: "Industrial Precision Bearing",
  description: "High-precision industrial bearing suitable for heavy machinery",
  image_url: "https://ik.imagekit.io/demo/bearing-industrial.jpg",
  quantity: 25,
  price: 149.99,
};

console.log("Example 1: In Stock Product");
console.log("=".repeat(60));
const inStockSchema = schemaGenerator.generateProductSchema(
  inStockProduct,
  "https://b2bcasablanca.com/products/industrial-precision-bearing",
);
console.log(inStockSchema);
console.log();

// Example 2: Product with zero quantity (Out of Stock)
const outOfStockProduct = {
  id: 87,
  name: "Premium Steel Fasteners Set",
  description: "Complete set of premium grade steel fasteners",
  image_url: "/images/fasteners-set.jpg", // Relative URL will be converted to absolute
  quantity: 0, // Out of stock
  price: 79.99,
};

console.log("Example 2: Out of Stock Product");
console.log("=".repeat(60));
const outOfStockSchema = schemaGenerator.generateProductSchema(
  outOfStockProduct,
  "https://b2bcasablanca.com/products/premium-steel-fasteners",
);
console.log(outOfStockSchema);
console.log();

// Example 3: Product using detailed_description (no regular description)
const detailedProduct = {
  id: 156,
  name: "Hydraulic Cylinder Assembly",
  detailed_description:
    "Professional-grade hydraulic cylinder assembly with 3000 PSI rating",
  image_url: "https://ik.imagekit.io/demo/hydraulic-cylinder.jpg",
  quantity: 8,
  price: 899.0,
};

console.log("Example 3: Product with detailed_description");
console.log("=".repeat(60));
const detailedSchema = schemaGenerator.generateProductSchema(
  detailedProduct,
  "https://b2bcasablanca.com/products/hydraulic-cylinder-assembly",
);
console.log(detailedSchema);
console.log();

// Example 4: Product without image
const noImageProduct = {
  id: 201,
  name: "Custom Machined Part",
  description: "Custom CNC machined parts to your specifications",
  quantity: 100,
  price: 25.5,
  // No image_url provided
};

console.log("Example 4: Product without image");
console.log("=".repeat(60));
const noImageSchema = schemaGenerator.generateProductSchema(
  noImageProduct,
  "https://b2bcasablanca.com/products/custom-machined-part",
);
console.log(noImageSchema);
console.log();

// Example 5: Complete usage in a page handler
console.log("Example 5: Complete Page Integration");
console.log("=".repeat(60));

function generateProductPage(product) {
  const productUrl = `https://b2bcasablanca.com/products/${product.id}`;
  const productSchema = schemaGenerator.generateProductSchema(
    product,
    productUrl,
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${product.name} | B2B Casablanca</title>
  <meta name="description" content="${product.description || product.detailed_description}">
  
  <!-- Product Schema -->
  ${productSchema}
</head>
<body>
  <h1>${product.name}</h1>
  <p>${product.description || product.detailed_description}</p>
  <p>Price: $${product.price}</p>
  <p>Availability: ${product.quantity > 0 ? "In Stock" : "Out of Stock"}</p>
</body>
</html>
  `.trim();
}

const exampleProduct = {
  id: 999,
  name: "Test Product for Integration",
  description: "This demonstrates full page integration",
  image_url: "https://ik.imagekit.io/demo/test.jpg",
  quantity: 5,
  price: 199.99,
};

console.log(generateProductPage(exampleProduct));

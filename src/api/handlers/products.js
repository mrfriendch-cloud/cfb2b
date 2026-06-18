/**
 * Products API Handler
 * Handles all product-related API requests
 */

import { requireAuth } from "./admin";

export async function handleProducts(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split("/").filter(Boolean);

  // GET /api/products - Get all products
  if (method === "GET" && pathParts.length === 2) {
    return getAllProducts(env, corsHeaders, request);
  }

  // GET /api/products/featured - Get featured products
  if (method === "GET" && pathParts[2] === "featured") {
    return getFeaturedProducts(env, corsHeaders);
  }

  // GET /api/products/:id - Get single product
  if (method === "GET" && pathParts.length === 3) {
    const productId = pathParts[2];
    return getProduct(env, productId, corsHeaders, request);
  }

  // POST /api/products - Create new product (Admin only)
  if (method === "POST" && pathParts.length === 2) {
    return createProduct(request, env, corsHeaders);
  }

  // PUT /api/products/:id - Update product (Admin only)
  if (method === "PUT" && pathParts.length === 3) {
    const productId = pathParts[2];
    return updateProduct(request, env, productId, corsHeaders);
  }

  // DELETE /api/products/:id - Delete product (Admin only)
  if (method === "DELETE" && pathParts.length === 3) {
    const productId = pathParts[2];
    return deleteProduct(request, env, productId, corsHeaders);
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Get all products
async function getAllProducts(env, corsHeaders, request) {
  try {
    // Check if this is an authenticated admin request
    const authHeader = request?.headers?.get("Authorization");
    const isAdmin = authHeader && authHeader.startsWith("Bearer ");

    // Admin can see all products, public can only see active ones
    let query;
    if (isAdmin) {
      query = env.DB.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.created_at DESC
      `);
    } else {
      query = env.DB.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1 
        ORDER BY p.created_at DESC
      `);
    }

    const { results } = await query.all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Get featured products
async function getFeaturedProducts(env, corsHeaders) {
  try {
    const { results } = await env.DB.prepare(
      `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_featured = 1 AND p.is_active = 1 
      LIMIT 6
    `,
    ).all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Get single product
async function getProduct(env, productId, corsHeaders, request) {
  try {
    // Check if this is an authenticated admin request
    const authHeader = request?.headers?.get("Authorization");
    const isAdmin = authHeader && authHeader.startsWith("Bearer ");

    // Admin can see all products, public can only see active ones
    let query;
    if (isAdmin) {
      query = env.DB.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?
      `);
    } else {
      query = env.DB.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ? AND p.is_active = 1
      `);
    }

    const product = await query.bind(productId).first();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: product }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Create new product (Super Admin only)
async function createProduct(request, env, corsHeaders) {
  try {
    // Check if user is super admin
    const admin = await requireAuth(request, env);
    if (!admin) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Admin access required.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      name,
      description,
      detailed_description,
      image_url,
      gallery_images,
      category_id,
      price,
      quantity,
      is_featured,
      is_active,
    } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const galleryJson = Array.isArray(gallery_images)
      ? JSON.stringify(gallery_images)
      : "[]";

    const result = await env.DB.prepare(
      `INSERT INTO products (
        name, description, detailed_description, 
        image_url, gallery_images, category_id, price, quantity, is_featured, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        name,
        description || null,
        detailed_description || null,
        image_url || null,
        galleryJson,
        category_id !== "" && category_id !== null && category_id !== undefined
          ? parseInt(category_id)
          : null,
        price !== "" && price !== null && price !== undefined
          ? parseFloat(price)
          : null,
        quantity !== "" && quantity !== null && quantity !== undefined
          ? parseInt(quantity)
          : null,
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0,
      )
      .run();

    const productId = result.meta.last_row_id;

    // Generate and save SEO slug
    try {
      const { URLManager } = await import("../../seo/url-manager");
      const urlManager = new URLManager(env);
      const baseSlug = urlManager.generateSlug(name);
      const uniqueSlug = await urlManager.ensureUniqueSlug(baseSlug);
      await urlManager.saveProductSlug(productId, uniqueSlug);
    } catch (slugError) {
      console.error("Error generating SEO slug:", slugError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: productId },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Update product (Super Admin only)
async function updateProduct(request, env, productId, corsHeaders) {
  try {
    // Check if user is super admin
    const admin = await requireAuth(request, env);
    if (!admin) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Admin access required.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      name,
      description,
      detailed_description,
      image_url,
      gallery_images,
      category_id,
      price,
      quantity,
      is_featured,
      is_active,
    } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const galleryJson = Array.isArray(gallery_images)
      ? JSON.stringify(gallery_images)
      : "[]";

    // Check if name changed to update SEO slug and create redirects
    let nameChanged = false;
    let oldSlug = "";
    try {
      const oldProduct = await env.DB.prepare("SELECT name FROM products WHERE id = ?").bind(productId).first();
      if (oldProduct && oldProduct.name !== name) {
        nameChanged = true;
        const slugRow = await env.DB.prepare("SELECT slug FROM product_slugs WHERE product_id = ?").bind(productId).first();
        if (slugRow && slugRow.slug) {
          oldSlug = slugRow.slug;
        }
      }
    } catch (e) {
      console.error("Error checking old product name for slug redirect:", e);
    }

    await env.DB.prepare(
      `UPDATE products SET
        name = ?,
        description = ?,
        detailed_description = ?,
        image_url = ?,
        gallery_images = ?,
        category_id = ?,
        price = ?,
        quantity = ?,
        is_featured = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
      .bind(
        name,
        description || null,
        detailed_description || null,
        image_url || null,
        galleryJson,
        category_id !== "" && category_id !== null && category_id !== undefined
          ? parseInt(category_id)
          : null,
        price !== "" && price !== null && price !== undefined
          ? parseFloat(price)
          : null,
        quantity !== "" && quantity !== null && quantity !== undefined
          ? parseInt(quantity)
          : null,
        is_featured ? 1 : 0,
        is_active !== false ? 1 : 0,
        productId,
      )
      .run();

    // Generate new slug and create 301 redirects if needed
    if (nameChanged) {
      try {
        const { URLManager } = await import("../../seo/url-manager");
        const urlManager = new URLManager(env);
        const baseSlug = urlManager.generateSlug(name);
        const uniqueSlug = await urlManager.ensureUniqueSlug(baseSlug, productId);
        
        if (oldSlug && oldSlug !== uniqueSlug) {
          await urlManager.createRedirect(`/products/${oldSlug}`, `/products/${uniqueSlug}`);
        }
        
        await urlManager.saveProductSlug(productId, uniqueSlug);
      } catch (slugError) {
        console.error("Error updating SEO slug:", slugError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Delete product (Super Admin only - soft delete)
async function deleteProduct(request, env, productId, corsHeaders) {
  try {
    // Check if user is admin
    const admin = await requireAuth(request, env);
    if (!admin) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Admin access required.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    await env.DB.prepare(
      "UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(productId)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

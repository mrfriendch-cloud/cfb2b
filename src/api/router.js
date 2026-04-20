/**
 * API Router - handles all backend API requests
 */

export async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS request
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Settings API
    if (path.startsWith("/api/settings")) {
      const { handleSettings } = await import("./handlers/settings");
      return handleSettings(request, env, corsHeaders);
    }

    // Migration API
    if (path.startsWith("/api/migrate")) {
      const { handleMigrate } = await import("./handlers/migrate");
      return handleMigrate(request, env, corsHeaders);
    }

    // Upload API
    if (path.startsWith("/api/upload")) {
      const { handleUpload } = await import("./handlers/upload");
      return handleUpload(request, env, corsHeaders);
    }

    // Categories API
    if (path.startsWith("/api/categories")) {
      const { handleCategories } = await import("./handlers/categories");
      return handleCategories(request, env, corsHeaders);
    }

    // Products API
    if (path.startsWith("/api/products")) {
      const { handleProducts } = await import("./handlers/products");
      return handleProducts(request, env, corsHeaders);
    }

    // Inquiries API
    if (path.startsWith("/api/inquiries")) {
      const { handleInquiries } = await import("./handlers/inquiries");
      return handleInquiries(request, env, corsHeaders);
    }

    // Chat API
    if (path.startsWith("/api/chat")) {
      const { handleChat } = await import("./handlers/chat");
      return handleChat(request, env, corsHeaders);
    }

    // Admin API
    if (path.startsWith("/api/admin")) {
      const { handleAdmin } = await import("./handlers/admin");
      return handleAdmin(request, env, corsHeaders);
    }

    // 404 Not Found
    return new Response(JSON.stringify({ error: "API endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

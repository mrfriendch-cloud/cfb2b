/**
 * Settings API Handler
 * Handles website settings stored in Cloudflare KV
 */

import { requireAuth } from "./admin";

const SETTINGS_KEY = "website_settings";

export async function handleSettings(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;

  // GET /api/settings - Get all settings
  if (method === "GET") {
    return getSettings(env, corsHeaders);
  }

  // POST /api/settings - Update settings (Admin only)
  if (method === "POST") {
    return updateSettings(request, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Get settings from KV
async function getSettings(env, corsHeaders) {
  try {
    const settingsJson = await env.STATIC_ASSETS.get(SETTINGS_KEY);

    let settings = {};
    if (settingsJson) {
      settings = JSON.parse(settingsJson);
    } else {
      // Default settings if not found
      settings = {
        site_name: "GlobalMart",
        site_description:
          "Your trusted partner for high-quality industrial products and innovative solutions worldwide",
        company_intro:
          "We are a leading manufacturer and supplier of high-quality industrial products. With over 20 years of experience, we serve clients across the globe with innovative solutions and exceptional customer service.",
        email: "info@example.com",
        phone: "+1 234 567 8900",
        address: "123 Business St, City, Country",
        linkedin: "",
        facebook: "",
        twitter: "",
      };
    }

    // Ensure chat_widget_mode is always present, defaulting to "live_chat"
    if (!settings.chat_widget_mode) {
      settings.chat_widget_mode = "live_chat";
    }

    return new Response(JSON.stringify({ success: true, data: settings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Update settings in KV (Admin only)
async function updateSettings(request, env, corsHeaders) {
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

    const data = await request.json();

    // Read existing KV value so we can preserve fields absent from the POST body
    const existingJson = await env.STATIC_ASSETS.get(SETTINGS_KEY);
    const existing = existingJson ? JSON.parse(existingJson) : {};

    // Build new settings object
    const settings = {
      site_name: data.site_name || "GlobalMart",
      site_description: data.site_description || "",
      company_intro: data.company_intro || "",
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
      linkedin: data.linkedin || "",
      facebook: data.facebook || "",
      twitter: data.twitter || "",
      updated_at: new Date().toISOString(),
    };

    // Include chat_widget_mode: use POST body value if present, otherwise preserve stored value,
    // falling back to the default "live_chat" if neither exists
    if (data.chat_widget_mode !== undefined) {
      settings.chat_widget_mode = data.chat_widget_mode;
    } else {
      settings.chat_widget_mode = existing.chat_widget_mode || "live_chat";
    }

    // Save to KV
    await env.STATIC_ASSETS.put(SETTINGS_KEY, JSON.stringify(settings));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Settings saved successfully",
        data: settings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating settings:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * Upload API Handler
 * Handles file uploads to ImageKit.io (with R2 as backup)
 */

import { uploadToImageKit } from "../../utils/imagekit";

export async function handleUpload(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split("/").filter(Boolean);

  // POST /api/upload/image - Upload image
  if (method === "POST" && pathParts[2] === "image") {
    return uploadImage(request, env, corsHeaders);
  }

  // GET /api/upload/image/:key - Get image URL (Legacy support for R2)
  // key can be multi-part like products/123-abc.jpg
  if (method === "GET" && pathParts[2] === "image" && pathParts[3]) {
    // Reconstruct the full key from remaining path parts
    const key = pathParts.slice(3).join("/");
    return getImageUrl(key, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Upload image to ImageKit.io
async function uploadImage(request, env, corsHeaders) {
  try {
    // TODO: Add authentication check for admin only

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
    ];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, OGG, MOV, AVI.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate file size (5MB for images, 100MB for videos)
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: isVideo
            ? "Video too large. Maximum size is 100MB."
            : "File too large. Maximum size is 5MB.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate unique filename for R2 backup
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop() || "jpg";
    const key = `products/${timestamp}-${randomStr}.${extension}`;

    // 1. Upload to ImageKit (Primary)
    let imageUrl;
    let imageKitData = null;
    try {
      imageKitData = await uploadToImageKit(file, file.name, env);
      imageUrl = imageKitData.url;
    } catch (ikError) {
      console.error("ImageKit upload error:", ikError);
      throw new Error(`ImageKit upload failed: ${ikError.message}`);
    }

    // R2 backup upload removed (ImageKit only)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: imageUrl,
          key: key,
          imageKitId: imageKitData?.fileId,
          size: file.size,
          type: file.type,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

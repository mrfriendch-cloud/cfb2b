/**
 * Upload API Handler
 * Handles file uploads to ImageKit.io (with R2 as backup)
 */

import { uploadToImageKit } from '../../utils/imagekit';

export async function handleUpload(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /api/upload/image - Upload image
  if (method === 'POST' && pathParts[2] === 'image') {
    return uploadImage(request, env, corsHeaders);
  }

  // GET /api/upload/image/:key - Get image URL (Legacy support for R2)
  // key can be multi-part like products/123-abc.jpg
  if (method === 'GET' && pathParts[2] === 'image' && pathParts[3]) {
    // Reconstruct the full key from remaining path parts
    const key = pathParts.slice(3).join('/');
    return getImageUrl(key, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Upload image to ImageKit.io
async function uploadImage(request, env, corsHeaders) {
  try {
    // TODO: Add authentication check for admin only

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        error: 'File too large. Maximum size is 5MB.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename for R2 backup
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const key = `products/${timestamp}-${randomStr}.${extension}`;

    // 1. Upload to ImageKit (Primary)
    let imageUrl;
    let imageKitData = null;
    try {
      imageKitData = await uploadToImageKit(file, file.name, env);
      imageUrl = imageKitData.url;
    } catch (ikError) {
      console.error('ImageKit upload error:', ikError);
      throw new Error(`ImageKit upload failed: ${ikError.message}`);
    }

    // 2. Upload to R2 (Backup)
    try {
      if (env.IMAGES) {
        await env.IMAGES.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });
      }
    } catch (r2Error) {
      console.error('R2 backup upload error:', r2Error);
      // Don't fail the whole request if only backup fails
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        url: imageUrl,
        key: key,
        imageKitId: imageKitData?.fileId,
        size: file.size,
        type: file.type,
      },
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get image from R2 (Legacy support)
async function getImageUrl(key, env, corsHeaders) {
  try {
    if (!env.IMAGES) {
      return new Response('R2 storage not configured', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const object = await env.IMAGES.get(key);

    if (!object) {
      return new Response('Image not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    const headers = {
      ...corsHeaders,
      'Content-Type': object.httpMetadata.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': object.etag,
    };

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Get image error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

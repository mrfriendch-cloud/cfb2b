/**
 * Upload API Handler
 * Handles file uploads to Cloudflare R2
 */

export async function handleUpload(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /api/upload/image - Upload image
  if (method === 'POST' && pathParts[2] === 'image') {
    return uploadImage(request, env, corsHeaders);
  }

  // GET /api/upload/image/:key - Get image URL
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

// Upload image to R2
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

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const key = `products/${timestamp}-${randomStr}.${extension}`;

    // Upload to R2
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate public URL
    const imageUrl = `/api/upload/image/${key}`;

    return new Response(JSON.stringify({
      success: true,
      data: {
        url: imageUrl,
        key: key,
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

// Get image from R2
async function getImageUrl(key, env, corsHeaders) {
  try {
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

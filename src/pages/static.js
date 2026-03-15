/**
 * Static assets handler
 * Serves CSS, JS, and image files from the public directory
 */

// In-memory storage for static files (for production, consider using KV or R2)
const staticFiles = new Map();

// Helper function to get content type
function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    'css': 'text/css',
    'js': 'application/javascript',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
  };
  return types[ext] || 'application/octet-stream';
}

export async function handleStaticAssets(request, defaultContentType) {
  const url = new URL(request.url);
  const path = url.pathname;

  // For now, return a placeholder response
  // In production, you would read files from KV storage or R2
  return new Response('Static file serving will be implemented with KV or R2', {
    status: 200,
    headers: {
      'Content-Type': defaultContentType || getContentType(path),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// Function to register static files (to be called during build)
export function registerStaticFile(path, content, contentType) {
  staticFiles.set(path, { content, contentType });
}

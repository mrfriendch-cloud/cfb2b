/**
 * ImageKit.io Utility Functions
 */

/**
 * Upload a file to ImageKit.io using the REST API
 * @param {File|Blob|string} file - The file to upload (File, Blob, or Base64 string)
 * @param {string} fileName - The name of the file
 * @param {object} env - Cloudflare Workers environment variables
 * @returns {Promise<object>} - The upload response from ImageKit
 */
export async function uploadToImageKit(file, fileName, env) {
  const privateKey = env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('IMAGEKIT_PRIVATE_KEY is not configured');
  }

  // Create Basic Auth header
  const authHeader = `Basic ${btoa(privateKey + ':')}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('useUniqueFileName', 'true');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit upload failed: ${errorText}`);
  }

  return await response.json();
}

/**
 * Generate an optimized ImageKit URL with transformations
 * @param {string} path - The path of the image or full URL
 * @param {object} options - Transformation options (width, height, quality, etc.)
 * @param {object} env - Cloudflare Workers environment variables
 * @returns {string} - The optimized URL
 */
export function getImageKitUrl(path, options = {}, env) {
  const urlEndpoint = env.IMAGEKIT_URL_ENDPOINT;
  if (!urlEndpoint) {
    return path; // Fallback to original path if not configured
  }

  // If it's a full URL and doesn't start with our endpoint, return as is
  if (path.startsWith('http') && !path.startsWith(urlEndpoint)) {
    return path;
  }

  // Ensure path is just the relative part if it's already an ImageKit URL
  const relativePath = path.replace(urlEndpoint, '').replace(/^\//, '');

  const transformations = [];
  if (options.width) transformations.push(`w-${options.width}`);
  if (options.height) transformations.push(`h-${options.height}`);
  if (options.quality) transformations.push(`q-${options.quality}`);
  if (options.format) transformations.push(`f-${options.format}`);
  if (options.blur) transformations.push(`bl-${options.blur}`);
  if (options.crop) transformations.push(`cm-${options.crop}`);

  const trParam = transformations.length > 0 ? `?tr=${transformations.join(',')}` : '';
  
  // Construct the final URL
  const baseUrl = urlEndpoint.endsWith('/') ? urlEndpoint : `${urlEndpoint}/`;
  return `${baseUrl}${relativePath}${trParam}`;
}

/**
 * Delete a file from ImageKit.io
 * @param {string} fileId - The unique fileId of the image in ImageKit
 * @param {object} env - Cloudflare Workers environment variables
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export async function deleteFromImageKit(fileId, env) {
  const privateKey = env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('IMAGEKIT_PRIVATE_KEY is not configured');
  }

  const authHeader = `Basic ${btoa(privateKey + ':')}`;

  const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': authHeader,
    },
  });

  return response.status === 204;
}

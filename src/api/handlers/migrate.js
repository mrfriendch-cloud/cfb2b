/**
 * Migration API Handler
 * Migrates images from Cloudflare R2 to ImageKit.io
 */

import { uploadToImageKit } from '../../utils/imagekit';

export async function handleMigrate(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;

  // Only allow POST for migration
  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // TODO: Add super admin auth check here

  const results = {
    products: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    categories: { total: 0, migrated: 0, skipped: 0, failed: 0 },
    errors: []
  };

  try {
    // 1. Migrate Categories
    const { results: categories } = await env.DB.prepare('SELECT id, image_url FROM categories').all();
    results.categories.total = categories.length;

    for (const category of categories) {
      if (category.image_url && category.image_url.startsWith('/api/upload/image/')) {
        try {
          const key = category.image_url.replace('/api/upload/image/', '');
          const newUrl = await migrateFile(key, env);
          
          if (newUrl) {
            await env.DB.prepare('UPDATE categories SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .bind(newUrl, category.id)
              .run();
            results.categories.migrated++;
          } else {
            results.categories.skipped++;
          }
        } catch (error) {
          results.categories.failed++;
          results.errors.push(`Category ${category.id}: ${error.message}`);
        }
      } else {
        results.categories.skipped++;
      }
    }

    // 2. Migrate Products
    const { results: products } = await env.DB.prepare('SELECT id, image_url, gallery_images FROM products').all();
    results.products.total = products.length;

    for (const product of products) {
      let updated = false;
      let newImageUrl = product.image_url;

      // Migrate main image
      if (product.image_url && product.image_url.startsWith('/api/upload/image/')) {
        try {
          const key = product.image_url.replace('/api/upload/image/', '');
          const migratedUrl = await migrateFile(key, env);
          if (migratedUrl) {
            newImageUrl = migratedUrl;
            updated = true;
          }
        } catch (error) {
          results.errors.push(`Product ${product.id} main image: ${error.message}`);
        }
      }

      // Migrate gallery images
      let newGalleryImages = [];
      let galleryUpdated = false;
      if (product.gallery_images) {
        try {
          const gallery = JSON.parse(product.gallery_images);
          if (Array.isArray(gallery)) {
            for (const item of gallery) {
              if (typeof item === 'string' && item.startsWith('/api/upload/image/')) {
                const key = item.replace('/api/upload/image/', '');
                const migratedUrl = await migrateFile(key, env);
                if (migratedUrl) {
                  newGalleryImages.push(migratedUrl);
                  galleryUpdated = true;
                } else {
                  newGalleryImages.push(item);
                }
              } else {
                newGalleryImages.push(item);
              }
            }
          }
        } catch (error) {
          results.errors.push(`Product ${product.id} gallery: ${error.message}`);
        }
      }

      if (updated || galleryUpdated) {
        try {
          await env.DB.prepare('UPDATE products SET image_url = ?, gallery_images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(newImageUrl, galleryUpdated ? JSON.stringify(newGalleryImages) : product.gallery_images, product.id)
            .run();
          results.products.migrated++;
        } catch (error) {
          results.products.failed++;
          results.errors.push(`Product ${product.id} update failed: ${error.message}`);
        }
      } else {
        results.products.skipped++;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, results }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Helper to migrate a single file from R2 to ImageKit
 */
async function migrateFile(key, env) {
  if (!env.IMAGES) return null;

  const object = await env.IMAGES.get(key);
  if (!object) return null;

  const blob = await object.blob();
  const fileName = key.split('/').pop() || 'image.jpg';
  
  const uploadResponse = await uploadToImageKit(blob, fileName, env);
  return uploadResponse.url;
}

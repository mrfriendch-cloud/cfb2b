/**
 * Categories API Handler
 * Handles CRUD operations for categories
 */

export async function handleCategories(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;

  // Static options response
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET /api/categories - List all categories
    if (method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM categories ORDER BY name ASC'
      ).all();
      
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authentication check for POST, PUT, DELETE
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/categories - Create a new category
    if (method === 'POST') {
      const data = await request.json();
      const { name, description, image_url } = data;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await env.DB.prepare(
        'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)'
      ).bind(name, description || null, image_url || null).run();

      return new Response(JSON.stringify({ 
        success: true, 
        id: result.meta.last_row_id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /api/categories - Update an existing category
    if (method === 'PUT') {
      const data = await request.json();
      const { id, name, description, image_url } = data;

      if (!id || !name) {
        return new Response(JSON.stringify({ error: 'ID and Name are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await env.DB.prepare(
        'UPDATE categories SET name = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(name, description || null, image_url || null, id).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/categories?id=1 - Delete a category
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Category ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if products exist in this category before deleting
      const productsCheck = await env.DB.prepare(
        'SELECT count(*) as count FROM products WHERE category_id = ?'
      ).bind(id).first();

      if (productsCheck.count > 0) {
        return new Response(JSON.stringify({ error: 'Cannot delete category with existing products. Reassign or delete the products first.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Handle uniqueness constraint violation for names
    if (error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'A category with this name already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

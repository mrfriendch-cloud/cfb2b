/**
 * Inquiries API Handler
 * Handles all inquiry-related API requests
 */

import { requireSuperAdmin } from './admin';

export async function handleInquiries(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /api/inquiries - Submit new inquiry
  if (method === 'POST' && pathParts.length === 2) {
    return createInquiry(request, env, corsHeaders);
  }

  // GET /api/inquiries - Get all inquiries (Admin only)
  if (method === 'GET' && pathParts.length === 2) {
    return getAllInquiries(env, corsHeaders);
  }

  // GET /api/inquiries/:id - Get single inquiry (Admin only)
  if (method === 'GET' && pathParts.length === 3) {
    const inquiryId = pathParts[2];
    return getInquiry(env, inquiryId, corsHeaders);
  }

  // PUT /api/inquiries/:id/status - Update inquiry status (Admin only)
  if (method === 'PUT' && pathParts.length === 4 && pathParts[3] === 'status') {
    const inquiryId = pathParts[2];
    return updateInquiryStatus(request, env, inquiryId, corsHeaders);
  }

  // DELETE /api/inquiries/:id - Delete inquiry (Super Admin only)
  if (method === 'DELETE' && pathParts.length === 3) {
    const inquiryId = pathParts[2];
    return deleteInquiry(request, env, inquiryId, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Create new inquiry
async function createInquiry(request, env, corsHeaders) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return new Response(JSON.stringify({
        error: 'Name, email, and message are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(JSON.stringify({
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await env.DB.prepare(
      `INSERT INTO inquiries (product_id, name, email, company, phone, country, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      data.product_id || null,
      data.name,
      data.email,
      data.company || null,
      data.phone || null,
      data.country || null,
      data.message,
      'pending'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Inquiry submitted successfully',
      data: { id: result.meta.last_row_id }
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get all inquiries (Admin only)
async function getAllInquiries(env, corsHeaders) {
  try {
    // TODO: Add authentication check

    const { results } = await env.DB.prepare(
      `SELECT i.*, p.name as product_name
       FROM inquiries i
       LEFT JOIN products p ON i.product_id = p.id
       ORDER BY i.created_at DESC`
    ).all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get single inquiry (Admin only)
async function getInquiry(env, inquiryId, corsHeaders) {
  try {
    // TODO: Add authentication check

    const inquiry = await env.DB.prepare(
      `SELECT i.*, p.name as product_name
       FROM inquiries i
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.id = ?`
    ).bind(inquiryId).first();

    if (!inquiry) {
      return new Response(JSON.stringify({ error: 'Inquiry not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: inquiry }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Update inquiry status (Admin only)
async function updateInquiryStatus(request, env, inquiryId, corsHeaders) {
  try {
    // TODO: Add authentication check
    const data = await request.json();

    const validStatuses = ['pending', 'processing', 'completed'];
    if (!data.status || !validStatuses.includes(data.status)) {
      return new Response(JSON.stringify({
        error: 'Invalid status. Must be: pending, processing, or completed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare(
      'UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(data.status, inquiryId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Inquiry status updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Delete inquiry (Super Admin only)
async function deleteInquiry(request, env, inquiryId, corsHeaders) {
  try {
    // Check if user is super admin
    const admin = await requireSuperAdmin(request, env);
    if (!admin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized. Super admin access required.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare(
      'DELETE FROM inquiries WHERE id = ?'
    ).bind(inquiryId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Inquiry deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

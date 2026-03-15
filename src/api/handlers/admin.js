/**
 * Admin API Handler
 * Handles admin authentication and admin-specific operations
 */

import { hashPassword, verifyPassword, generateToken, verifyToken } from '../../utils/auth';

const JWT_SECRET = 'your-secret-key-change-this-in-production'; // TODO: Move to environment variable

export async function handleAdmin(request, env, corsHeaders) {
  const url = new URL(request.url);
  const method = request.method;
  const pathParts = url.pathname.split('/').filter(Boolean);

  // POST /api/admin/login - Admin login
  if (method === 'POST' && pathParts[2] === 'login') {
    return adminLogin(request, env, corsHeaders);
  }

  // POST /api/admin/verify - Verify token
  if (method === 'POST' && pathParts[2] === 'verify') {
    return verifyAdminToken(request, env, corsHeaders);
  }

  // POST /api/admin/logout - Admin logout
  if (method === 'POST' && pathParts[2] === 'logout') {
    return adminLogout(request, env, corsHeaders);
  }

  // GET /api/admin/stats - Get dashboard statistics (Admin only)
  if (method === 'GET' && pathParts[2] === 'stats') {
    return getDashboardStats(request, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Admin login
async function adminLogin(request, env, corsHeaders) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get admin user
    const admin = await env.DB.prepare(
      'SELECT * FROM admins WHERE username = ?'
    ).bind(username).first();

    if (!admin) {
      return new Response(JSON.stringify({
        error: 'Invalid username or password'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({
        error: 'Invalid username or password'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last login
    await env.DB.prepare(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(admin.id).run();

    // Generate JWT token
    const token = await generateToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }, JWT_SECRET);

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
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

// Verify admin token
async function verifyAdminToken(request, env, corsHeaders) {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({
        error: 'Token is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await verifyToken(token, JWT_SECRET);

    if (!payload) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get admin user
    const admin = await env.DB.prepare(
      'SELECT id, username, email, role FROM admins WHERE id = ?'
    ).bind(payload.id).first();

    if (!admin) {
      return new Response(JSON.stringify({
        error: 'User not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: { user: admin },
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

// Admin logout
async function adminLogout(request, env, corsHeaders) {
  // Client-side will handle removing the token
  return new Response(JSON.stringify({
    success: true,
    message: 'Logged out successfully',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get dashboard statistics
async function getDashboardStats(request, env, corsHeaders) {
  try {
    // TODO: Add authentication check

    // Get total products
    const { total_products } = await env.DB.prepare(
      'SELECT COUNT(*) as total_products FROM products WHERE is_active = 1'
    ).first();

    // Get total inquiries
    const { total_inquiries } = await env.DB.prepare(
      'SELECT COUNT(*) as total_inquiries FROM inquiries'
    ).first();

    // Get pending inquiries
    const { pending_inquiries } = await env.DB.prepare(
      'SELECT COUNT(*) as pending_inquiries FROM inquiries WHERE status = "pending"'
    ).first();

    // Get recent inquiries
    const { results: recent_inquiries } = await env.DB.prepare(
      `SELECT i.*, p.name as product_name
       FROM inquiries i
       LEFT JOIN products p ON i.product_id = p.id
       ORDER BY i.created_at DESC
       LIMIT 5`
    ).all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        total_products,
        total_inquiries,
        pending_inquiries,
        recent_inquiries,
      },
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

// Helper function to check authentication
export async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token, JWT_SECRET);

  if (!payload) {
    return null;
  }

  // Get admin with role
  const admin = await env.DB.prepare(
    'SELECT id, username, email, role FROM admins WHERE id = ?'
  ).bind(payload.id).first();

  return admin;
}

// Helper function to check if user is super admin
export async function requireSuperAdmin(request, env) {
  const admin = await requireAuth(request, env);

  if (!admin || admin.role !== 'super_admin') {
    return null;
  }

  return admin;
}

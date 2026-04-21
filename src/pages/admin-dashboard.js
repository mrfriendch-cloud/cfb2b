/**
 * Admin Dashboard Page
 * Main admin interface for managing products and inquiries
 */

export async function adminDashboard(env) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - B2B Product Exhibition</title>
  <style>
    /* Main Stylesheet for B2B Website */

    :root {
      --primary-color: #2563eb;
      --secondary-color: #1e40af;
      --accent-color: #f59e0b;
      --text-dark: #1f2937;
      --text-light: #6b7280;
      --bg-light: #f9fafb;
      --border-color: #e5e7eb;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-dark);
      background: #ffffff;
    }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--secondary-color);
    }

    .btn-secondary {
      background: var(--accent-color);
      color: white;
    }

    .btn-secondary:hover {
      background: #d97706;
    }

    /* Grid Layout */
    .grid {
      display: grid;
      gap: 2rem;
    }

    .grid-3 {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    /* Admin specific styles */
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }
    .admin-sidebar {
      width: 250px;
      background: var(--text-dark);
      color: white;
      padding: 2rem 0;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }
    .admin-content {
      flex: 1;
      margin-left: 250px;
      padding: 2rem;
      background: var(--bg-light);
      min-height: 100vh;
    }
    .admin-header {
      background: white;
      padding: 1.5rem 2rem;
      margin: -2rem -2rem 2rem -2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sidebar-nav {
      list-style: none;
    }
    .sidebar-nav li {
      margin: 0;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      padding: 1rem 2rem;
      color: #9ca3af;
      text-decoration: none;
      transition: all 0.3s;
    }
    .sidebar-nav a:hover,
    .sidebar-nav a.active {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      color: var(--text-light);
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .stat-card .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .table-container {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      background: var(--bg-light);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-dark);
      border-bottom: 2px solid var(--border-color);
    }
    .table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .table tr:hover {
      background: var(--bg-light);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-processing {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-completed {
      background: #d1fae5;
      color: #065f46;
    }
    .tab-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid var(--border-color);
    }
    .tab-btn {
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: var(--text-light);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }
    .tab-btn:hover {
      color: var(--primary-color);
    }
    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }

    /* Modal Styles */
    .modal {
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      overflow-y: auto;
    }

    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 0.5rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      font-size: 1.5rem;
      color: var(--text-dark);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-light);
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      color: var(--text-dark);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-dark);
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-checkbox input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .btn-cancel {
      background: #6b7280;
      color: white;
    }

    .btn-cancel:hover {
      background: #4b5563;
    }

    .image-upload-container {
      margin-bottom: 1.5rem;
    }

    .image-preview {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .image-preview img {
      max-width: 200px;
      max-height: 200px;
      border-radius: 0.375rem;
      border: 1px solid var(--border-color);
      object-fit: cover;
    }

    .upload-btn-wrapper {
      position: relative;
      overflow: hidden;
      display: inline-block;
    }

    .upload-btn-wrapper input[type=file] {
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .btn-upload {
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s;
    }

    .btn-upload:hover {
      background: var(--secondary-color);
    }

    .uploading {
      color: var(--primary-color);
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .mobile-menu-btn {
      display: none;
      background: var(--primary-color);
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      font-weight: 600;
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    }

    @media (max-width: 768px) {
      .admin-layout {
        flex-direction: column;
      }
      .admin-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease-in-out;
        position: fixed;
        z-index: 1000;
        top: 0;
        left: 0;
        height: 100vh;
        width: 250px;
      }
      .admin-sidebar.active {
        transform: translateX(0);
      }
      .admin-content {
        margin-left: 0;
        width: 100%;
      }
      .mobile-menu-btn {
        display: block;
      }
      .sidebar-overlay.active {
        display: block;
      }
      .admin-header {
        padding: 1rem;
        margin: -2rem -2rem 2rem -2rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .grid-3 {
        grid-template-columns: 1fr;
      }
      /* Mobile table styles */
      .table-container {
        overflow-x: auto;
      }
      .table {
        font-size: 0.85rem;
      }
      .table th,
      .table td {
        padding: 0.75rem 0.5rem;
      }
      /* Hide non-essential columns on mobile */
      .table th:nth-child(3),
      .table td:nth-child(3),
      .table th:nth-child(6),
      .table td:nth-child(6),
      .table th:nth-child(7),
      .table td:nth-child(7) {
        display: none;
      }
      /* Adjust button sizes on mobile */
      .table .btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        margin-right: 0.25rem;
      }
      /* Hide heading on mobile */
      .products-header h2 {
        display: none;
      }
    }
    }
  </style>
</head>
<body>
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div style="padding: 0 2rem 2rem 2rem;">
        <h2 style="color: var(--accent-color); font-size: 1.5rem;">B2B Admin</h2>
      </div>
      <ul class="sidebar-nav">
        <li><a href="#" data-tab="overview" class="active">📊 Overview</a></li>
        <li><a href="#" data-tab="categories">📁 Categories</a></li>
        <li><a href="#" data-tab="products">📦 Products</a></li>
        <li><a href="#" data-tab="inquiries">💬 Inquiries</a></li>
        <li><a href="#" data-tab="settings">⚙️ Settings</a></li>
        <li><a href="#" data-tab="livechat" id="livechat-nav">💬 Live Chat <span id="chat-badge" style="display:none; background:#ef4444; color:white; border-radius:9999px; padding:0.1rem 0.45rem; font-size:0.7rem; margin-left:0.25rem;">0</span></a></li>
        <li><a href="#" id="logout-btn">🚪 Logout</a></li>
      </ul>
    </aside>

    <!-- Main Content -->
    <main class="admin-content">
      <div class="admin-header">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="mobile-menu-btn" id="admin-menu-toggle">☰ Menu</button>
          <div>
            <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem;">Dashboard</h1>
            <p style="color: var(--text-light); font-size: 0.9rem;">
              Welcome back, <span id="admin-username">Admin</span>
              <span id="admin-role-indicator" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: var(--primary-color); color: white; border-radius: 0.25rem; font-size: 0.75rem;">Loading...</span>
            </p>
          </div>
        </div>
        <div style="display: flex; gap: 1rem;">
          <a href="/" target="_blank" class="btn btn-primary" style="text-decoration: none; display: flex; align-items: center; ">
            Preview
          </a>
          <button id="logout-btn-header" class="btn btn-secondary">Logout</button>
        </div>
      </div>

      <!-- Overview Tab -->
      <div id="overview-tab" class="tab-content active">
        <div class="grid grid-3" style="margin-bottom: 2rem;">
          <div class="stat-card">
            <h3>Total Products</h3>
            <div class="stat-value" id="stat-products">0</div>
          </div>
          <div class="stat-card">
            <h3>Total Inquiries</h3>
            <div class="stat-value" id="stat-inquiries">0</div>
          </div>
          <div class="stat-card">
            <h3>Pending Inquiries</h3>
            <div class="stat-value" id="stat-pending">0</div>
          </div>
        </div>

        <h2 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-dark);">Recent Inquiries</h2>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Product</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="recent-inquiries-tbody">
              <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Categories Tab -->
      <div id="categories-tab" class="tab-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.25rem; color: var(--text-dark);">Manage Categories</h2>
          <button id="add-category-btn" class="btn btn-primary">+ Add Category</button>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="categories-tbody">
              <tr><td colspan="4" style="text-align: center;">Loading...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="categories-pagination-container"></div>
      </div>

      <!-- Products Tab -->
      <div id="products-tab" class="tab-content">
        <div class="products-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.25rem; color: var(--text-dark);">Manage Products</h2>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <select id="product-category-filter" class="form-select" style="width: 200px;" onchange="loadProducts()">
              <option value="">All Categories</option>
            </select>
            <button id="add-product-btn" class="btn btn-primary">+ Add Product</button>
          </div>
        </div>
        <div class="table-container">
          <div id="products-list">Loading...</div>
        </div>
        <div id="products-pagination-container"></div>
      </div>

      <!-- Inquiries Tab -->
      <div id="inquiries-tab" class="tab-content">
        <h2 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--text-dark);">Manage Inquiries</h2>
        <div class="table-container">
          <div id="inquiries-list">Loading...</div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div id="settings-tab" class="tab-content">
        <h2 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--text-dark);">Website Settings</h2>
        <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 800px;">
          <form id="settings-form">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--primary-color); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
              Basic Information
            </h3>

            <div class="form-group">
              <label class="form-label" for="settings-site-name">Website Name</label>
              <input type="text" id="settings-site-name" name="site_name" class="form-input" placeholder="GlobalMart">
            </div>

            <div class="form-group">
              <label class="form-label" for="settings-site-description">Website Description</label>
              <textarea id="settings-site-description" name="site_description" class="form-textarea" placeholder="Your trusted partner for high-quality industrial products..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="settings-company-intro">Company Introduction</label>
              <textarea id="settings-company-intro" name="company_intro" class="form-textarea" placeholder="We are a leading manufacturer and supplier..."></textarea>
            </div>

            <h3 style="font-size: 1.1rem; margin: 2rem 0 1rem; color: var(--primary-color); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
              Contact Information
            </h3>

            <div class="form-group">
              <label class="form-label" for="settings-email">Email</label>
              <input type="email" id="settings-email" name="email" class="form-input" placeholder="info@example.com">
            </div>

            <div class="form-group">
              <label class="form-label" for="settings-phone">Phone</label>
              <input type="text" id="settings-phone" name="phone" class="form-input" placeholder="+1 234 567 8900">
            </div>

            <div class="form-group">
              <label class="form-label" for="settings-address">Address</label>
              <input type="text" id="settings-address" name="address" class="form-input" placeholder="123 Business St, City, Country">
            </div>

            <h3 style="font-size: 1.1rem; margin: 2rem 0 1rem; color: var(--primary-color); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
              Social Media Links
            </h3>

            <div class="form-group">
              <label class="form-label" for="settings-linkedin">LinkedIn URL</label>
              <input type="url" id="settings-linkedin" name="linkedin" class="form-input" placeholder="https://linkedin.com/company/yourcompany">
            </div>

            <div class="form-group">
              <label class="form-label" for="settings-facebook">Facebook URL</label>
              <input type="url" id="settings-facebook" name="facebook" class="form-input" placeholder="https://facebook.com/yourcompany">
            </div>

            <div class="form-group">
              <label class="form-label" for="settings-twitter">Twitter URL</label>
              <input type="url" id="settings-twitter" name="twitter" class="form-input" placeholder="https://twitter.com/yourcompany">
            </div>

            <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
              <button type="submit" id="save-settings-btn" class="btn btn-primary" style="margin-right: 1rem;">Save Settings</button>
              <button type="button" class="btn btn-secondary" onclick="loadSettings()">Reset</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Live Chat Tab -->
      <div id="livechat-tab" class="tab-content">
        <h2 style="font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--text-dark);">Live Chat</h2>
        <div id="livechat-grid" style="display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; height: calc(100vh - 220px);">
          <style>
            @media (max-width: 768px) {
              #livechat-grid {
                grid-template-columns: 1fr !important;
                grid-template-rows: 300px 1fr;
                height: auto !important;
              }
              #chat-reply-panel {
                min-height: 400px;
              }
            }
          </style>

          <!-- Sessions List -->
          <div style="background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden;">
            <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.95rem;">Conversations</span>
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="loadChatSessions('open')" id="chat-filter-open" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Open</button>
                <button onclick="loadChatSessions('closed')" id="chat-filter-closed" class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; background: #e5e7eb; color: var(--text-dark);">Closed</button>
              </div>
            </div>
            <div id="chat-sessions-list" style="flex: 1; overflow-y: auto; padding: 0.5rem;">
              <p style="text-align: center; color: var(--text-light); padding: 2rem; font-size: 0.9rem;">Loading sessions...</p>
            </div>
          </div>

          <!-- Reply Panel -->
          <div id="chat-reply-panel" style="background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden;">
            <div id="chat-reply-header" style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: var(--text-light); font-size: 0.95rem;">Select a conversation</span>
            </div>
            <div id="chat-reply-messages" style="flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; background: #f9fafb;">
              <p style="text-align: center; color: var(--text-light); margin: auto; font-size: 0.9rem;">No conversation selected</p>
            </div>
            <div id="chat-reply-input-area" style="padding: 1rem; border-top: 1px solid var(--border-color); display: none;">
              <input type="text" id="admin-reply-input" placeholder="Type a reply..." class="form-input"
                     style="width: 100%; margin-bottom: 0.5rem; display: block;"
                     onkeypress="if(event.key==='Enter') sendAdminReply()">
              <div style="display: flex; gap: 0.5rem;">
                <button onclick="sendAdminReply()" class="btn btn-primary" style="flex: 1;">Send Reply</button>
                <button onclick="closeCurrentSession()" class="btn" style="background: #e5e7eb; color: var(--text-dark); flex: 1;">Close Chat</button>
                <button onclick="deleteCurrentSession()" class="btn" style="background: #fee2e2; color: #dc2626;">🗑</button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </main>
  </div>

  <!-- Category Edit/Add Modal -->
  <div id="category-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="category-modal-title">Edit Category</h2>
        <button class="modal-close" onclick="closeCategoryModal()">&times;</button>
      </div>
      <form id="category-form">
        <input type="hidden" id="category-id" name="id">

        <div class="form-group">
          <label class="form-label" for="category-name">Category Name *</label>
          <input type="text" id="category-name" name="name" class="form-input" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="category-description">Description</label>
          <textarea id="category-description" name="description" class="form-textarea" placeholder="Brief description of this category"></textarea>
        </div>

        <div class="image-upload-container">
          <label class="form-label">Category Image</label>
          <div class="upload-btn-wrapper">
            <button type="button" class="btn-upload">Choose Image</button>
            <input type="file" id="category-image-upload" accept="image/*" onchange="handleCategoryImageUpload(event)">
          </div>
          <div id="category-upload-status" class="uploading" style="display: none;">Uploading...</div>
          <div id="category-image-preview" class="image-preview"></div>
        </div>
        <input type="hidden" id="category-image-url" name="image_url">

        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" onclick="closeCategoryModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Category</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Product Edit/Add Modal -->
  <div id="product-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title">Edit Product</h2>
        <button class="modal-close" onclick="closeProductModal()">&times;</button>
      </div>
      <form id="product-form">
        <input type="hidden" id="product-id" name="id">

        <div class="form-group">
          <label class="form-label" for="product-name">Product Name *</label>
          <input type="text" id="product-name" name="name" class="form-input" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="product-category">Category</label>
          <select id="product-category" name="category_id" class="form-select">
            <option value="">Select a Category</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="product-price">Price (USD)</label>
            <input type="number" id="product-price" name="price" class="form-input" placeholder="0.00" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label" for="product-quantity">Quantity / MOQ</label>
            <input type="number" id="product-quantity" name="quantity" class="form-input" placeholder="e.g. 100" min="0" step="1">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="product-description">Short Description</label>
          <textarea id="product-description" name="description" class="form-textarea" placeholder="Brief product description"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="product-detailed-description">Detailed Description</label>
          <textarea id="product-detailed-description" name="detailed_description" class="form-textarea" placeholder="Full product description"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="product-specifications">Specifications</label>
          <textarea id="product-specifications" name="specifications" class="form-textarea" placeholder="Technical specifications"></textarea>
        </div>

        <div class="image-upload-container">
          <label class="form-label">Main Product Image</label>
          <div class="upload-btn-wrapper">
            <button type="button" class="btn-upload">Choose Image</button>
            <input type="file" id="image-upload" accept="image/*,video/*" onchange="handleImageUpload(event)">
          </div>
          <div id="upload-status" class="uploading" style="display: none;">Uploading...</div>
          <div id="image-preview" class="image-preview"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="product-image-url">Main Image URL (or upload above)</label>
          <input type="url" id="product-image-url" name="image_url" class="form-input" placeholder="https://example.com/image.jpg">
        </div>

        <div class="form-group">
          <label class="form-label">Gallery Images / Videos</label>
          <div class="upload-btn-wrapper">
            <button type="button" class="btn-upload">Add to Gallery</button>
            <input type="file" id="gallery-upload" accept="image/*,video/*" onchange="handleGalleryUpload(event)">
          </div>
          <div id="gallery-upload-status" style="display: none; color: var(--text-light); font-size: 0.85rem; margin-top: 0.5rem;">Uploading...</div>
          <div id="gallery-preview" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;"></div>
          <input type="hidden" id="product-gallery-images" name="gallery_images" value="[]">
        </div>

        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" id="product-is-featured" name="is_featured">
            <span>Featured Product</span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" id="product-is-active" name="is_active" checked>
            <span>Active</span>
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" onclick="closeProductModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Product</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    /**
     * Main JavaScript file for B2B Website
     * Handles common functionality across all pages
     */

    // ImageKit helper
    window.getImageKitUrl = function(url, transformations = '') {
      if (!url || typeof url !== 'string' || !url.includes('ik.imagekit.io')) return url || '';
      
      try {
        const urlObj = new URL(url);
        if (transformations) {
          urlObj.searchParams.set('tr', transformations);
        }
        return urlObj.toString();
      } catch (e) {
        return url;
      }
    };

    // Mobile menu toggle
    document.addEventListener('DOMContentLoaded', function() {
      const adminMenuToggle = document.getElementById('admin-menu-toggle');
      const adminSidebar = document.querySelector('.admin-sidebar');
      const sidebarOverlay = document.getElementById('sidebar-overlay');

      function toggleAdminMenu() {
        if(adminSidebar) adminSidebar.classList.toggle('active');
        if(sidebarOverlay) sidebarOverlay.classList.toggle('active');
      }

      if (adminMenuToggle) {
        adminMenuToggle.addEventListener('click', toggleAdminMenu);
      }
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleAdminMenu);
      }

      // Hide menu when a nav link is clicked on mobile
      const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
      sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
             if(adminSidebar) adminSidebar.classList.remove('active');
             if(sidebarOverlay) sidebarOverlay.classList.remove('active');
          }
        });
      });

      // Set active nav link based on current page
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('.nav-link');

      navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
          link.classList.add('active');
        }
      });
    });

    // API helper functions
    const API = {
      baseURL: '/api',

      async get(endpoint) {
        const response = await fetch(\`\${this.baseURL}\${endpoint}\`);
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        return await response.json();
      },

      async post(endpoint, data) {
        const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        return await response.json();
      },

      async put(endpoint, data) {
        const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        return await response.json();
      },

      async delete(endpoint) {
        const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        return await response.json();
      },
    };

    // Form validation helper
    function validateEmail(email) {
      const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      return re.test(String(email).toLowerCase());
    }

    // Show notification
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = \`notification notification-\${type}\`;
      notification.textContent = message;
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: \${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
      \`;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = \`
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    \`;
    document.head.appendChild(style);

    // Export for use in other scripts
    window.API = API;
    window.validateEmail = validateEmail;
    window.showNotification = showNotification;
  </script>

  <script>
    /**
     * Admin Dashboard JavaScript
     * Handles all admin dashboard functionality
     */

    // Check authentication
    const token = localStorage.getItem('admin_token');
    const userRole = localStorage.getItem('admin_role') || 'admin';
    const isSuperAdmin = userRole === 'super_admin';

    if (!token) {
      window.location.href = '/admin/login';
    }

    // Verify token on page load and get user info
    API.post('/admin/verify', { token })
      .then(response => {
        if (response.success && response.data.user) {
          // Update role in localStorage
          localStorage.setItem('admin_role', response.data.user.role || 'admin');

          // Update role indicator
          const roleIndicator = document.getElementById('admin-role-indicator');
          if (roleIndicator) {
            roleIndicator.textContent = response.data.user.role === 'super_admin' ? 'Super Admin' : 'Admin';
          }
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
        window.location.href = '/admin/login';
      });

    // Add authorization header to all API requests
    const originalPost = API.post;
    const originalPut = API.put;
    const originalDelete = API.delete;
    const originalGet = API.get;

    API.get = function(endpoint) {
      return fetch(\`\${this.baseURL}\${endpoint}\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`,
        },
      }).then(res => res.json());
    };

    API.post = function(endpoint, data) {
      return fetch(\`\${this.baseURL}\${endpoint}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
        },
        body: JSON.stringify(data),
      }).then(res => res.json());
    };

    API.put = function(endpoint, data) {
      return fetch(\`\${this.baseURL}\${endpoint}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
        },
        body: JSON.stringify(data),
      }).then(res => res.json());
    };

    API.delete = function(endpoint) {
      return fetch(\`\${this.baseURL}\${endpoint}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`,
        },
      }).then(res => res.json());
    };

    // Logout functionality
    function logout() {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      window.location.href = '/admin/login';
    }

    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });

    document.getElementById('logout-btn-header').addEventListener('click', logout);

    // Tab Navigation
    const tabButtons = document.querySelectorAll('[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = button.getAttribute('data-tab');

        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(\`\${tabName}-tab\`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'products') {
          loadProducts();
        } else if (tabName === 'categories') {
          loadCategories();
        } else if (tabName === 'inquiries') {
          loadInquiries();
        } else if (tabName === 'settings') {
          loadSettings();
        } else if (tabName === 'livechat') {
          startChatSessionPolling();
        }
      });
    });

    // ==========================================
    // CATEGORIES MANAGEMENT
    // ==========================================

    let categories = [];
    let products = [];
    
    // Pagination state
    let categoriesPage = 1;
    let productsPage = 1;
    const itemsPerPage = 5;

    // Pagination helper function
    function renderPagination(currentPage, totalItems, containerId, onPageChange) {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (totalPages <= 1) return; // No pagination needed
      
      let paginationHtml = '<div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; flex-wrap: wrap;">';
      
      // Previous button
      if (currentPage > 1) {
        paginationHtml += '<button onclick="' + onPageChange + '(' + (currentPage - 1) + ')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">← Previous</button>';
      }
      
      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
          paginationHtml += '<button style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600;">' + i + '</button>';
        } else {
          paginationHtml += '<button onclick="' + onPageChange + '(' + i + ')" style="padding: 0.5rem 1rem; background: #e5e7eb; color: var(--text-dark); border: none; border-radius: 0.375rem; cursor: pointer;">' + i + '</button>';
        }
      }
      
      // Next button
      if (currentPage < totalPages) {
        paginationHtml += '<button onclick="' + onPageChange + '(' + (currentPage + 1) + ')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Next →</button>';
      }
      
      paginationHtml += '</div>';
      
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = paginationHtml;
      }
    }

    // Load categories
    async function loadCategories(page = 1) {
      categoriesPage = page;
      const tbody = document.getElementById('categories-tbody');
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading categories...</td></tr>';

      try {
        const response = await API.get('/categories');
        categories = response || [];
        
        if (categories.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No categories found.</td></tr>';
          document.getElementById('categories-pagination-container').innerHTML = '';
          return;
        }

        // Calculate pagination
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedCategories = categories.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedCategories.map(cat => \`
          <tr>
            <td>
              \${cat.image_url
                  ? \`<img src="\${getImageKitUrl(cat.image_url, 'w-50,h-50,cm-pad_resize,bg-F3F3F6')}" alt="\${cat.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">\`
                  : '<div style="width: 50px; height: 50px; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">No img</div>'
              }
            </td>
            <td style="font-weight: 500;">\${cat.name}</td>
            <td style="color: #6b7280; font-size: 0.9em; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              \${cat.description || '-'}
            </td>
            <td>
              <button class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;" onclick="editCategory(\${cat.id})">Edit</button>
              <button class="btn" style="background: #ef4444; color: white; padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="deleteCategory(\${cat.id})">Delete</button>
            </td>
          </tr>
        \`).join('');

        // Add pagination if needed
        if (categories.length > itemsPerPage) {
          renderPagination(page, categories.length, 'categories-pagination-container', 'loadCategories');
        } else {
          document.getElementById('categories-pagination-container').innerHTML = '';
        }
      } catch (error) {
        tbody.innerHTML = \`<tr><td colspan="4" style="text-align: center; color: red;">Error loading categories: \${error.message}</td></tr>\`;
        showNotification('Failed to load categories', 'error');
      }
    }

    // Category Modal functions
    const categoryModal = document.getElementById('category-modal');
    
    function openCategoryModal(isEdit = false) {
      document.getElementById('category-modal-title').textContent = isEdit ? 'Edit Category' : 'Add New Category';
      categoryModal.classList.add('active');
    }

    function closeCategoryModal() {
      categoryModal.classList.remove('active');
      document.getElementById('category-form').reset();
      document.getElementById('category-id').value = '';
      document.getElementById('category-image-preview').innerHTML = '';
      document.getElementById('category-image-url').value = '';
    }

    document.getElementById('add-category-btn').addEventListener('click', () => {
      openCategoryModal(false);
    });

    // Close modal when clicking outside
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) closeCategoryModal();
    });

    function editCategory(id) {
      const category = categories.find(c => c.id === id);
      if (!category) return;

      document.getElementById('category-id').value = category.id;
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-description').value = category.description || '';
      document.getElementById('category-image-url').value = category.image_url || '';

      const previewDiv = document.getElementById('category-image-preview');
      if (category.image_url) {
        previewDiv.innerHTML = \`<img src="\${category.image_url}" alt="Preview">\`;
      } else {
        previewDiv.innerHTML = '';
      }

      openCategoryModal(true);
    }

    // Save category
    document.getElementById('category-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('category-id').value;
      const isEdit = !!id;
      
      const formData = {
        name: document.getElementById('category-name').value,
        description: document.getElementById('category-description').value,
        image_url: document.getElementById('category-image-url').value
      };

      if (isEdit) {
        formData.id = id;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      try {
        let response;
        if (isEdit) {
          response = await API.put('/categories', formData);
        } else {
          response = await API.post('/categories', formData);
        }

        if (response.success || response.id) {
          showNotification(\`Category successfully \${isEdit ? 'updated' : 'created'}\`, 'success');
          closeCategoryModal();
          loadCategories();
          populateCategoryDropdowns(); // Refresh product category dropdowns
        } else {
          throw new Error(response.error || 'Unknown error occurred');
        }
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });

    // Delete category
    async function deleteCategory(id) {
      if (!confirm('Are you sure you want to delete this category? Products in this category might lose their grouping.')) {
        return;
      }

      try {
        const response = await API.delete(\`/categories?id=\${id}\`);
        if (response.success) {
          showNotification('Category deleted successfully', 'success');
          loadCategories();
          populateCategoryDropdowns(); // Refresh product category dropdowns
        } else {
          throw new Error(response.error || 'Unknown error');
        }
      } catch (error) {
        showNotification(error.message, 'error');
      }
    }

    // Category Image Upload
    async function handleCategoryImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const statusDiv = document.getElementById('category-upload-status');
      const previewDiv = document.getElementById('category-image-preview');
      const urlInput = document.getElementById('category-image-url');
      
      statusDiv.style.display = 'block';
      statusDiv.textContent = 'Uploading...';
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`
          },
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          urlInput.value = data.data.url;
          previewDiv.innerHTML = \`<img src="\${data.data.url}" alt="Preview">\`;
          statusDiv.textContent = 'Upload successful!';
          statusDiv.style.color = '#10b981';
          setTimeout(() => { statusDiv.style.display = 'none'; }, 2000);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload Error:', error);
        statusDiv.textContent = 'Upload failed: ' + error.message;
        statusDiv.style.color = '#ef4444';
      }
      
      // Reset file input so same file can be selected again
      event.target.value = '';
    }

    // Load Dashboard Stats
    async function loadDashboardStats() {
      try {
        const response = await API.get('/admin/stats');
        if (response.success) {
          const { total_products, total_inquiries, pending_inquiries, recent_inquiries } = response.data;

          document.getElementById('stat-products').textContent = total_products || 0;
          document.getElementById('stat-inquiries').textContent = total_inquiries || 0;
          document.getElementById('stat-pending').textContent = pending_inquiries || 0;

          // Display recent inquiries
          const tbody = document.getElementById('recent-inquiries-tbody');
          if (recent_inquiries && recent_inquiries.length > 0) {
            tbody.innerHTML = recent_inquiries.map(inquiry => \`
              <tr>
                <td>\${inquiry.name}</td>
                <td>\${inquiry.email}</td>
                <td>\${inquiry.product_name || 'General Inquiry'}</td>
                <td><span class="badge badge-\${inquiry.status}">\${inquiry.status}</span></td>
                <td>\${new Date(inquiry.created_at).toLocaleDateString()}</td>
              </tr>
            \`).join('');
          } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent inquiries</td></tr>';
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }

    // Populate category dropdowns
    async function populateCategoryDropdowns() {
      try {
        if (categories.length === 0) {
          const response = await API.get('/categories');
          categories = response || [];
        }

        const filterSelect = document.getElementById('product-category-filter');
        const modalSelect = document.getElementById('product-category');
        
        let optionsHtml = '<option value="">All Categories</option>';
        let modalOptionsHtml = '<option value="">Select a Category</option>';
        
        categories.forEach(cat => {
          optionsHtml += \`<option value="\${cat.id}">\${cat.name}</option>\`;
          modalOptionsHtml += \`<option value="\${cat.id}">\${cat.name}</option>\`;
        });
        
        if (filterSelect) {
          const currentFilterVal = filterSelect.value;
          filterSelect.innerHTML = optionsHtml;
          filterSelect.value = currentFilterVal;
        }
        
        if (modalSelect) {
          const currentModalVal = modalSelect.value;
          modalSelect.innerHTML = modalOptionsHtml;
          modalSelect.value = currentModalVal;
        }
      } catch (error) {
        console.error('Error loading categories for dropdowns:', error);
      }
    }

    // Load Products
    async function loadProducts(page = 1) {
      productsPage = page;
      const listDiv = document.getElementById('products-list');
      listDiv.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading products...</div>';

      // Ensure categories are loaded for the dropdowns
      await populateCategoryDropdowns();

      try {
        const response = await API.get('/products');
        if (response.success) {
          products = response.data;
          
          let filteredProducts = products;
          const categoryFilter = document.getElementById('product-category-filter').value;
          
          if (categoryFilter) {
            filteredProducts = products.filter(p => p.category_id == categoryFilter);
          }

          if (filteredProducts.length === 0) {
            listDiv.innerHTML = '<div style="padding: 2rem; text-align: center;">No products found in this category.</div>';
            return;
          }

          // Calculate pagination
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

          let html = \`
            <table class="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
          \`;
          
          html += paginatedProducts.map(product => \`
            <tr>
              <td>
                \${product.image_url
                    ? \`<img src="\${getImageKitUrl(product.image_url, 'w-50,h-50,cm-pad_resize,bg-F3F3F6')}" alt="\${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">\`
                    : '<div style="width: 50px; height: 50px; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">No img</div>'
                }
              </td>
              <td style="font-weight: 500;">\${product.name}</td>
              <td><span class="badge" style="background: #e5e7eb; color: #4b5563;">\${product.category_name || '-'}</span></td>
              <td style="color: #1e40af; font-weight: 600;">\${product.price !== null && product.price !== undefined ? '$' + parseFloat(product.price).toFixed(2) : '-'}</td>
              <td style="color: #15803d; font-weight: 600;">\${product.quantity !== null && product.quantity !== undefined ? product.quantity + ' units' : '-'}</td>
              <td>\${product.is_featured ? '⭐ Yes' : 'No'}</td>
              <td><span class="badge \${product.is_active ? 'badge-completed' : 'badge-pending'}">\${product.is_active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button onclick="editProduct(\${product.id})" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-right: 0.5rem;">Edit</button>
                <button onclick="deleteProduct(\${product.id})" class="btn" style="background: #dc2626; color: white; padding: 0.5rem 1rem; font-size: 0.85rem;">Delete</button>
              </td>
            </tr>
          \`).join('');

          html += \`
              </tbody>
            </table>
          \`;
          
          listDiv.innerHTML = html;
          
          // Render pagination if needed
          if (filteredProducts.length > itemsPerPage) {
            renderPagination(page, filteredProducts.length, 'products-pagination-container', 'loadProducts');
          } else {
            document.getElementById('products-pagination-container').innerHTML = '';
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = '<p style="padding: 2rem; text-align: center; color: red;">Error loading products</p>';
      }
    }

    // Load Inquiries
    async function loadInquiries() {
      try {
        const response = await API.get('/inquiries');
        if (response.success) {
          const inquiries = response.data || [];
          const container = document.getElementById('inquiries-list');

          if (inquiries.length === 0) {
            container.innerHTML = '<p style="padding: 2rem; text-align: center;">No inquiries found.</p>';
            return;
          }

          container.innerHTML = \`
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                \${inquiries.map(inquiry => \`
                  <tr>
                    <td>\${inquiry.id}</td>
                    <td>\${inquiry.name}</td>
                    <td>\${inquiry.email}</td>
                    <td>\${inquiry.product_name || 'General'}</td>
                    <td><span class="badge badge-\${inquiry.status}">\${inquiry.status}</span></td>
                    <td>\${new Date(inquiry.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onclick="viewInquiry(\${inquiry.id})" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-right: 0.5rem;">View</button>
                      \${isSuperAdmin ? \`<button onclick="deleteInquiry(\${inquiry.id})" class="btn" style="background: #dc2626; color: white; padding: 0.5rem 1rem; font-size: 0.85rem;">Delete</button>\` : ''}
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          \`;
        }
      } catch (error) {
        console.error('Error loading inquiries:', error);
        document.getElementById('inquiries-list').innerHTML = '<p style="padding: 2rem; text-align: center; color: red;">Error loading inquiries</p>';
      }
    }

    // Product Management Functions
    window.handleGalleryUpload = async function(event) {
      const file = event.target.files[0];
      if (!file) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('Invalid file type.', 'error');
        return;
      }
      const maxSize = 50 * 1024 * 1024; // 50MB for video
      if (file.size > maxSize) {
        showNotification('File too large. Maximum size is 50MB.', 'error');
        return;
      }

      const statusEl = document.getElementById('gallery-upload-status');
      statusEl.style.display = 'block';
      statusEl.textContent = 'Uploading...';

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Authorization': \`Bearer \${token}\` },
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          addGalleryItem(result.data.url, file.type.startsWith('video/'));
          showNotification('Added to gallery', 'success');
        } else {
          showNotification(result.error || 'Upload failed', 'error');
        }
      } catch (err) {
        showNotification('Upload error', 'error');
      } finally {
        statusEl.style.display = 'none';
        event.target.value = '';
      }
    };

    function addGalleryItem(url, isVideo) {
      const container = document.getElementById('gallery-preview');
      const hiddenInput = document.getElementById('product-gallery-images');
      let urls = [];
      try { urls = JSON.parse(hiddenInput.value || '[]'); } catch(e) {}
      if (urls.includes(url)) return;
      urls.push(url);
      hiddenInput.value = JSON.stringify(urls);

      const item = document.createElement('div');
      item.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 0.375rem; overflow: hidden; border: 1px solid var(--border-color);';
      item.dataset.url = url;
      if (isVideo || url.match(/\.(mp4|webm|ogg)/i)) {
        item.innerHTML = '<video src="' + url + '" style="width:100%;height:100%;object-fit:cover;" muted></video>'
          + '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:1.2rem;text-shadow:0 1px 3px rgba(0,0,0,0.8);">&#9654;</div>';
      } else {
        item.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;">';
      }
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:12px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;';
      removeBtn.onclick = function() {
        let urls = [];
        try { urls = JSON.parse(hiddenInput.value || '[]'); } catch(e) {}
        hiddenInput.value = JSON.stringify(urls.filter(function(u) { return u !== url; }));
        item.remove();
      };
      item.appendChild(removeBtn);
      container.appendChild(item);
    }

    function renderGalleryPreview(urls) {
      const container = document.getElementById('gallery-preview');
      const hiddenInput = document.getElementById('product-gallery-images');
      container.innerHTML = '';
      hiddenInput.value = JSON.stringify(urls || []);
      (urls || []).forEach(url => addGalleryItem(url, url.match(/\.(mp4|webm|ogg)/i)));
    }

    window.handleImageUpload = async function(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', 'error');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showNotification('File too large. Maximum size is 5MB.', 'error');
        return;
      }

      // Show uploading status
      const uploadStatus = document.getElementById('upload-status');
      uploadStatus.style.display = 'block';

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`,
          },
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Set the image URL
          document.getElementById('product-image-url').value = result.data.url;

          // Show preview
          const preview = document.getElementById('image-preview');
          preview.innerHTML = \`<img src="\${result.data.url}" alt="Product preview">\`;

          showNotification('Image uploaded successfully', 'success');
        } else {
          showNotification(result.error || 'Upload failed', 'error');
        }
      } catch (error) {
        console.error('Upload error:', error);
        showNotification('Error uploading image', 'error');
      } finally {
        uploadStatus.style.display = 'none';
      }
    };

    window.editProduct = async function(id) {
      try {
        // Fetch product details
        const response = await API.get(\`/products/\${id}\`);
        if (response.success) {
          const product = response.data;

          // Populate form
          document.getElementById('product-id').value = product.id;
          document.getElementById('product-name').value = product.name || '';
          document.getElementById('product-category').value = product.category_id || '';
          document.getElementById('product-description').value = product.description || '';
          document.getElementById('product-detailed-description').value = product.detailed_description || '';
          document.getElementById('product-specifications').value = product.specifications || '';
          document.getElementById('product-image-url').value = product.image_url || '';
          document.getElementById('product-price').value = product.price !== null && product.price !== undefined ? product.price : '';
          document.getElementById('product-quantity').value = product.quantity !== null && product.quantity !== undefined ? product.quantity : '';
          document.getElementById('product-is-featured').checked = !!product.is_featured;
          document.getElementById('product-is-active').checked = !!product.is_active;

          // Show image preview if exists
          const preview = document.getElementById('image-preview');
          if (product.image_url) {
            preview.innerHTML = \`<img src="\${product.image_url}" alt="Product preview">\`;
          } else {
            preview.innerHTML = '';
          }

          // Load gallery images
          let galleryUrls = [];
          try { galleryUrls = JSON.parse(product.gallery_images || '[]'); } catch(e) {}
          renderGalleryPreview(galleryUrls);

          // Update modal title
          document.getElementById('modal-title').textContent = 'Edit Product';

          // Show modal
          document.getElementById('product-modal').classList.add('active');
        }
      } catch (error) {
        showNotification('Error loading product details', 'error');
        console.error('Error loading product:', error);
      }
    };

    window.closeProductModal = function() {
      document.getElementById('product-modal').classList.remove('active');
      document.getElementById('product-form').reset();
      document.getElementById('product-id').value = '';
      document.getElementById('image-preview').innerHTML = '';
      document.getElementById('image-upload').value = '';
      document.getElementById('gallery-preview').innerHTML = '';
      document.getElementById('product-gallery-images').value = '[]';
    };

    window.openAddProductModal = function() {
      // Reset form
      document.getElementById('product-form').reset();
      document.getElementById('product-id').value = '';
      document.getElementById('product-is-active').checked = true;

      // Update modal title
      document.getElementById('modal-title').textContent = 'Add New Product';

      // Show modal
      document.getElementById('product-modal').classList.add('active');
    };

    // Handle product form submission
    document.getElementById('product-form').addEventListener('submit', async function(e) {
      e.preventDefault();

      const productId = document.getElementById('product-id').value;
      const priceVal = document.getElementById('product-price').value;
      const quantityVal = document.getElementById('product-quantity').value;
      const formData = {
        name: document.getElementById('product-name').value,
        category_id: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        detailed_description: document.getElementById('product-detailed-description').value,
        specifications: document.getElementById('product-specifications').value,
        image_url: document.getElementById('product-image-url').value,
        gallery_images: (() => { try { return JSON.parse(document.getElementById('product-gallery-images').value || '[]'); } catch(e) { return []; } })(),
        price: priceVal !== '' ? parseFloat(priceVal) : null,
        quantity: quantityVal !== '' ? parseInt(quantityVal) : null,
        is_featured: document.getElementById('product-is-featured').checked,
        is_active: document.getElementById('product-is-active').checked,
      };

      try {
        let response;
        if (productId) {
          // Update existing product
          response = await API.put(\`/products/\${productId}\`, formData);
        } else {
          // Create new product
          response = await API.post('/products', formData);
        }

        if (response.success || response.data) {
          showNotification(productId ? 'Product updated successfully' : 'Product created successfully', 'success');
          closeProductModal();
          loadProducts();
          loadDashboardStats();
        } else {
          showNotification(response.error || 'Failed to save product', 'error');
        }
      } catch (error) {
        showNotification('Error saving product', 'error');
        console.error('Error saving product:', error);
      }
    });

    // Close modal when clicking outside
    document.getElementById('product-modal').addEventListener('click', function(e) {
      if (e.target === this) {
        closeProductModal();
      }
    });

    window.deleteProduct = async function(id) {
      if (!confirm('Are you sure you want to delete this product?')) {
        return;
      }

      try {
        await API.delete(\`/products/\${id}\`);
        showNotification('Product deleted successfully', 'success');
        loadProducts();
      } catch (error) {
        showNotification('Error deleting product', 'error');
      }
    };

    document.getElementById('add-product-btn').addEventListener('click', () => {
      openAddProductModal();
    });

    // Add Product button is visible to all admins

    // Inquiry Management Functions
    window.viewInquiry = async function(id) {
      try {
        const response = await API.get(\`/inquiries/\${id}\`);
        if (response.success) {
          const inquiry = response.data;
          alert(\`
Inquiry Details:
----------------
Name: \${inquiry.name}
Email: \${inquiry.email}
Company: \${inquiry.company || 'N/A'}
Phone: \${inquiry.phone || 'N/A'}
Country: \${inquiry.country || 'N/A'}
Product: \${inquiry.product_name || 'General Inquiry'}
Message: \${inquiry.message}
Status: \${inquiry.status}
Date: \${new Date(inquiry.created_at).toLocaleString()}
          \`);
          // TODO: Implement better inquiry viewing modal
        }
      } catch (error) {
        showNotification('Error loading inquiry details', 'error');
      }
    };

    window.deleteInquiry = async function(id) {
      if (!confirm('Are you sure you want to delete this inquiry?')) {
        return;
      }

      try {
        await API.delete(\`/inquiries/\${id}\`);
        showNotification('Inquiry deleted successfully', 'success');
        loadInquiries();
        loadDashboardStats();
      } catch (error) {
        showNotification('Error deleting inquiry', 'error');
      }
    };

    // Settings Management Functions
    async function loadSettings() {
      try {
        const response = await API.get('/settings');
        if (response.success) {
          const settings = response.data;

          // Populate form fields
          document.getElementById('settings-site-name').value = settings.site_name || '';
          document.getElementById('settings-site-description').value = settings.site_description || '';
          document.getElementById('settings-company-intro').value = settings.company_intro || '';
          document.getElementById('settings-email').value = settings.email || '';
          document.getElementById('settings-phone').value = settings.phone || '';
          document.getElementById('settings-address').value = settings.address || '';
          document.getElementById('settings-linkedin').value = settings.linkedin || '';
          document.getElementById('settings-facebook').value = settings.facebook || '';
          document.getElementById('settings-twitter').value = settings.twitter || '';
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Error loading settings', 'error');
      }
    }

    window.loadSettings = loadSettings;

    // Handle Image Migration
    const migrationBtn = document.getElementById('trigger-migration-btn');
    if (migrationBtn) migrationBtn.addEventListener('click', async function() {
      if (!confirm('Are you sure you want to start the image migration? This process will move all images from R2 to ImageKit and cannot be easily undone.')) {
        return;
      }

      const btn = this;
      const statusDiv = document.getElementById('migration-status');
      
      btn.disabled = true;
      btn.textContent = '⏳ Migrating...';
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = 'Starting migration process...';
      statusDiv.style.color = 'var(--text-dark)';

      try {
        const response = await API.post('/migrate', {});
        if (response.success) {
          const res = response.results;
          statusDiv.innerHTML = \`
            <strong>Migration Complete!</strong><br>
            Categories: \${res.categories.migrated} migrated, \${res.categories.skipped} skipped, \${res.categories.failed} failed.<br>
            Products: \${res.products.migrated} migrated, \${res.products.skipped} skipped, \${res.products.failed} failed.<br>
            \${res.errors.length > 0 ? \`<span style="color: #ef4444;">Errors: \${res.errors.length} (see console)</span>\` : ''}
          \`;
          statusDiv.style.color = '#15803d';
          showNotification('Image migration completed successfully', 'success');
        } else {
          throw new Error(response.error || 'Migration failed');
        }
      } catch (error) {
        console.error('Migration error:', error);
        statusDiv.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
        statusDiv.style.color = '#ef4444';
        showNotification('Image migration failed', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Restart Image Migration';
      }
    });

    // Handle settings form submission
    document.getElementById('settings-form').addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = {
        site_name: document.getElementById('settings-site-name').value,
        site_description: document.getElementById('settings-site-description').value,
        company_intro: document.getElementById('settings-company-intro').value,
        email: document.getElementById('settings-email').value,
        phone: document.getElementById('settings-phone').value,
        address: document.getElementById('settings-address').value,
        linkedin: document.getElementById('settings-linkedin').value,
        facebook: document.getElementById('settings-facebook').value,
        twitter: document.getElementById('settings-twitter').value,
      };

      try {
        const response = await API.post('/settings', formData);
        if (response.success) {
          showNotification('Settings saved successfully', 'success');
        } else {
          showNotification(response.error || 'Failed to save settings', 'error');
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
      }
    });

    // ==========================================
    // LIVE CHAT MANAGEMENT
    // ==========================================

    let chatSessionsInterval = null;
    let chatMessagesInterval = null;
    let currentChatSessionId = null;
    let lastChatMessageId = 0;
    let currentChatFilter = 'open';

    function startChatSessionPolling() {
      loadChatSessions(currentChatFilter);
      clearInterval(chatSessionsInterval);
      chatSessionsInterval = setInterval(() => {
        loadChatSessions(currentChatFilter, true);
      }, 5000);
    }

    function stopChatPolling() {
      clearInterval(chatSessionsInterval);
      clearInterval(chatMessagesInterval);
      chatSessionsInterval = null;
      chatMessagesInterval = null;
    }

    async function loadChatSessions(status = 'open', silent = false) {
      currentChatFilter = status;

      // Update filter button styles
      const openBtn = document.getElementById('chat-filter-open');
      const closedBtn = document.getElementById('chat-filter-closed');
      if (openBtn && closedBtn) {
        if (status === 'open') {
          openBtn.className = 'btn btn-primary';
          openBtn.style.cssText = 'padding: 0.25rem 0.75rem; font-size: 0.8rem;';
          closedBtn.className = 'btn';
          closedBtn.style.cssText = 'padding: 0.25rem 0.75rem; font-size: 0.8rem; background: #e5e7eb; color: var(--text-dark);';
        } else {
          closedBtn.className = 'btn btn-primary';
          closedBtn.style.cssText = 'padding: 0.25rem 0.75rem; font-size: 0.8rem;';
          openBtn.className = 'btn';
          openBtn.style.cssText = 'padding: 0.25rem 0.75rem; font-size: 0.8rem; background: #e5e7eb; color: var(--text-dark);';
        }
      }

      const list = document.getElementById('chat-sessions-list');

      try {
        const currentToken = localStorage.getItem('admin_token');
        const response = await fetch(\`/api/chat/sessions?status=\${status}\`, {
          headers: { 'Authorization': \`Bearer \${currentToken}\` }
        });
        const data = await response.json();

        if (!list) return;

        if (!data.success) {
          if (!silent) {
            list.innerHTML = \`<p style="text-align: center; color: #ef4444; padding: 1rem; font-size: 0.85rem;">Error: \${data.error || 'Failed to load'}</p>\`;
          }
          return;
        }

        const sessions = data.data || [];

        // Update badge
        const badge = document.getElementById('chat-badge');
        if (badge) {
          const unread = sessions.filter(s => s.last_sender_type === 'visitor').length;
          if (unread > 0 && status === 'open') {
            badge.textContent = unread;
            badge.style.display = 'inline';
          } else {
            badge.style.display = 'none';
          }
        }

        if (sessions.length === 0) {
          list.innerHTML = \`<p style="text-align: center; color: var(--text-light); padding: 2rem; font-size: 0.9rem;">No \${status} conversations</p>\`;
          return;
        }

        list.innerHTML = sessions.map(s => {
          const isActive = s.session_id === currentChatSessionId;
          const hasUnread = s.last_sender_type === 'visitor';
          const time = s.last_message_at ? new Date(s.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          return \`<div onclick="openChatSession('\${s.session_id}', '\${(s.visitor_name || '').replace(/'/g, "\\\\'")}', '\${s.status}')"
            style="padding: 0.75rem; border-radius: 0.375rem; cursor: pointer; margin-bottom: 0.25rem;
                   background: \${isActive ? '#eff6ff' : 'white'};
                   border: 1px solid \${isActive ? 'var(--primary-color)' : 'var(--border-color)'};
                   transition: background 0.15s;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
              <span style="font-weight: \${hasUnread ? '700' : '500'}; font-size: 0.9rem; color: var(--text-dark);">
                \${hasUnread ? '🔵 ' : ''}\${s.visitor_name || 'Visitor'}
              </span>
              <span style="font-size: 0.75rem; color: var(--text-light);">\${time}</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-light); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;">
              \${s.last_message ? (s.last_sender_type === 'admin' ? '↩ ' : '') + s.last_message.slice(0, 60) : 'No messages yet'}
            </p>
            <p style="font-size: 0.75rem; color: #9ca3af; margin: 0.25rem 0 0;">
              \${s.page_url || ''} · \${s.total_messages || 0} msg
            </p>
          </div>\`;
        }).join('');
      } catch (err) {
        if (!silent) {
          if (list) list.innerHTML = \`<p style="text-align: center; color: #ef4444; padding: 1rem; font-size: 0.85rem;">Error: \${err.message}</p>\`;
        }
      }
    }

    async function openChatSession(sessionId, visitorName, status) {
      currentChatSessionId = sessionId;
      lastChatMessageId = 0;

      // Update header
      const header = document.getElementById('chat-reply-header');
      if (header) {
        header.innerHTML = \`
          <div>
            <span style="font-weight: 600; font-size: 0.95rem;">\${visitorName}</span>
            <span style="margin-left: 0.5rem; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 9999px;
              background: \${status === 'open' ? '#dcfce7' : '#f3f4f6'};
              color: \${status === 'open' ? '#15803d' : '#6b7280'};">\${status}</span>
          </div>
          <button onclick="deleteCurrentSession()" class="btn" style="background: #fee2e2; color: #dc2626; padding: 0.3rem 0.75rem; font-size: 0.8rem;">🗑 Delete</button>
        \`;
      }

      // Show/hide input area based on status
      const inputArea = document.getElementById('chat-reply-input-area');
      if (inputArea) inputArea.style.display = status === 'open' ? 'block' : 'none';

      // Clear messages
      const msgArea = document.getElementById('chat-reply-messages');
      if (msgArea) msgArea.innerHTML = '<p style="text-align:center; color: var(--text-light); margin: auto;">Loading...</p>';

      // Load messages
      await fetchChatMessages();

      // Start polling
      clearInterval(chatMessagesInterval);
      chatMessagesInterval = setInterval(fetchChatMessages, 3000);

      // Re-render sessions to highlight active
      loadChatSessions(currentChatFilter, true);
    }

    async function fetchChatMessages() {
      if (!currentChatSessionId) return;
      try {
        const response = await fetch(\`/api/chat/messages?session_id=\${currentChatSessionId}&after=\${lastChatMessageId}\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const data = await response.json();
        if (!data.success) return;

        const messages = data.data || [];
        if (messages.length === 0) {
          const msgArea = document.getElementById('chat-reply-messages');
          if (msgArea && lastChatMessageId === 0) {
            msgArea.innerHTML = '<p style="text-align:center; color: var(--text-light); margin: auto; font-size: 0.9rem;">No messages yet</p>';
          }
          return;
        }

        lastChatMessageId = messages[messages.length - 1].id;

        const msgArea = document.getElementById('chat-reply-messages');
        if (!msgArea) return;

        // Clear placeholder
        if (msgArea.querySelector('p')) msgArea.innerHTML = '';

        messages.forEach(msg => {
          const isAdmin = msg.sender_type === 'admin';
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const div = document.createElement('div');
          div.style.cssText = \`display: flex; flex-direction: column; align-items: \${isAdmin ? 'flex-end' : 'flex-start'};\`;
          div.innerHTML = \`
            <div style="max-width: 75%; padding: 0.6rem 0.9rem; border-radius: \${isAdmin ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem'};
              background: \${isAdmin ? 'var(--primary-color)' : 'white'};
              color: \${isAdmin ? 'white' : 'var(--text-dark)'};
              box-shadow: 0 1px 2px rgba(0,0,0,0.08); font-size: 0.9rem; line-height: 1.4;">
              \${msg.message}
            </div>
            <span style="font-size: 0.72rem; color: var(--text-light); margin-top: 0.2rem; padding: 0 0.25rem;">
              \${isAdmin ? 'You' : msg.sender_name} · \${time}
            </span>
          \`;
          msgArea.appendChild(div);
        });

        msgArea.scrollTop = msgArea.scrollHeight;
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    }

    async function sendAdminReply() {
      const input = document.getElementById('admin-reply-input');
      const message = input ? input.value.trim() : '';
      if (!message || !currentChatSessionId) return;

      input.value = '';
      input.disabled = true;

      try {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({
            session_id: currentChatSessionId,
            sender_type: 'admin',
            sender_name: 'Support',
            message
          })
        });
        const data = await response.json();
        if (data.success) {
          await fetchChatMessages();
        } else {
          showNotification(data.error || 'Failed to send reply', 'error');
          input.value = message;
        }
      } catch (err) {
        showNotification('Error sending reply', 'error');
        input.value = message;
      } finally {
        input.disabled = false;
        input.focus();
      }
    }

    async function closeCurrentSession() {
      if (!currentChatSessionId) return;
      if (!confirm('Close this chat session?')) return;

      try {
        const response = await fetch('/api/chat/session/close', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({ session_id: currentChatSessionId })
        });
        const data = await response.json();
        if (data.success) {
          showNotification('Session closed', 'success');
          clearInterval(chatMessagesInterval);
          currentChatSessionId = null;
          document.getElementById('chat-reply-header').innerHTML = '<span style="font-weight: 600; color: var(--text-light); font-size: 0.95rem;">Select a conversation</span>';
          document.getElementById('chat-reply-messages').innerHTML = '<p style="text-align: center; color: var(--text-light); margin: auto; font-size: 0.9rem;">No conversation selected</p>';
          document.getElementById('chat-reply-input-area').style.display = 'none';
          loadChatSessions('open');
        }
      } catch (err) {
        showNotification('Error closing session', 'error');
      }
    }

    async function deleteCurrentSession() {
      if (!currentChatSessionId) return;
      if (!confirm('Permanently delete this conversation and all its messages? This cannot be undone.')) return;

      try {
        const response = await fetch('/api/chat/session', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${localStorage.getItem('admin_token')}\`
          },
          body: JSON.stringify({ session_id: currentChatSessionId })
        });
        const data = await response.json();
        if (data.success) {
          showNotification('Session deleted', 'success');
          clearInterval(chatMessagesInterval);
          currentChatSessionId = null;
          document.getElementById('chat-reply-header').innerHTML = '<span style="font-weight: 600; color: var(--text-light); font-size: 0.95rem;">Select a conversation</span>';
          document.getElementById('chat-reply-messages').innerHTML = '<p style="text-align: center; color: var(--text-light); margin: auto; font-size: 0.9rem;">No conversation selected</p>';
          document.getElementById('chat-reply-input-area').style.display = 'none';
          loadChatSessions(currentChatFilter);
        } else {
          showNotification(data.error || 'Failed to delete session', 'error');
        }
      } catch (err) {
        showNotification('Error deleting session', 'error');
      }
    }

    // Stop chat polling when switching away from livechat tab
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.getAttribute('data-tab') !== 'livechat') {
          stopChatPolling();
        }
      });
    });

    // Initialize dashboard
    loadDashboardStats();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
  });
}

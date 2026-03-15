/**
 * Products Page
 * Displays all products with filtering options
 */

import { createLayout } from './layout';

export async function productsPage(env) {
  // Load settings from KV for SEO
  let siteName = 'B2B Product Exhibition';
  try {
    const settingsJson = await env.STATIC_ASSETS.get('website_settings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      siteName = settings.site_name || siteName;
    }
  } catch (error) {
    console.error('Error loading settings for SEO:', error);
  }

  const content = `
    <!-- Page Header -->
    <section class="hero" style="padding: 3rem 2rem;">
      <div class="container">
        <h1>Our Products</h1>
        <p>Explore our comprehensive range of high-quality products</p>
      </div>
    </section>

    <!-- Products Section -->
    <section class="container" style="margin-top: 2rem; margin-bottom: 3rem;">
      <!-- Filter Bar -->
      <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 2rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <label style="font-weight: 500;">Category:</label>
          <select id="category-filter" class="form-input" style="max-width: 200px;">
            <option value="">All Categories</option>
            <!-- Categories will be loaded dynamically -->
          </select>
          <input
            type="text"
            id="search-input"
            placeholder="Search products..."
            class="form-input"
            style="flex: 1; min-width: 200px;"
          />
          <button id="search-btn" class="btn btn-primary">Search</button>
        </div>
      </div>

      <!-- Products Grid -->
      <div id="products-container" class="grid grid-3">
        <div class="spinner"></div>
      </div>

      <!-- No Results Message -->
      <div id="no-results" style="display: none; text-align: center; padding: 3rem;">
        <p style="color: var(--text-light); font-size: 1.2rem;">No products found matching your criteria.</p>
      </div>
    </section>
  `;

  const scripts = `
    <script>
      let allProducts = [];

      // Load categories dynamically
      function loadCategories(products) {
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        const categoryFilter = document.getElementById('category-filter');

        // Keep "All Categories" option and add dynamic categories
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.textContent = category;
          categoryFilter.appendChild(option);
        });
      }

      // Load all products
      async function loadProducts() {
        try {
          const response = await API.get('/products');
          allProducts = response.data || [];
          loadCategories(allProducts);
          displayProducts(allProducts);
        } catch (error) {
          console.error('Error loading products:', error);
          document.getElementById('products-container').innerHTML =
            '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">Unable to load products. Please try again later.</p>';
        }
      }

      // Display products
      function displayProducts(products) {
        const container = document.getElementById('products-container');
        const noResults = document.getElementById('no-results');

        if (products.length === 0) {
          container.innerHTML = '';
          noResults.style.display = 'block';
          return;
        }

        noResults.style.display = 'none';
        container.innerHTML = products.map(product => \`
          <div class="card">
            <img src="\${product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="\${product.name}" class="card-image" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
            <div class="card-content">
              <div style="margin-bottom: 0.5rem;">
                <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.85rem;">
                  \${product.category || 'General'}
                </span>
              </div>
              <h3 class="card-title">\${product.name}</h3>
              <p class="card-description">\${product.description || 'No description available'}</p>
              <a href="/products/\${product.id}" class="btn btn-primary">View Details</a>
            </div>
          </div>
        \`).join('');
      }

      // Filter products
      function filterProducts() {
        const category = document.getElementById('category-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        const filtered = allProducts.filter(product => {
          const matchesCategory = !category || product.category === category;
          const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));

          return matchesCategory && matchesSearch;
        });

        displayProducts(filtered);
      }

      // Event listeners
      document.getElementById('category-filter').addEventListener('change', filterProducts);
      document.getElementById('search-input').addEventListener('input', filterProducts);
      document.getElementById('search-btn').addEventListener('click', filterProducts);

      // Allow Enter key to search
      document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          filterProducts();
        }
      });

      // Load products on page load
      loadProducts();

      // Add styles for product card description - limit to 3 lines
      const descriptionStyle = document.createElement('style');
      descriptionStyle.textContent = \`
        .card-description {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.5;
        }
      \`;
      document.head.appendChild(descriptionStyle);
    </script>
  `;

  const html = createLayout(
    `Products - ${siteName}`,
    content,
    scripts,
    `Browse our comprehensive range of high-quality products - ${siteName}`,
    false // Don't use title suffix, we already included site name
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

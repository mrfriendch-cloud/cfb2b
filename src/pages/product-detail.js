/**
 * Product Detail Page
 * Displays detailed information about a specific product
 */

import { createLayout } from "./layout";

export async function productDetailPage(request, env) {
  const url = new URL(request.url);
  const productId = url.pathname.split("/").pop();

  // Load product info from database for SEO
  let pageTitle = "Product Details";
  let metaDescription = "View detailed product information";

  try {
    const product = await env.DB.prepare("SELECT * FROM products WHERE id = ?")
      .bind(productId)
      .first();
    if (product) {
      pageTitle = product.name;
      metaDescription =
        product.description ||
        product.detailed_description ||
        `${product.name} - High-quality product`;
      // Limit meta description to 160 characters for SEO
      if (metaDescription.length > 160) {
        metaDescription = metaDescription.substring(0, 157) + "...";
      }
    }
  } catch (error) {
    console.error("Error loading product for SEO:", error);
  }

  const content = `
    <!-- Product Detail Container -->
    <div id="product-detail" class="container" style="margin-top: 2rem; margin-bottom: 3rem;">
      <div class="spinner"></div>
    </div>

    <!-- Inquiry Modal -->
    <div id="inquiry-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; padding: 2rem;">
      <div style="max-width: 600px; margin: 2rem auto; background: white; border-radius: 0.5rem; padding: 2rem; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="color: var(--primary-color);">Send Inquiry</h2>
          <button id="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-light);">&times;</button>
        </div>

        <form id="inquiry-form">
          <input type="hidden" id="inquiry-product-id" value="${productId}">

          <div class="form-group">
            <label class="form-label">Your Name *</label>
            <input type="text" id="inquiry-name" class="form-input" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email *</label>
            <input type="email" id="inquiry-email" class="form-input" required>
          </div>

          <div class="form-group">
            <label class="form-label">Company</label>
            <input type="text" id="inquiry-company" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" id="inquiry-phone" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Country</label>
            <input type="text" id="inquiry-country" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Message *</label>
            <textarea id="inquiry-message" class="form-textarea" required></textarea>
          </div>

          <div style="display: flex; gap: 1rem;">
            <button type="submit" class="btn btn-primary">Send Inquiry</button>
            <button type="button" id="cancel-inquiry" class="btn" style="background: #6b7280; color: white;">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const scripts = `
    <script>
      const productId = "${productId}";

      // Load product details
      async function loadProductDetail() {
        try {
          console.log('Loading product with ID:', productId);
          const response = await API.get(\`/products/\${productId}\`);
          console.log('API response:', response);

          if (!response || !response.success) {
            document.getElementById('product-detail').innerHTML =
              '<p style="text-align: center; color: var(--text-light);">Failed to load product. Response: ' + JSON.stringify(response) + '</p>';
            return;
          }

          const product = response.data;

          if (!product) {
            document.getElementById('product-detail').innerHTML =
              '<p style="text-align: center; color: var(--text-light);">Product not found.</p>';
            return;
          }

          console.log('Product loaded successfully:', product);

          document.getElementById('product-detail').innerHTML = \`
            <!-- Breadcrumb -->
            <div style="margin-bottom: 2rem;">
              <a href="/" style="color: var(--text-light); text-decoration: none;">Home</a>
              <span style="color: var(--text-light);"> / </span>
              <a href="/products" style="color: var(--text-light); text-decoration: none;">Products</a>
              <span style="color: var(--text-light);"> / </span>
              <span style="color: var(--primary-color);">\${product.name}</span>
            </div>

            <!-- Product Detail Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem;">
              <!-- Product Images -->
              <div>
                <img src="\${getImageKitUrl(product.image_url, 'w-600,h-500,cm-pad_resize,bg-F3F3F6') || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="\${product.name}"
                  style="width: 100%; max-height: 500px; object-fit: contain; background: #f3f4f6; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
                  onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
              </div>

              <!-- Product Info -->
              <div>
                <div style="margin-bottom: 1rem;">
                  <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.85rem;">
                    \${product.category || 'General'}
                  </span>
                </div>

                <h1 style="font-size: 2rem; margin-bottom: 1rem; color: var(--text-dark);">\${product.name}</h1>

                <p style="color: var(--text-light); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">
                  \${product.description || 'No description available'}
                </p>

                \${(product.price !== null && product.price !== undefined) || (product.quantity !== null && product.quantity !== undefined) ? \`
                <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                  \${product.price !== null && product.price !== undefined ? \`
                  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.5rem; padding: 0.75rem 1.25rem; min-width: 120px;">
                    <div style="font-size: 0.8rem; color: #2563eb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Price</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #1e40af;">$\${parseFloat(product.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>
                  \` : ''}
                  \${product.quantity !== null && product.quantity !== undefined ? \`
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 0.75rem 1.25rem; min-width: 120px;">
                    <div style="font-size: 0.8rem; color: #16a34a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">MOQ / Quantity</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #15803d;">\${parseInt(product.quantity).toLocaleString()} units</div>
                  </div>
                  \` : ''}
                </div>
                \` : ''}

                <button id="send-inquiry-btn" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem;">
                  Send Inquiry
                </button>
              </div>
            </div>

            <!-- Detailed Description -->
            <div style="background: var(--bg-light); padding: 2rem; border-radius: 0.5rem; margin-bottom: 2rem;">
              <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary-color);">Product Description</h2>
              <p style="color: var(--text-dark); line-height: 1.8; white-space: pre-line;">
                \${product.detailed_description || product.description || 'No detailed description available'}
              </p>
            </div>

            <!-- Specifications -->
            \${product.specifications ? \`
              <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary-color);">Specifications</h2>
                <pre style="color: var(--text-dark); line-height: 2; white-space: pre-line; font-family: inherit;">
\${product.specifications}
                </pre>
              </div>
            \` : ''}
          \`;

          // Attach event listener to send inquiry button
          document.getElementById('send-inquiry-btn').addEventListener('click', openInquiryModal);

        } catch (error) {
          console.error('Error loading product:', error);
          document.getElementById('product-detail').innerHTML =
            '<p style="text-align: center; color: var(--text-light);">Unable to load product details. Please try again later.</p>';
        }
      }

      // Open inquiry modal
      function openInquiryModal() {
        document.getElementById('inquiry-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
      }

      // Close inquiry modal
      function closeInquiryModal() {
        document.getElementById('inquiry-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
      }

      // Handle inquiry form submission
      document.getElementById('inquiry-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
          product_id: parseInt(document.getElementById('inquiry-product-id').value),
          name: document.getElementById('inquiry-name').value,
          email: document.getElementById('inquiry-email').value,
          company: document.getElementById('inquiry-company').value,
          phone: document.getElementById('inquiry-phone').value,
          country: document.getElementById('inquiry-country').value,
          message: document.getElementById('inquiry-message').value,
        };

        try {
          await API.post('/inquiries', formData);
          showNotification('Inquiry sent successfully! We will contact you soon.', 'success');
          closeInquiryModal();
          document.getElementById('inquiry-form').reset();
        } catch (error) {
          console.error('Error sending inquiry:', error);
          showNotification('Failed to send inquiry. Please try again.', 'error');
        }
      });

      // Event listeners
      document.getElementById('close-modal').addEventListener('click', closeInquiryModal);
      document.getElementById('cancel-inquiry').addEventListener('click', closeInquiryModal);

      // Close modal when clicking outside
      document.getElementById('inquiry-modal').addEventListener('click', (e) => {
        if (e.target.id === 'inquiry-modal') {
          closeInquiryModal();
        }
      });

      // Load product on page load
      loadProductDetail();

      // Add responsive styles
      const responsiveStyle = document.createElement('style');
      responsiveStyle.textContent = \`
        @media (max-width: 768px) {
          #product-detail > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      \`;
      document.head.appendChild(responsiveStyle);
    </script>
  `;

  const html = createLayout(
    pageTitle,
    content,
    scripts,
    metaDescription,
    false, // Don't use title suffix for product pages, use product name only
  );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
  });
}

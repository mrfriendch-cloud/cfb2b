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
      if (metaDescription.length > 160) {
        metaDescription = metaDescription.substring(0, 157) + "...";
      }
    }
  } catch (error) {
    console.error("Error loading product for SEO:", error);
  }

  const content = `
    <div id="product-detail" class="container" style="margin-top: 2rem; margin-bottom: 3rem;">
      <div class="spinner"></div>
    </div>
  `;

  const scripts = `
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/marked/16.3.0/lib/marked.umd.min.js"
      integrity="sha512-V6rGY7jjOEUc7q5Ews8mMlretz1Vn2wLdMW/qgABLWunzsLfluM0FwHuGjGQ1lc8jO5vGpGIGFE+rTzB+63HdA=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.2.7/purify.min.js"
      integrity="sha512-78KH17QLT5e55GJqP76vutp1D2iAoy06WcYBXB6iBCsmO6wWzx0Qdg8EDpm8mKXv68BcvHOyeeP4wxAL0twJGQ=="
      crossorigin="anonymous"
    ></script>
    <script>
      const productId = "${productId}";

      function renderMarkdown(text) {
        if (!text || text.trim() === '') return null;
        try {
          var rawHtml = marked.parse(text);
          return DOMPurify.sanitize(rawHtml);
        } catch (_err) {
          return null;
        }
      }

      function isVideo(url) {
        return /\\.(mp4|webm|ogg)/i.test(url.split('?')[0]);
      }

      function mediaThumb(url, idx, isActive) {
        var border = isActive ? 'border:2px solid var(--primary-color);' : 'border:2px solid transparent;';
        var base = 'cursor:pointer;' + border + 'border-radius:0.375rem;overflow:hidden;width:72px;height:72px;flex-shrink:0;';
        if (isVideo(url)) {
          return '<div onclick="selectMedia(' + idx + ')" data-idx="' + idx + '" style="' + base + 'background:#000;display:flex;align-items:center;justify-content:center;position:relative;">'
            + '<video src="' + url + '" style="width:100%;height:100%;object-fit:cover;" muted></video>'
            + '<span style="position:absolute;color:white;font-size:1.4rem;text-shadow:0 1px 4px rgba(0,0,0,0.8);">&#9654;</span>'
            + '</div>';
        }
        return '<div onclick="selectMedia(' + idx + ')" data-idx="' + idx + '" style="' + base + '">'
          + '<img src="' + getImageKitUrl(url, 'w-144,h-144,cm-pad_resize,bg-F3F3F6') + '" style="width:100%;height:100%;object-fit:cover;">'
          + '</div>';
      }

      function mainMediaHtml(url, altText) {
        if (isVideo(url)) {
          return '<video id="main-media-video" src="' + url + '" controls style="width:100%;max-height:500px;border-radius:0.5rem;background:#000;"></video>';
        }
        return '<img id="main-media-img" src="' + getImageKitUrl(url, 'w-700,h-500,cm-pad_resize,bg-F3F3F6') + '" alt="' + (altText || '') + '" style="width:100%;max-height:500px;object-fit:contain;background:#f3f4f6;border-radius:0.5rem;box-shadow:0 4px 6px rgba(0,0,0,0.1);">';
      }

      async function loadProductDetail() {
        try {
          const response = await API.get('/products/' + productId);

          if (!response || !response.success) {
            document.getElementById('product-detail').innerHTML = '<p style="text-align:center;color:var(--text-light);">Failed to load product.</p>';
            return;
          }

          const product = response.data;
          if (!product) {
            document.getElementById('product-detail').innerHTML = '<p style="text-align:center;color:var(--text-light);">Product not found.</p>';
            return;
          }

          // Build media list
          var galleryUrls = [];
          try { galleryUrls = JSON.parse(product.gallery_images || '[]'); } catch(e) {}
          var allMedia = [];
          if (product.image_url) allMedia.push(product.image_url);
          galleryUrls.forEach(function(u) { if (u && allMedia.indexOf(u) === -1) allMedia.push(u); });

          // Thumbnails
          var thumbsHtml = '';
          if (allMedia.length > 1) {
            thumbsHtml = '<div id="gallery-thumbs" style="display:flex;flex-direction:column;gap:0.5rem;overflow-y:auto;max-height:500px;padding-right:4px;">';
            allMedia.forEach(function(u, i) { thumbsHtml += mediaThumb(u, i, i === 0); });
            thumbsHtml += '</div>';
          }

          var mainUrl = allMedia[0] || '';
          var mainHtml = mainUrl
            ? mainMediaHtml(mainUrl, product.name)
            : '<div style="background:#f3f4f6;border-radius:0.5rem;height:400px;display:flex;align-items:center;justify-content:center;color:var(--text-light);">No image</div>';

          // Price / quantity blocks
          var priceHtml = '';
          if (product.price !== null && product.price !== undefined) {
            priceHtml += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:0.5rem;padding:0.75rem 1.25rem;min-width:120px;">'
              + '<div style="font-size:0.8rem;color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;">Price</div>'
              + '<div style="font-size:1.5rem;font-weight:700;color:#1e40af;">$' + parseFloat(product.price).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) + '</div>'
              + '</div>';
          }
          if (product.quantity !== null && product.quantity !== undefined) {
            priceHtml += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:0.5rem;padding:0.75rem 1.25rem;min-width:120px;">'
              + '<div style="font-size:0.8rem;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;">MOQ / Quantity</div>'
              + '<div style="font-size:1.5rem;font-weight:700;color:#15803d;">' + parseInt(product.quantity).toLocaleString() + ' units</div>'
              + '</div>';
          }
          var priceSectionHtml = priceHtml
            ? '<div style="display:flex;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">' + priceHtml + '</div>'
            : '';

          document.getElementById('product-detail').innerHTML =
            '<div style="margin-bottom:2rem;">'
              + '<a href="/" style="color:var(--text-light);text-decoration:none;">Home</a>'
              + '<span style="color:var(--text-light);"> / </span>'
              + '<a href="/products" style="color:var(--text-light);text-decoration:none;">Products</a>'
              + '<span style="color:var(--text-light);"> / </span>'
              + '<span style="color:var(--primary-color);">' + product.name + '</span>'
            + '</div>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;margin-bottom:3rem;" id="product-grid">'
              + '<div id="gallery-container" style="display:flex;gap:0.75rem;">'
                + thumbsHtml
                + '<div id="main-media-wrap" style="flex:1;min-width:0;">' + mainHtml + '</div>'
              + '</div>'
              + '<div>'
                + '<div style="margin-bottom:1rem;"><span style="background:var(--primary-color);color:white;padding:0.25rem 0.75rem;border-radius:1rem;font-size:0.85rem;">' + (product.category_name || 'General') + '</span></div>'
                + '<h1 style="font-size:2rem;margin-bottom:1rem;color:var(--text-dark);">' + product.name + '</h1>'
                + '<p style="color:var(--text-light);font-size:1.1rem;line-height:1.8;margin-bottom:1.5rem;">' + (product.description || 'No description available') + '</p>'
                + priceSectionHtml
                + '<button id="send-inquiry-btn" class="btn btn-primary" style="font-size:1.1rem;padding:1rem 2rem;">Send Inquiry</button>'
              + '</div>'
            + '</div>'
            + '<div style="background:var(--bg-light);padding:2rem;border-radius:0.5rem;margin-bottom:2rem;">'
              + '<h2 style="font-size:1.5rem;margin-bottom:1rem;color:var(--primary-color);">Product Description</h2>'
              + (function() {
                  var mdText = product.detailed_description || '';
                  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                    try {
                      var safeHtml = renderMarkdown(mdText);
                      if (safeHtml) {
                        return '<div class="md-body">' + safeHtml + '</div>';
                      }
                      return '<p>No detailed description available</p>';
                    } catch (_e) {
                      return '<p style="color:var(--text-dark);line-height:1.8;white-space:pre-line;">' + mdText + '</p>';
                    }
                  }
                  return '<p style="color:var(--text-dark);line-height:1.8;white-space:pre-line;">' + (mdText || product.description || 'No detailed description available') + '</p>';
                })()
            + '</div>';

          window.selectMedia = function(idx) {
            var url = allMedia[idx];
            if (!url) return;
            document.getElementById('main-media-wrap').innerHTML = mainMediaHtml(url, product.name);
            document.querySelectorAll('#gallery-thumbs > div').forEach(function(el, i) {
              el.style.border = i === idx ? '2px solid var(--primary-color)' : '2px solid transparent';
            });
          };

          document.getElementById('send-inquiry-btn').addEventListener('click', function() {
            // Pre-fill the contact form message with product context
            var productName = product.name;
            var productUrl = window.location.href;
            var messageField = document.getElementById('cfp-message');
            if (messageField && typeof window.toggleContactFormPanel === 'function') {
              messageField.value = 'I am interested in: ' + productName + '\\nProduct URL: ' + productUrl + '\\n\\n';
              window.toggleContactFormPanel();
            }
          });

        } catch (error) {
          console.error('Error loading product:', error);
          document.getElementById('product-detail').innerHTML = '<p style="text-align:center;color:var(--text-light);">Unable to load product details. Please try again later.</p>';
        }
      }

      loadProductDetail();

      var responsiveStyle = document.createElement('style');
      responsiveStyle.textContent = '@media (max-width: 768px) { #product-grid { grid-template-columns: 1fr !important; } #gallery-container { flex-direction: column !important; } #gallery-thumbs { flex-direction: row !important; max-height: none !important; overflow-x: auto; overflow-y: hidden; padding-right: 0; padding-bottom: 4px; order: 2; } #main-media-wrap { order: 1; } }';
      document.head.appendChild(responsiveStyle);

      var mdBodyStyle = document.createElement('style');
      mdBodyStyle.textContent = [
        '.md-body { color: var(--text-dark, #1f2937); line-height: 1.75; font-size: 1rem; }',
        '.md-body h1 { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: var(--text-dark, #111827); }',
        '.md-body h2 { font-size: 1.6rem; font-weight: 700; margin: 1.4rem 0 0.7rem; color: var(--text-dark, #111827); }',
        '.md-body h3 { font-size: 1.35rem; font-weight: 600; margin: 1.25rem 0 0.6rem; color: var(--text-dark, #111827); }',
        '.md-body h4 { font-size: 1.15rem; font-weight: 600; margin: 1.1rem 0 0.5rem; color: var(--text-dark, #111827); }',
        '.md-body h5 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.5rem; color: var(--text-dark, #111827); }',
        '.md-body h6 { font-size: 0.9rem; font-weight: 600; margin: 0.9rem 0 0.45rem; color: var(--text-light, #6b7280); }',
        '.md-body ul { padding-left: 1.75rem; margin: 0.75rem 0; list-style: disc; }',
        '.md-body ol { padding-left: 1.75rem; margin: 0.75rem 0; list-style: decimal; }',
        '.md-body table { border-collapse: collapse; width: 100%; margin: 1rem 0; }',
        '.md-body th { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; background: #f9fafb; font-weight: 600; text-align: left; }',
        '.md-body td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; }',
        '.md-body tr:nth-child(even) { background-color: #f3f4f6; }',
        '.md-body code { background: #f1f5f9; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875em; padding: 0.15em 0.35em; border-radius: 0.25rem; }',
        '.md-body pre { background: #1e293b; color: #e2e8f0; padding: 1rem 1.25rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }',
        '.md-body pre code { background: transparent; color: inherit; padding: 0; font-size: 0.875rem; border-radius: 0; }',
        '.md-body blockquote { border-left: 4px solid var(--primary-color, #2563eb); padding-left: 1rem; margin: 1rem 0; color: var(--text-light, #6b7280); font-style: italic; }',
        '.md-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }'
      ].join(' ');
      document.head.appendChild(mdBodyStyle);
    </script>
  `;

  const html = createLayout(
    pageTitle,
    content,
    scripts,
    metaDescription,
    false,
  );

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
  });
}

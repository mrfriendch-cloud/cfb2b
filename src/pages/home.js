/**
 * Home Page
 * Displays company introduction and featured products
 */

import { createLayout } from './layout';

export async function homePage(env) {
  // Load settings from KV for SEO
  let settings = {
    site_name: 'B2B Product Exhibition',
    site_description: 'We are a professional wholesale company in Kazakhstan specializing in Chinese knitted garments, building a bridge for Sino-Kazakh knitting trade.',
    company_intro: 'We are a professional wholesale enterprise in Kazakhstan founded by senior Chinese knitted garment practitioners, dedicated to providing cost-effective, diversified Chinese knitted products to fill local market gaps.'
  };

  try {
    const settingsJson = await env.STATIC_ASSETS.get('website_settings');
    if (settingsJson) {
      const savedSettings = JSON.parse(settingsJson);
      settings = { ...settings, ...savedSettings };
    }
  } catch (error) {
    console.error('Error loading settings for SEO:', error);
  }

  const content = `
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1>Welcome to Our B2B Product Exhibition</h1>
        <p id="hero-subtitle">Your trusted partner for high-quality industrial products and innovative solutions worldwide</p>
        <div style="margin-top: 2rem;">
          <a href="/products" class="btn btn-primary hide-on-mobile" style="margin-right: 1rem;">Browse Products</a>
          <a href="/contact" class="btn btn-secondary">Contact Us</a>
        </div>
      </div>
    </section>

    <style>
      @media (max-width: 768px) {
        .hide-on-mobile {
          display: none !important;
        }
      }
    </style>

    <!-- Featured Products -->
    <section class="container" style="margin-top: 3rem;">
      <h2 style="text-align: center; font-size: 2rem; margin-bottom: 2rem; color: var(--primary-color);">Featured Products</h2>
      <div id="featured-products" class="grid grid-3">
        <div class="spinner"></div>
      </div>
      <div style="text-align: center; margin-top: 2rem;">
        <a href="/products" class="btn btn-primary">View All Products</a>
      </div>
    </section>

    <!-- Company Features -->
    <section class="container" style="margin-top: 3rem; margin-bottom: 3rem;">
      <h2 style="text-align: center; font-size: 2rem; margin-bottom: 2rem; color: var(--primary-color);">Why Choose Us</h2>
      <div class="grid grid-3">
        <div class="card">
          <div class="card-content" style="text-align: center;">
            <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;">🏆</div>
            <h3 class="card-title">Premium Quality</h3>
            <p class="card-description">
              All products undergo strict quality control and meet international standards.
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-content" style="text-align: center;">
            <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;">🌍</div>
            <h3 class="card-title">Global Reach</h3>
            <p class="card-description">
              Serving customers in over 50 countries with reliable logistics and support.
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-content" style="text-align: center;">
            <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;">💼</div>
            <h3 class="card-title">Expert Service</h3>
            <p class="card-description">
              Professional team ready to provide customized solutions for your needs.
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-content" style="text-align: center;">
            <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;">⚡</div>
            <h3 class="card-title">Fast Delivery</h3>
            <p class="card-description">
              Efficient supply chain management ensures quick turnaround and on-time delivery.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;

  const scripts = `
    <script>
      // Load featured products
      async function loadFeaturedProducts() {
        try {
          const response = await API.get('/products/featured');
          const products = response.data || [];

          const container = document.getElementById('featured-products');

          if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No featured products available.</p>';
            return;
          }

          container.innerHTML = products.slice(0, 8).map(product => \`
            <div class="card">
              <img src="\${product.image_url || '/images/placeholder.jpg'}" alt="\${product.name}" class="card-image">
              <div class="card-content">
                <h3 class="card-title">\${product.name}</h3>
                <p class="card-description">\${product.description || 'No description available'}</p>
                <a href="/products/\${product.id}" class="btn btn-primary">View Details</a>
              </div>
            </div>
          \`).join('');
        } catch (error) {
          console.error('Error loading featured products:', error);
          document.getElementById('featured-products').innerHTML =
            '<p style="text-align: center; color: var(--text-light);">Unable to load products. Please try again later.</p>';
        }
      }

      // Load and apply home page settings
      async function loadHomeSettings() {
        try {
          const response = await API.get('/settings');
          if (response.success) {
            const settings = response.data;

            // Update hero subtitle
            const heroSubtitle = document.getElementById('hero-subtitle');
            if (heroSubtitle && settings.site_description) {
              heroSubtitle.textContent = settings.site_description;
            }

            // Update company introduction
            const companyIntro = document.getElementById('company-intro');
            if (companyIntro && settings.company_intro) {
              companyIntro.textContent = settings.company_intro;
            }
          }
        } catch (error) {
          console.error('Error loading home settings:', error);
        }
      }

      loadFeaturedProducts();
      loadHomeSettings();

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
    settings.site_name,
    content,
    scripts,
    settings.site_description,
    false // Don't use title suffix for home page
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

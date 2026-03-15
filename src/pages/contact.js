/**
 * Contact Page
 * Displays contact information and inquiry form
 */

import { createLayout } from './layout';

export async function contactPage(env) {
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
        <h1>Contact Us</h1>
        <p>Get in touch with us - we'd love to hear from you!</p>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="container" style="margin-top: 3rem; margin-bottom: 3rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
        <!-- Contact Information -->
        <div>
          <h2 style="font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--primary-color);">Get In Touch</h2>
          <p style="color: var(--text-light); line-height: 1.8; margin-bottom: 2rem;">
            Have a question or want to learn more about our products? We're here to help.
            Fill out the form or use our contact information below.
          </p>

          <div style="margin-bottom: 3rem;">
            <div style="display: flex; align-items: start; margin-bottom: 1.5rem;">
              <div style="font-size: 1.5rem; margin-right: 1rem; color: var(--primary-color);">📍</div>
              <div>
                <h3 style="font-weight: 600; margin-bottom: 0.25rem;">Address</h3>
                <p id="contact-address" style="color: var(--text-light);">123 Business Street<br>Industrial Zone<br>City, Country 12345</p>
              </div>
            </div>

            <div style="display: flex; align-items: start; margin-bottom: 1.5rem;">
              <div style="font-size: 1.5rem; margin-right: 1rem; color: var(--primary-color);">📧</div>
              <div>
                <h3 style="font-weight: 600; margin-bottom: 0.25rem;">Email</h3>
                <p id="contact-email-info" style="color: var(--text-light);">
                  <a id="contact-email-link" href="mailto:info@example.com" style="color: var(--primary-color);">info@example.com</a>
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: start; margin-bottom: 1.5rem;">
              <div style="font-size: 1.5rem; margin-right: 1rem; color: var(--primary-color);">📞</div>
              <div>
                <h3 style="font-weight: 600; margin-bottom: 0.25rem;">Phone</h3>
                <p id="contact-phone-info" style="color: var(--text-light);">
                  +1 234 567 8900
                </p>
              </div>
            </div>

            <div style="display: flex; align-items: start;">
              <div style="font-size: 1.5rem; margin-right: 1rem; color: var(--primary-color);">🕐</div>
              <div>
                <h3 style="font-weight: 600; margin-bottom: 0.25rem;">Business Hours</h3>
                <p style="color: var(--text-light);">
                  Monday - Friday: 9:00 AM - 6:00 PM<br>
                  Saturday: 10:00 AM - 4:00 PM<br>
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>

          <!-- Social Media -->
          <div>
            <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--primary-color);">Follow Us</h3>
            <div style="display: flex; gap: 1rem;">
              <a href="#" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; border-radius: 50%; text-decoration: none; font-size: 1.2rem;">f</a>
              <a href="#" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; border-radius: 50%; text-decoration: none; font-size: 1.2rem;">in</a>
              <a href="#" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary-color); color: white; border-radius: 50%; text-decoration: none; font-size: 1.2rem;">t</a>
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div>
          <div class="card">
            <div class="card-content" style="padding: 2rem;">
              <h2 style="font-size: 1.75rem; margin-bottom: 1.5rem; color: var(--primary-color);">Send Us a Message</h2>

              <form id="contact-form">
                <div class="form-group">
                  <label class="form-label">Your Name *</label>
                  <input type="text" id="contact-name" class="form-input" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" id="contact-email" class="form-input" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Company</label>
                  <input type="text" id="contact-company" class="form-input">
                </div>

                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input type="tel" id="contact-phone" class="form-input">
                </div>

                <div class="form-group">
                  <label class="form-label">Country</label>
                  <input type="text" id="contact-country" class="form-input">
                </div>

                <div class="form-group">
                  <label class="form-label">Subject *</label>
                  <select id="contact-subject" class="form-input" required>
                    <option value="">Select a subject...</option>
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Quote Request">Quote Request</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Partnership">Partnership Opportunity</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Message *</label>
                  <textarea id="contact-message" class="form-textarea" required placeholder="Tell us how we can help you..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%;">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const scripts = `
    <script>
      // Handle contact form submission
      document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate email
        const email = document.getElementById('contact-email').value;
        if (!validateEmail(email)) {
          showNotification('Please enter a valid email address', 'error');
          return;
        }

        const formData = {
          name: document.getElementById('contact-name').value,
          email: email,
          company: document.getElementById('contact-company').value,
          phone: document.getElementById('contact-phone').value,
          country: document.getElementById('contact-country').value,
          message: document.getElementById('contact-subject').value + ': ' + document.getElementById('contact-message').value,
        };

        try {
          const submitBtn = e.target.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';

          await API.post('/inquiries', formData);

          showNotification('Thank you for contacting us! We will respond shortly.', 'success');
          document.getElementById('contact-form').reset();

          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        } catch (error) {
          console.error('Error sending message:', error);
          showNotification('Failed to send message. Please try again or contact us directly.', 'error');

          const submitBtn = e.target.querySelector('button[type="submit"]');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      });

      // Load contact information from settings
      async function loadContactInfo() {
        try {
          const response = await API.get('/settings');
          if (response.success) {
            const settings = response.data;

            // Update address
            const addressElem = document.getElementById('contact-address');
            if (addressElem && settings.address) {
              addressElem.innerHTML = settings.address.replace(/\\n/g, '<br>');
            }

            // Update email
            const emailLink = document.getElementById('contact-email-link');
            if (emailLink && settings.email) {
              emailLink.href = \`mailto:\${settings.email}\`;
              emailLink.textContent = settings.email;
            }

            // Update phone
            const phoneInfo = document.getElementById('contact-phone-info');
            if (phoneInfo && settings.phone) {
              phoneInfo.textContent = settings.phone;
            }
          }
        } catch (error) {
          console.error('Error loading contact information:', error);
        }
      }

      // Load contact info on page load
      loadContactInfo();

      // Add responsive styles
      const style = document.createElement('style');
      style.textContent = \`
        @media (max-width: 768px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      \`;
      document.head.appendChild(style);
    </script>
  `;

  const html = createLayout(
    `Contact Us - ${siteName}`,
    content,
    scripts,
    `Get in touch with us - we'd love to hear from you! Contact ${siteName} for inquiries, support, and partnership opportunities.`,
    false
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

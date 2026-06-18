/**
 * Page Router - serves frontend HTML pages
 */

import { homePage } from './home';
import { productsPage } from './products';
import { productDetailPage } from './product-detail';
import { aboutPage } from './about';
import { contactPage } from './contact';
import { adminLoginPage } from './admin-login';
import { adminDashboard } from './admin-dashboard';

export async function handlePageRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Generic redirects resolution
  try {
    const { URLManager } = await import('../seo/url-manager');
    const urlManager = new URLManager(env);
    const redirect = await urlManager.getRedirect(path);
    if (redirect) {
      return new Response('', {
        status: redirect.status_code || 301,
        headers: {
          'Location': redirect.to_url,
        },
      });
    }
  } catch (error) {
    console.error('Error resolving redirect:', error);
  }

  // Serve sitemap
  if (path === '/sitemap.xml') {
    try {
      const { SitemapGenerator } = await import('../seo/sitemap-generator');
      const generator = new SitemapGenerator(env);
      const sitemap = await generator.generateSitemap(request.url);
      return new Response(sitemap, {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      console.error('Error generating sitemap:', error);
      return new Response('Error generating sitemap', { status: 500 });
    }
  }

  // Serve image files
  if (path.startsWith('/images/')) {
    const { handleStaticAssets } = await import('./static');
    return handleStaticAssets(request, 'image/*');
  }

  // Route to pages
  if (path === '/' || path === '/home') {
    return homePage(env);
  }

  if (path === '/products') {
    return productsPage(env);
  }

  if (path.startsWith('/products/')) {
    return productDetailPage(request, env);
  }

  if (path === '/about') {
    return aboutPage(env);
  }

  if (path === '/contact') {
    return contactPage(env);
  }

  if (path === '/admin' || path === '/admin/login') {
    return adminLoginPage(env);
  }

  if (path === '/admin/dashboard') {
    return adminDashboard(env);
  }

  // 404 Not Found
  return new Response('Page not found', { status: 404 });
}

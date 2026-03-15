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

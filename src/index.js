/**
 * Cloudflare Workers main entry point
 * Handles both frontend page serving and backend API
 */

import { handleApiRequest } from './api/router';
import { handlePageRequest } from './pages/router';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    // Handle frontend page requests
    return handlePageRequest(request, env);
  },
};

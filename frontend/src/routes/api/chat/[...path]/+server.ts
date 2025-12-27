import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

/**
 * API Proxy Route for Chat Backend
 * Catch-all route to proxy requests to Render backend
 * Handles: /api/chat/message, /api/chat/:sessionId, etc.
 */
export const GET: RequestHandler = async ({ url, params, request }) => {
  const backendUrl = env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
  // Get the path parameter (everything after /api/chat/)
  const path = params.path || '';
  const query = url.search;
  const fullPath = path ? `/${path}${query}` : query;

  try {
    const response = await fetch(`${backendUrl}/api/chat${fullPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'PROXY_ERROR',
        message: 'Failed to connect to backend',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const POST: RequestHandler = async ({ url, params, request }) => {
  const backendUrl = env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
  // Get the path parameter (everything after /api/chat/)
  const path = params.path || '';
  const fullPath = path ? `/${path}` : '';
  const body = await request.text();

  try {
    const response = await fetch(`${backendUrl}/api/chat${fullPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'PROXY_ERROR',
        message: 'Failed to connect to backend',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};


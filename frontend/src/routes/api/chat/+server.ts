import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

/**
 * API Proxy Route for Chat Backend
 * Proxies requests to Render backend to avoid CORS issues
 */
export const GET: RequestHandler = async ({ url, request }) => {
  const backendUrl = env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
  // Extract path after /api/chat (e.g., /api/chat/sessionId -> /sessionId)
  const match = url.pathname.match(/^\/api\/chat(\/.*)?$/);
  const path = match?.[1] || '';
  const query = url.search;

  try {
    const response = await fetch(`${backendUrl}/api/chat${path}${query}`, {
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

export const POST: RequestHandler = async ({ url, request }) => {
  const backendUrl = env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
  // Extract path after /api/chat (e.g., /api/chat/message -> /message)
  const match = url.pathname.match(/^\/api\/chat(\/.*)?$/);
  const path = match?.[1] || '';
  const body = await request.text();

  try {
    const response = await fetch(`${backendUrl}/api/chat${path}`, {
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


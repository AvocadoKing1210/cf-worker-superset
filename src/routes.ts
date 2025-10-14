import type { Env } from './types';
import { createResponse } from './utils/response';

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    // Use the same headers from createResponse via explicit Response below
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    switch (path) {
      case '/':
        return createResponse({
          message: 'Superset API Worker now is running',
          timestamp: new Date().toISOString(),
          environment: env.NODE_ENV || 'development',
          hasApiKey: !!env.API_KEY,
          supersetUrl: env.SUPERSET_BASE_URL || 'not configured',
          status: env.WORKER_LABEL === 'prod' ? 'production' : 'development',
        });

      case '/health':
        return createResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
        });

      default:
        return createResponse({
          error: 'Not Found',
          message: 'The requested endpoint was not found',
        }, 404);
    }
  } catch (error) {
    console.error('Worker error:', error);
    return createResponse({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }, 500);
  }
}



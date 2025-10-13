/**
 * Cloudflare Worker for SQL execution
 */

interface Env {
  NODE_ENV?: string;
  API_KEY?: string;
  SUPERSET_BASE_URL?: string;
}

interface CorsHeaders {
  [key: string]: string;
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
}

interface ApiResponse {
  message?: string;
  timestamp?: string;
  environment?: string;
  hasApiKey?: boolean;
  supersetUrl?: string;
  status?: string;
  error?: string;
}

const corsHeaders: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const createResponse = (data: ApiResponse, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route handling
      switch (path) {
        case '/':
          return createResponse({
            message: 'Superset API Worker now is running',
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV || 'development',
            hasApiKey: !!env.API_KEY,
            supersetUrl: env.SUPERSET_BASE_URL || 'not configured',
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
  },
};

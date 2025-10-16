import type { Env } from './types';
import { createResponse } from './utils/response';
import { corsHeaders } from './utils/response';
import { authenticateWithSuperset } from './utils/auth';
import { executeSql } from './utils/executeSql';
import { createChart } from './utils/createChart';
import type { ExecuteSqlRequest, ChartCreateRequest } from './types';

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

      case '/execute-sql': {
        if (request.method !== 'POST') {
          return createResponse({ error: 'Method Not Allowed' }, 405);
        }

        // Parse body
        let body: ExecuteSqlRequest;
        try {
          body = await request.json() as ExecuteSqlRequest;
        } catch {
          return createResponse({ error: 'Invalid JSON body' }, 400);
        }
        try {
          const result = await executeSql(env as any, body);
          return new Response(JSON.stringify({
            status: result.status,
            meta: result.meta,
            ...result.result,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      case '/charts/create': {
        if (request.method !== 'POST') {
          return createResponse({ error: 'Method Not Allowed' }, 405);
        }

        let body: ChartCreateRequest;
        try {
          body = await request.json() as ChartCreateRequest;
        } catch {
          return createResponse({ error: 'Invalid JSON body' }, 400);
        }

        // basic shape validation
        const isFromQuery = (body as any).query_id != null;
        const isFromSql = (body as any).database_id != null && typeof (body as any).sql === 'string';
        if (!isFromQuery && !isFromSql) {
          return createResponse({ error: 'Provide either query_id or (database_id and sql)' }, 400);
        }

        try {
          const result = await createChart(env as any, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

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



/**
 * Shared application types
 */

export interface Env {
  NODE_ENV?: string;
  API_KEY?: string;
  SUPERSET_BASE_URL?: string;
  SUPERSET_USERNAME?: string;
  SUPERSET_PASSWORD?: string;
  WORKER_LABEL?: string;
}

export interface CorsHeaders {
  [key: string]: string;
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
}

export interface ApiResponse {
  message?: string;
  timestamp?: string;
  environment?: string;
  hasApiKey?: boolean;
  supersetUrl?: string;
  status?: string;
  error?: string;
}

export interface SupersetCredentials {
  baseUrl: string;
  username: string;
  password: string;
}

export interface SupersetTokens {
  csrfToken: string;
  sessionCookies: string;
  accessToken?: string | undefined;
}

export interface SupersetAuthResult {
  success: boolean;
  tokens?: SupersetTokens;
  error?: string;
}


// Execute SQL endpoint types
export interface ExecuteSqlRequest {
  database_id: number;
  sql: string;
  full?: boolean;
  limit?: number;
}

export interface ExecuteSqlMeta {
  full: boolean;
  effectiveLimit: number | null;
  wasClamped: boolean;
}

// Minimal shape we forward from Superset; keep it open for flexibility
export interface SupersetExecuteResult {
  query_id?: number | string;
  columns?: Array<{ name: string; type?: string }> | any[];
  data?: any;
  [key: string]: any;
}

export interface ExecuteSqlResponse {
  status: 'ok';
  meta: ExecuteSqlMeta;
  result: SupersetExecuteResult;
}



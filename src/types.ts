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

// Chart creation types
export type VizType =
  | 'table'
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'big_number'
  | 'scatter';

export interface ChartCreateFromQueryId {
  query_id: number;
  viz_type: VizType | string;
  slice_name?: string;
  params?: Record<string, unknown>;
}

export interface ChartCreateFromSql {
  database_id: number;
  sql: string;
  viz_type: VizType | string;
  slice_name?: string;
  full?: boolean;
  limit?: number;
  params?: Record<string, unknown>;
}

export type ChartCreateRequest = ChartCreateFromQueryId | ChartCreateFromSql;

export interface ChartCreateResponse {
  status: 'ok';
  datasource: string;
  viz_type: string;
  chart_id?: number;
  explore_url?: string;
  form_data_key?: string;
  permalink_key?: string;
  embed_url?: string;
  meta?: ExecuteSqlMeta;
}



/**
 * Shared application types
 */

export interface Env {
  NODE_ENV?: string;
  API_KEY?: string;
  SUPERSET_BASE_URL?: string;
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



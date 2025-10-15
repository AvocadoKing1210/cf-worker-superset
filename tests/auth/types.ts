/**
 * Authentication utility test types
 */

export interface AuthTestConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
  maxRetries: number;
  retryInterval: number;
}

export interface AuthTestResult {
  success: boolean;
  hasCsrfToken: boolean;
  hasSessionCookies: boolean;
  hasAccessToken: boolean;
  error?: string;
}

export interface AuthTestEnvironment {
  SUPERSET_BASE_URL: string;
  SUPERSET_USERNAME: string;
  SUPERSET_PASSWORD: string;
}

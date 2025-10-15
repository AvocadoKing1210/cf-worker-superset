import type { SupersetCredentials, SupersetTokens, SupersetAuthResult } from '../types';

/**
 * Authentication utility for Superset API
 * Implements session cookie authentication as described in the success guide
 */
export class SupersetAuth {
  private credentials: SupersetCredentials;
  private csrfToken: string | null = null;
  private sessionCookies: string | null = null;
  private accessToken: string | null = null;

  constructor(credentials: SupersetCredentials) {
    this.credentials = credentials;
  }

  /**
   * Authenticate with Superset and retrieve CSRF token and session cookies
   * Based on the session cookie method from the success guide
   */
  async authenticate(): Promise<SupersetAuthResult> {
    try {
      // Step 1: Get login page and session cookies
      const loginPageResponse = await fetch(`${this.credentials.baseUrl}/login/`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Superset-API-Client)',
        },
      });

      if (!loginPageResponse.ok) {
        return {
          success: false,
          error: `Failed to get login page: ${loginPageResponse.status} ${loginPageResponse.statusText}`,
        };
      }

      // Extract session cookies from the response
      const setCookieHeader = loginPageResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        this.sessionCookies = setCookieHeader;
      }

      // Extract CSRF token from HTML
      const loginPageHtml = await loginPageResponse.text();
      const csrfMatch = loginPageHtml.match(/name="csrf_token"[^>]*value="([^"]*)"/);
      if (!csrfMatch) {
        return {
          success: false,
          error: 'Failed to extract CSRF token from login page',
        };
      }

      const initialCsrfToken = csrfMatch[1];

      // Step 2: Login through web interface
      const loginData = new URLSearchParams({
        username: this.credentials.username,
        password: this.credentials.password,
        provider: 'db',
        csrf_token: initialCsrfToken || '',
      });

      const loginResponse = await fetch(`${this.credentials.baseUrl}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; Superset-API-Client)',
          'Referer': `${this.credentials.baseUrl}/login/`,
          'Origin': this.credentials.baseUrl,
          ...(this.sessionCookies && { 'Cookie': this.sessionCookies }),
        },
        body: loginData.toString(),
        redirect: 'manual', // Handle redirects manually
      });

      // Update session cookies from login response
      const loginSetCookieHeader = loginResponse.headers.get('set-cookie');
      if (loginSetCookieHeader) {
        this.sessionCookies = loginSetCookieHeader;
      }

      // Check if login was successful (should redirect to dashboard)
      if (loginResponse.status !== 302 && loginResponse.status !== 200) {
        return {
          success: false,
          error: `Login failed: ${loginResponse.status} ${loginResponse.statusText}`,
        };
      }

      // Step 3: Get CSRF token from API
      const csrfResponse = await fetch(`${this.credentials.baseUrl}/api/v1/security/csrf_token/`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Superset-API-Client)',
          'Accept': 'application/json',
          ...(this.sessionCookies && { 'Cookie': this.sessionCookies }),
        },
      });

      if (!csrfResponse.ok) {
        return {
          success: false,
          error: `Failed to get CSRF token: ${csrfResponse.status} ${csrfResponse.statusText}`,
        };
      }

      const csrfData = await csrfResponse.json() as { result: string };
      this.csrfToken = csrfData.result;

      // Step 4: Get access token for API operations
      const tokenResponse = await fetch(`${this.credentials.baseUrl}/api/v1/security/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Superset-API-Client)',
          'Accept': 'application/json',
          ...(this.sessionCookies && { 'Cookie': this.sessionCookies }),
        },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password,
          provider: 'db',
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json() as { access_token: string };
        this.accessToken = tokenData.access_token;
      }

      return {
        success: true,
        tokens: {
          csrfToken: this.csrfToken!,
          sessionCookies: this.sessionCookies || '',
          accessToken: this.accessToken || undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get current CSRF token
   */
  getCsrfToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Get current session cookies
   */
  getSessionCookies(): string | null {
    return this.sessionCookies;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get all tokens
   */
  getTokens(): SupersetTokens | null {
    if (!this.csrfToken || !this.sessionCookies) {
      return null;
    }

    return {
      csrfToken: this.csrfToken!,
      sessionCookies: this.sessionCookies!,
      accessToken: this.accessToken || undefined,
    };
  }

  /**
   * Check if authentication is valid
   */
  isAuthenticated(): boolean {
    return !!(this.csrfToken && this.sessionCookies);
  }
}

/**
 * Utility function to create authenticated Superset client
 * @param env Environment variables containing Superset credentials
 * @returns Promise<SupersetAuthResult> Authentication result with tokens
 */
export async function authenticateWithSuperset(env: {
  SUPERSET_BASE_URL?: string;
  SUPERSET_USERNAME?: string;
  SUPERSET_PASSWORD?: string;
}): Promise<SupersetAuthResult> {
  // Validate required environment variables
  if (!env.SUPERSET_BASE_URL || !env.SUPERSET_USERNAME || !env.SUPERSET_PASSWORD) {
    return {
      success: false,
      error: 'Missing required Superset credentials. Please check SUPERSET_BASE_URL, SUPERSET_USERNAME, and SUPERSET_PASSWORD environment variables.',
    };
  }

  const credentials: SupersetCredentials = {
    baseUrl: env.SUPERSET_BASE_URL,
    username: env.SUPERSET_USERNAME,
    password: env.SUPERSET_PASSWORD,
  };

  const auth = new SupersetAuth(credentials);
  return await auth.authenticate();
}

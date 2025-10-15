/**
 * Authentication utility test cases
 */

import { TestConfig, TestCase } from '../types';
import { SupersetAuth, authenticateWithSuperset } from '../../src/utils/auth';
import { AuthTestConfig, AuthTestResult, AuthTestEnvironment } from './types';

/**
 * Safely mask tokens for display purposes
 */
function maskToken(token: string, showStart: number = 8, showEnd: number = 4): string {
  if (!token || token.length <= showStart + showEnd) {
    return token;
  }
  const start = token.substring(0, showStart);
  const end = token.substring(token.length - showEnd);
  const middle = '*'.repeat(Math.min(token.length - showStart - showEnd, 20));
  return `${start}${middle}${end}`;
}

/**
 * Test authentication with valid credentials
 */
async function testValidAuthentication(config: TestConfig): Promise<boolean> {
  console.log('Testing authentication with valid credentials...');
  
  // Get credentials from environment variables
  const baseUrl = process.env.SUPERSET_BASE_URL;
  const username = process.env.SUPERSET_USERNAME;
  const password = process.env.SUPERSET_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.log('SKIPPED: Missing Superset credentials in environment variables');
    console.log('Required: SUPERSET_BASE_URL, SUPERSET_USERNAME, SUPERSET_PASSWORD');
    return true; // Skip test rather than fail
  }

  try {
    const authResult = await authenticateWithSuperset({
      SUPERSET_BASE_URL: baseUrl,
      SUPERSET_USERNAME: username,
      SUPERSET_PASSWORD: password,
    });

    if (authResult.success && authResult.tokens) {
      console.log('Authentication successful');
      console.log('CSRF Token:', authResult.tokens.csrfToken ? 'Present' : 'Missing');
      console.log('Session Cookies:', authResult.tokens.sessionCookies ? 'Present' : 'Missing');
      console.log('Access Token:', authResult.tokens.accessToken ? 'Present' : 'Missing');
      
      // Show masked tokens for verification
      console.log('=== TOKENS RETRIEVED (MASKED) ===');
      console.log('CSRF Token:', maskToken(authResult.tokens.csrfToken));
      console.log('Session Cookies:', maskToken(authResult.tokens.sessionCookies, 10, 6));
      console.log('Access Token:', maskToken(authResult.tokens.accessToken, 20, 8));
      console.log('==================================');

      // Validate that we have the required tokens
      const hasRequiredTokens = authResult.tokens.csrfToken && authResult.tokens.sessionCookies;
      
      if (hasRequiredTokens) {
        console.log('All required tokens present');
        return true;
      } else {
        console.log('Missing required tokens');
        return false;
      }
    } else {
      console.log('Authentication failed:', authResult.error);
      return false;
    }
  } catch (error) {
    console.log('Authentication test failed:', (error as Error).message);
    return false;
  }
}

/**
 * Test authentication with invalid credentials
 */
async function testInvalidAuthentication(config: TestConfig): Promise<boolean> {
  console.log('Testing authentication with invalid credentials...');
  
  // Get base URL from environment, but use invalid credentials
  const baseUrl = process.env.SUPERSET_BASE_URL;
  
  if (!baseUrl) {
    console.log('SKIPPED: Missing SUPERSET_BASE_URL environment variable');
    return true; // Skip test rather than fail
  }
  
  try {
    const authResult = await authenticateWithSuperset({
      SUPERSET_BASE_URL: baseUrl,
      SUPERSET_USERNAME: 'invalid_user',
      SUPERSET_PASSWORD: 'invalid_password',
    });

    if (!authResult.success) {
      console.log('Invalid authentication correctly rejected:', authResult.error);
      return true;
    } else {
      console.log('Invalid authentication incorrectly accepted');
      return false;
    }
  } catch (error) {
    console.log('Invalid authentication test failed:', (error as Error).message);
    return false;
  }
}

/**
 * Test authentication with missing credentials
 */
async function testMissingCredentials(config: TestConfig): Promise<boolean> {
  console.log('Testing authentication with missing credentials...');
  
  try {
    const authResult = await authenticateWithSuperset({
      SUPERSET_BASE_URL: '',
      SUPERSET_USERNAME: '',
      SUPERSET_PASSWORD: '',
    });

    if (!authResult.success && authResult.error?.includes('Missing required')) {
      console.log('Missing credentials correctly rejected:', authResult.error);
      return true;
    } else {
      console.log('Missing credentials incorrectly accepted');
      return false;
    }
  } catch (error) {
    console.log('Missing credentials test failed:', (error as Error).message);
    return false;
  }
}

/**
 * Test SupersetAuth class methods
 */
async function testSupersetAuthClass(config: TestConfig): Promise<boolean> {
  console.log('Testing SupersetAuth class methods...');
  
  // Get credentials from environment variables
  const baseUrl = process.env.SUPERSET_BASE_URL;
  const username = process.env.SUPERSET_USERNAME;
  const password = process.env.SUPERSET_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.log('SKIPPED: Missing Superset credentials in environment variables');
    console.log('Required: SUPERSET_BASE_URL, SUPERSET_USERNAME, SUPERSET_PASSWORD');
    return true; // Skip test rather than fail
  }
  
  try {
    const auth = new SupersetAuth({
      baseUrl: baseUrl,
      username: username,
      password: password,
    });

    // Test initial state
    if (auth.isAuthenticated()) {
      console.log('Auth should not be authenticated initially');
      return false;
    }

    if (auth.getCsrfToken() !== null) {
      console.log('CSRF token should be null initially');
      return false;
    }

    if (auth.getSessionCookies() !== null) {
      console.log('Session cookies should be null initially');
      return false;
    }

    if (auth.getAccessToken() !== null) {
      console.log('Access token should be null initially');
      return false;
    }

    if (auth.getTokens() !== null) {
      console.log('Tokens should be null initially');
      return false;
    }

    // Test authentication
    const authResult = await auth.authenticate();
    
    if (authResult.success) {
      console.log('Authentication successful');
      
      // Test post-authentication state
      if (!auth.isAuthenticated()) {
        console.log('Auth should be authenticated after successful login');
        return false;
      }

      if (!auth.getCsrfToken()) {
        console.log('CSRF token should be present after authentication');
        return false;
      }

      if (!auth.getSessionCookies()) {
        console.log('Session cookies should be present after authentication');
        return false;
      }

      const tokens = auth.getTokens();
      if (!tokens || !tokens.csrfToken || !tokens.sessionCookies) {
        console.log('Tokens should be complete after authentication');
        return false;
      }

      console.log('All SupersetAuth class methods working correctly');
      return true;
    } else {
      console.log('Authentication failed:', authResult.error);
      return false;
    }
  } catch (error) {
    console.log('SupersetAuth class test failed:', (error as Error).message);
    return false;
  }
}

/**
 * Test authentication with invalid base URL
 */
async function testInvalidBaseUrl(config: TestConfig): Promise<boolean> {
  console.log('Testing authentication with invalid base URL...');
  
  try {
    const authResult = await authenticateWithSuperset({
      SUPERSET_BASE_URL: 'https://invalid-superset-url.com',
      SUPERSET_USERNAME: 'test_user',
      SUPERSET_PASSWORD: 'test_password',
    });

    if (!authResult.success) {
      console.log('Invalid base URL correctly rejected:', authResult.error);
      return true;
    } else {
      console.log('Invalid base URL incorrectly accepted');
      return false;
    }
  } catch (error) {
    console.log('Invalid base URL test failed:', (error as Error).message);
    return false;
  }
}

/**
 * Test token persistence and retrieval
 */
async function testTokenPersistence(config: TestConfig): Promise<boolean> {
  console.log('Testing token persistence and retrieval...');
  
  // Get credentials from environment variables
  const baseUrl = process.env.SUPERSET_BASE_URL;
  const username = process.env.SUPERSET_USERNAME;
  const password = process.env.SUPERSET_PASSWORD;

  if (!baseUrl || !username || !password) {
    console.log('SKIPPED: Missing Superset credentials in environment variables');
    console.log('Required: SUPERSET_BASE_URL, SUPERSET_USERNAME, SUPERSET_PASSWORD');
    return true; // Skip test rather than fail
  }
  
  try {
    const auth = new SupersetAuth({
      baseUrl: baseUrl,
      username: username,
      password: password,
    });

    const authResult = await auth.authenticate();
    
    if (authResult.success) {
      // Test that tokens persist across multiple calls
      const csrfToken1 = auth.getCsrfToken();
      const sessionCookies1 = auth.getSessionCookies();
      const accessToken1 = auth.getAccessToken();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const csrfToken2 = auth.getCsrfToken();
      const sessionCookies2 = auth.getSessionCookies();
      const accessToken2 = auth.getAccessToken();
      
      if (csrfToken1 === csrfToken2 && 
          sessionCookies1 === sessionCookies2 && 
          accessToken1 === accessToken2) {
        console.log('Token persistence test passed');
        return true;
      } else {
        console.log('Token persistence test failed - tokens changed');
        return false;
      }
    } else {
      console.log('Authentication failed for token persistence test:', authResult.error);
      return false;
    }
  } catch (error) {
    console.log('Token persistence test failed:', (error as Error).message);
    return false;
  }
}

export const authTests: TestCase[] = [
  {
    name: 'Valid Authentication Test',
    run: testValidAuthentication,
  },
  {
    name: 'Invalid Credentials Test',
    run: testInvalidAuthentication,
  },
  {
    name: 'Missing Credentials Test',
    run: testMissingCredentials,
  },
  {
    name: 'SupersetAuth Class Methods Test',
    run: testSupersetAuthClass,
  },
  {
    name: 'Invalid Base URL Test',
    run: testInvalidBaseUrl,
  },
  {
    name: 'Token Persistence Test',
    run: testTokenPersistence,
  },
];

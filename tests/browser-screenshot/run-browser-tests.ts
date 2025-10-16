#!/usr/bin/env tsx

/**
 * Browser Screenshot tests runner
 * Requires Cloudflare credentials for Browser Rendering API
 */

import { browserScreenshotTestSuite } from './index';
import { BrowserTestConfig } from './types';

async function runBrowserScreenshotTests(): Promise<void> {
  console.log('Checking Cloudflare credentials...');

  const hasCredentials = process.env.CLOUDFLARE_ACCOUNT_ID && 
                        process.env.CLOUDFLARE_API_TOKEN &&
                        process.env.WORKER_URL;

  if (!hasCredentials) {
    console.log('WARNING: Missing required credentials');
    console.log('Required environment variables:');
    console.log('  - CLOUDFLARE_ACCOUNT_ID');
    console.log('  - CLOUDFLARE_API_TOKEN');
    console.log('  - WORKER_URL');
    console.log('\nBrowser screenshot tests will be skipped.');
    return;
  }

  console.log('SUCCESS: Cloudflare credentials found');

  const config: BrowserTestConfig = {
    worker_url: process.env.WORKER_URL!,
    cloudflare_account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
    cloudflare_api_token: process.env.CLOUDFLARE_API_TOKEN!,
    timeout: 60,
    retries: 3,
  };

  console.log('\nStarting Browser Screenshot Tests...');
  console.log('='.repeat(60));

  let allPassed = true;

  for (const test of browserScreenshotTestSuite.tests) {
    console.log(`\nTest: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await test.run(config);
      if (result.success) {
        console.log(`PASSED: ${test.name}`);
      } else {
        console.log(`FAILED: ${test.name}`);
        console.log(`   Error: ${result.message}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`ERROR: ${test.name} - ${(error as Error).message}`);
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('FINAL RESULT:', allPassed ? 'ALL BROWSER TESTS PASSED' : 'SOME BROWSER TESTS FAILED');
  console.log('='.repeat(60));

  if (!allPassed) {
    process.exit(1);
  }
}

if (require.main === module) {
  runBrowserScreenshotTests().catch((error) => {
    console.error('Browser test runner failed:', error);
    process.exit(1);
  });
}

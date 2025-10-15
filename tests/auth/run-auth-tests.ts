#!/usr/bin/env tsx

/**
 * Authentication tests runner
 * Uses environment variables (automatically loaded by Wrangler or CI/CD)
 */

import { authTestSuite } from './index';
import { TestConfig } from '../types';

async function runAuthTests(): Promise<void> {
  console.log('Checking environment variables...');
  
  // Check if required Superset credentials are available
  const hasCredentials = process.env.SUPERSET_BASE_URL && 
                        process.env.SUPERSET_USERNAME && 
                        process.env.SUPERSET_PASSWORD;
  
  if (!hasCredentials) {
    console.log('⚠️  Missing Superset credentials');
    console.log('Required environment variables:');
    console.log('  - SUPERSET_BASE_URL');
    console.log('  - SUPERSET_USERNAME');
    console.log('  - SUPERSET_PASSWORD');
    console.log('\nSome tests will be skipped.');
  } else {
    console.log('✅ Superset credentials found');
  }
  
  // Create test configuration
  const config: TestConfig = {
    url: 'http://localhost:8787', // Not used for auth tests, but required by interface
    maxRetries: 3,
    retryInterval: 2,
    timeout: 30000,
  };
  
  console.log('\nRunning Authentication Tests...');
  console.log('='.repeat(50));
  
  let allPassed = true;
  
  for (const test of authTestSuite.tests) {
    console.log(`\nTest: ${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const passed = await test.run(config);
      if (passed) {
        console.log(`✅ PASSED: ${test.name}`);
      } else {
        console.log(`❌ FAILED: ${test.name}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`💥 ERROR: ${test.name} - ${(error as Error).message}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('FINAL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(50));
  
  if (allPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

if (require.main === module) {
  runAuthTests().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

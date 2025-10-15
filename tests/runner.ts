#!/usr/bin/env tsx

/**
 * Universal E2E test runner
 * Iterates through all test suites and executes them
 */

import { TestConfig, TestSuite } from './types';
import { parseArgs } from './utils/http';

// Import all test suites
import { healthTestSuite } from './health';
import { indexTestSuite } from './index';
import { executeSqlTestSuite } from './execute-sql';
import { authTestSuite } from './auth';
import { browserScreenshotTestSuite } from './browser-screenshot';

async function runTestSuite(suite: TestSuite, config: TestConfig): Promise<boolean> {
  console.log(`\nRunning test suite: ${suite.name}`);
  console.log('='.repeat(50));
  
  let suitePassed = true;
  
  for (const test of suite.tests) {
    console.log(`\nTest: ${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const passed = await test.run(config);
      if (passed) {
        console.log(`PASSED: ${test.name}`);
      } else {
        console.log(`FAILED: ${test.name}`);
        suitePassed = false;
      }
    } catch (error) {
      console.log(`ERROR: ${test.name} - ${(error as Error).message}`);
      suitePassed = false;
    }
  }
  
  console.log(`\nTest suite ${suite.name}: ${suitePassed ? 'PASSED' : 'FAILED'}`);
  return suitePassed;
}

async function main(): Promise<void> {
  const config = parseArgs();
  
  console.log('Starting E2E test suite...');
  console.log('Configuration:', JSON.stringify(config, null, 2));
  
  // Define all test suites
  const testSuites: TestSuite[] = [
    healthTestSuite,
    indexTestSuite,
    authTestSuite,
    executeSqlTestSuite,
    browserScreenshotTestSuite,
  ];
  
  let allPassed = true;
  
  for (const suite of testSuites) {
    const passed = await runTestSuite(suite, config);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('FINAL RESULT:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  console.log('='.repeat(50));
  
  if (allPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

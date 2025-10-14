/**
 * Index endpoint test cases
 */

import { TestConfig, TestCase } from '../types';
import { makeRequest } from '../utils/http';
import { IndexTestConfig } from './types';

const indexConfig: IndexTestConfig = {
  endpoint: '/',
  expectedStatus: 200,
  expectedFields: ['message', 'timestamp', 'environment', 'hasApiKey', 'supersetUrl'],
};

async function testRootEndpoint(config: TestConfig): Promise<boolean> {
  const rootUrl = `${config.url}${indexConfig.endpoint}`;
  console.log(`Testing root endpoint: ${rootUrl}`);

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${config.maxRetries}...`);
      
      const result = await makeRequest(rootUrl, config.timeout);
      
      if (result.status === indexConfig.expectedStatus) {
        console.log('Root endpoint check passed');
        console.log('Response:', JSON.stringify(result.data, null, 2));
        
        // Validate response structure
        const hasAllFields = indexConfig.expectedFields.every(field => 
          result.data && typeof result.data[field] !== 'undefined'
        );
        
        if (hasAllFields) {
          console.log('Response structure validation passed');
          return true;
        } else {
          console.log('Response structure validation failed');
          return false;
        }
      } else {
        console.log(`Root endpoint check failed with status: ${result.status}`);
        console.log('Response:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log(`Root endpoint check failed: ${(error as Error).message}`);
    }

    if (attempt < config.maxRetries) {
      console.log(`Waiting ${config.retryInterval}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, config.retryInterval * 1000));
    }
  }

  console.log(`All ${config.maxRetries} attempts failed`);
  return false;
}

export const indexTests: TestCase[] = [
  {
    name: 'Root Endpoint Test',
    run: testRootEndpoint,
  },
];

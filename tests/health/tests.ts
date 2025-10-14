/**
 * Health endpoint test cases
 */

import { TestConfig, TestCase } from '../types';
import { makeRequest } from '../utils/http';
import { HealthTestConfig } from './types';

const healthConfig: HealthTestConfig = {
  endpoint: '/health',
  expectedStatus: 200,
  expectedFields: ['status', 'timestamp'],
};

async function testHealthEndpoint(config: TestConfig): Promise<boolean> {
  const healthUrl = `${config.url}${healthConfig.endpoint}`;
  console.log(`Testing health endpoint: ${healthUrl}`);

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${config.maxRetries}...`);
      
      const result = await makeRequest(healthUrl, config.timeout);
      
      if (result.status === healthConfig.expectedStatus) {
        console.log('Health check passed');
        console.log('Response:', JSON.stringify(result.data, null, 2));
        
        // Validate response structure
        const hasAllFields = healthConfig.expectedFields.every(field => 
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
        console.log(`Health check failed with status: ${result.status}`);
        console.log('Response:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log(`Health check failed: ${(error as Error).message}`);
    }

    if (attempt < config.maxRetries) {
      console.log(`Waiting ${config.retryInterval}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, config.retryInterval * 1000));
    }
  }

  console.log(`All ${config.maxRetries} attempts failed`);
  return false;
}

export const healthTests: TestCase[] = [
  {
    name: 'Health Endpoint Test',
    run: testHealthEndpoint,
  },
];

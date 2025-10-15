/**
 * HTTP utilities for testing
 */

import { TestConfig, TestResult } from '../types';
import https from 'https';
import http from 'http';

export function makeRequest(url: string, timeout: number): Promise<TestResult> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.get(url, { timeout: timeout * 1000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode || 0, data: json });
        } catch (e) {
          resolve({ status: res.statusCode || 0, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}s`));
    });
  });
}

export function postJson(url: string, body: any, timeout: number): Promise<TestResult> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const payload = Buffer.from(JSON.stringify(body));

    const req = client.request(url, {
      method: 'POST',
      timeout: timeout * 1000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode || 0, data: json });
        } catch (e) {
          resolve({ status: res.statusCode || 0, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}s`));
    });

    req.write(payload);
    req.end();
  });
}

export function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    url: '',
    maxRetries: 3,
    retryInterval: 15,
    timeout: 30,
  };

  console.log('Raw arguments:', args);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const [key, value] = arg.includes('=') 
        ? arg.replace('--', '').split('=', 2)
        : [arg.replace('--', ''), args[i + 1]];
      
      console.log(`Parsing: ${key} = ${value}`);
      
      if (key === 'url' && value) config.url = value;
      if (key === 'max-retries' && value) config.maxRetries = parseInt(value, 10);
      if (key === 'retry-interval' && value) config.retryInterval = parseInt(value, 10);
      if (key === 'timeout' && value) config.timeout = parseInt(value, 10);
      
      // Skip the next argument if we used it as a value
      if (!arg.includes('=') && value) i++;
    }
  }

  console.log('Final config:', config);
  
  // Ensure URL is provided
  if (!config.url) {
    console.error('ERROR: URL is required. Use --url=https://your-worker.dev');
    process.exit(1);
  }
  
  return config;
}

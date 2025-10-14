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

export function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const config: TestConfig = {
    url: 'http://localhost:8787',
    maxRetries: 3,
    retryInterval: 15,
    timeout: 30,
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key === 'url') config.url = value;
    if (key === 'max-retries') config.maxRetries = parseInt(value, 10);
    if (key === 'retry-interval') config.retryInterval = parseInt(value, 10);
    if (key === 'timeout') config.timeout = parseInt(value, 10);
  }

  return config;
}

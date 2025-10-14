/**
 * Health endpoint test types
 */

export interface HealthTestResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}

export interface HealthTestConfig {
  endpoint: string;
  expectedStatus: number;
  expectedFields: string[];
}

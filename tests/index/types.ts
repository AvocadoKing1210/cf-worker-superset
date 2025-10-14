/**
 * Index endpoint test types
 */

export interface IndexTestResult {
  message: string;
  timestamp: string;
  environment: string;
  hasApiKey: boolean;
  supersetUrl: string;
  status?: string;
}

export interface IndexTestConfig {
  endpoint: string;
  expectedStatus: number;
  expectedFields: string[];
}

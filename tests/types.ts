/**
 * Shared test types and interfaces
 */

export interface TestConfig {
  url: string;
  maxRetries: number;
  retryInterval: number;
  timeout: number;
}

export interface TestResult {
  status: number;
  data: any;
}

export interface TestCase {
  name: string;
  run: (config: TestConfig) => Promise<boolean>;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
}

/**
 * Execute SQL endpoint test suite
 */

import { TestSuite } from '../types';
import { executeSqlTests } from './tests';

export const executeSqlTestSuite: TestSuite = {
  name: 'Execute SQL Endpoint',
  tests: executeSqlTests,
};



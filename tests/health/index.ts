/**
 * Health endpoint test suite
 */

import { TestSuite } from '../types';
import { healthTests } from './tests';

export const healthTestSuite: TestSuite = {
  name: 'Health Endpoint',
  tests: healthTests,
};

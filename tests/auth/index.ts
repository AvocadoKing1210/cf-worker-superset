/**
 * Authentication utility test suite
 */

import { TestSuite } from '../types';
import { authTests } from './tests';

export const authTestSuite: TestSuite = {
  name: 'Authentication Utility',
  tests: authTests,
};

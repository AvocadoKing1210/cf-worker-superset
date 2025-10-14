/**
 * Index endpoint test suite
 */

import { TestSuite } from '../types';
import { indexTests } from './tests';

export const indexTestSuite: TestSuite = {
  name: 'Index Endpoint',
  tests: indexTests,
};

import { createE2ETestConfig } from '../../testing/test-setup-config/src/index.js';

export default createE2ETestConfig('zod2nx-schema-e2e', {
  testTimeout: 20_000,
});

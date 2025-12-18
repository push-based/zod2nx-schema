#!/usr/bin/env node
import { runCli } from '../lib/cli/cli.js';
import { logger } from '../lib/utils/logger.js';

runCli().catch(error => {
  logger.error(error.message);
  process.exit(1);
});

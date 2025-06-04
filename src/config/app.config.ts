export const appConfig = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://market-data-service-dev.techchain.solutions',
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
  },
  test: {
    parallelRequests: parseInt(process.env.TEST_PARALLEL_REQUESTS || '5'),
    retryCount: parseInt(process.env.TEST_RETRY_COUNT || '3'),
    retryDelay: parseInt(process.env.TEST_RETRY_DELAY || '1000'),
  },
  performance: {
    targetMs: parseInt(process.env.PERFORMANCE_TARGET_MS || '5000'),
    warningMs: parseInt(process.env.PERFORMANCE_WARNING_MS || '2000'),
  },
  reporting: {
    outputDir: process.env.REPORT_OUTPUT_DIR || './reports',
    formats: (process.env.REPORT_FORMAT || 'json,html').split(','),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}; 
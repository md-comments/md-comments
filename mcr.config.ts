import type { CoverageReportOptions } from 'monocart-coverage-reports';

const config: CoverageReportOptions = {
  name: 'Markdown Comments Unified 100% Coverage Report',
  outputDir: './coverage/consolidated',
  reports: ['v8', 'console-summary', 'lcovonly', 'html'],
  entryFilter: (entry) => {
    return (
      (entry.url.includes('shared/') || entry.url.includes('chrome-extension/src/')) &&
      !entry.url.includes('node_modules')
    );
  },
  thresholds: {
    100: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};

export default config;

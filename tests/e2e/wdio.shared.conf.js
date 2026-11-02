import fs from 'node:fs';
import path from 'node:path';
import ProgressReporter from './reporter.js';

export const APP_ID = 'org.exarhteam.iitcprime.debug';

const ARTIFACTS = path.resolve(import.meta.dirname, 'artifacts');

const saveScreenshot = async test => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const name = `${test.parent} - ${test.title}`.replace(/[^\w -]+/g, '');
  await driver.switchAppiumContext('NATIVE_APP');
  await driver.saveScreenshot(path.join(ARTIFACTS, `${name}.png`));
};

export const config = {
  runner: 'local',
  specs: ['./specs/**/*.e2e.js'],
  maxInstances: 1,
  framework: 'mocha',
  mochaOpts: { timeout: 60000 },
  reporters: [ProgressReporter, ['spec', { showPreface: false, onlyFailures: true }]],
  logLevel: 'warn',
  waitforTimeout: 20000,
  afterTest: async (test, context, { passed }) => {
    if (!passed) await saveScreenshot(test);
  },
  afterHook: async (test, context, { error }) => {
    if (error) await saveScreenshot(test);
  },
};

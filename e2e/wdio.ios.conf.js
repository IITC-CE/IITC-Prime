import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { APP_ID, config as shared } from './wdio.shared.conf.js';

// Applies to the WebDriverAgent build that Appium runs with xcodebuild
process.env.XCODE_XCCONFIG_FILE = path.resolve(import.meta.dirname, 'wda.xcconfig');

// Tests run on the booted simulator unless IOS_UDID is set
const bootedSimulator = () => {
  const { devices } = JSON.parse(
    execFileSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], { encoding: 'utf8' })
  );
  const udid = Object.values(devices).flat()[0]?.udid;
  if (!udid) throw new Error('Boot an iOS simulator or set IOS_UDID');
  return udid;
};

export const config = {
  ...shared,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:udid': process.env.IOS_UDID || bootedSimulator(),
      'appium:app':
        process.env.APP ||
        path.resolve(
          import.meta.dirname,
          '../platforms/ios/build/Debug-iphonesimulator/IITCPrime.app'
        ),
      'appium:bundleId': APP_ID,
      'appium:enforceAppInstall': true,
      'appium:newCommandTimeout': 300,
    },
  ],
  services: ['appium'],
};

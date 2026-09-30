import path from 'node:path';
import { APP_ID, config as shared } from './wdio.shared.conf.js';

export const config = {
  ...shared,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app':
        process.env.APP ||
        path.resolve(
          import.meta.dirname,
          '../platforms/android/app/build/outputs/apk/debug/app-debug.apk'
        ),
      'appium:appPackage': APP_ID,
      // Every debug build has the same version code; install the given APK anyway
      'appium:enforceAppInstall': true,
      // A loaded emulator can exceed the default 20 s app and 30 s server start
      'appium:adbExecTimeout': 60000,
      'appium:uiautomator2ServerLaunchTimeout': 90000,
      // Listing webviews queries every devtools socket on the device, and sockets of frozen
      // background apps answer only after a 2 s timeout, on each context switch
      'appium:ensureWebviewsHavePages': false,
      'appium:enableWebviewDetailsCollection': false,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 300,
    },
  ],
  services: [
    [
      'appium',
      {
        // Chromedriver must match the emulator's WebView version
        args: { allowInsecure: 'uiautomator2:chromedriver_autodownload' },
      },
    ],
  ],
};

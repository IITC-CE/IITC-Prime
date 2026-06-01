import { NativeScriptConfig } from '@nativescript/core';

const baseId = 'org.exarhteam.iitcprime';
const buildType = process.env.BUILD_TYPE || 'debug';
// APP_ID_SUFFIX, when set (even to ''), fully replaces the auto-derived build-type postfix.
// Unset -> derive postfix from BUILD_TYPE (.beta, .debug; empty for release).
// Set to '' -> no postfix (useful for Google Play beta track: same App ID as release).
// Set to 'fdroid' -> .fdroid postfix.
const appIdSuffix = process.env.APP_ID_SUFFIX;

function generateAppId(): string {
  let suffix = '';

  if (appIdSuffix !== undefined) {
    suffix = appIdSuffix;
  } else if (buildType !== 'release') {
    suffix = buildType;
  }

  // Combine base ID with suffix if not empty
  return suffix ? `${baseId}.${suffix}` : baseId;
}

export default {
  id: generateAppId(),
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    discardUncaughtJsExceptions: true,
  },
  ios: {
    deploymentTarget: '13.0',
  },
} as NativeScriptConfig;

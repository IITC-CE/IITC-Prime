import { NativeScriptConfig } from '@nativescript/core';

const baseId = 'org.exarhteam.iitcprime';
const buildType = process.env.BUILD_TYPE || 'debug';
const appIdSuffix = process.env.APP_ID_SUFFIX || '';

function generateAppId(): string {
  let suffix = '';
  
  // Add custom suffix if provided (e.g., 'gplay')
  if (appIdSuffix) {
    suffix += appIdSuffix;
  }
  
  // Add build type postfix (except for release)
  if (buildType !== 'release') {
    suffix += buildType;
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
    markingMode: 'none'
  },
  ios: {
    deploymentTarget: '13.0'
  }
} as NativeScriptConfig;

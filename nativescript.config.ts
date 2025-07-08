import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.exarhteam.iitcprime',
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

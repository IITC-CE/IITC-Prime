import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.exarhteam.iitc_prime',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;

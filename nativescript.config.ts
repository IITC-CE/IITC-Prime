import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.exarhteam.iitcprime',
  appPath: 'app',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;

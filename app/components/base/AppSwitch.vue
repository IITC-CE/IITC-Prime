// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <MDSwitch @loaded="onLoaded" />
</template>

<script>
import { isIOS } from '@nativescript/core';

export default {
  name: 'AppSwitch',

  methods: {
    // UISwitch takes its track colors from the system appearance, while the app is always dark:
    // in light mode the off track of the iOS 26+ switch blends into the dark rows.
    onLoaded({ object }) {
      if (isIOS) {
        object.ios.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
      }
    },
  },
};
</script>

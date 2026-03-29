// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase title="About">
    <StackLayout class="about-container">
      <Label class="app-name" :text="appName" />
      <Label class="app-version" :text="appVersion" />

      <Label
        class="app-description"
        textWrap="true"
        text="IITC Prime is&#160;a&#160;mobile client for&#160;Ingress Intel Total Conversion that provides an&#160;enhanced interface for&#160;the&#160;Ingress Intel Map."
      />
    </StackLayout>

    <SettingsItem
      type="link"
      title="IITC-CE Website"
      description="iitc.app"
      url="https://iitc.app"
      :isFirst="true"
    />
    <SettingsItem
      type="link"
      title="IITC-CE on GitHub"
      description="github.com/IITC-CE/ingress-intel-total-conversion"
      url="https://github.com/IITC-CE/ingress-intel-total-conversion"
    />
    <SettingsItem
      type="link"
      title="IITC Prime on GitHub"
      description="github.com/IITC-CE/IITC-Prime"
      url="https://github.com/IITC-CE/IITC-Prime"
      :isLast="true"
    />
  </SettingsBase>
</template>

<script>
import { markRaw } from 'vue';
import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import SettingsItem from './components/SettingsItem';
import * as appVersion from '@nativescript/appversion';
import { getAppName } from '~/utils/platform';

export default {
  name: 'AboutView',

  components: {
    SettingsBase: markRaw(SettingsBase),
    SettingsSection: markRaw(SettingsSection),
    SettingsItem: markRaw(SettingsItem),
  },

  data() {
    return {
      appName: getAppName(),
      appVersion: 'Loading...',
    };
  },

  created() {
    // Get app version
    this.loadAppVersion();
  },

  methods: {
    loadAppVersion() {
      try {
        this.appVersion = 'v' + appVersion.getVersionNameSync();
      } catch (error) {
        console.error('Error loading app version:', error);
        this.appVersion = 'Unknown';
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.about-container {
  padding: $spacing-l;
  text-align: center;
}

.app-name {
  font-size: $font-size-display;
  font-weight: 900;
  color: $on-surface;
  margin-bottom: $spacing-s;
  horizontal-alignment: center;
}

.app-version {
  font-size: $font-size;
  color: $on-primary;
  background-color: $primary-light;
  border-radius: $radius-large;
  padding: $spacing-s $spacing-m;
  margin-bottom: $spacing-l;
  horizontal-alignment: center;
}

.app-description {
  font-size: $font-size;
  color: $on-surface;
  text-align: center;
  margin-bottom: $spacing-xs;
}
</style>

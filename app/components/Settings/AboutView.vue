// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase :title="$L('about.title')">
    <StackLayout class="about-container">
      <Label class="app-name" :text="appName" />
      <Label class="app-version" :text="appVersion" />
      <Label class="app-description" textWrap="true" :text="$L('about.description')" />
    </StackLayout>

    <SettingsItem
      type="link"
      :title="$L('about.iitc_website.title')"
      :description="$L('about.iitc_website.url')"
      url="https://iitc.app"
      :isFirst="true"
    />
    <SettingsItem
      type="link"
      :title="$L('about.iitc_github.title')"
      :description="$L('about.iitc_github.url')"
      url="https://github.com/IITC-CE/ingress-intel-total-conversion"
    />
    <SettingsItem
      type="link"
      :title="$L('about.prime_github.title')"
      :description="$L('about.prime_github.url')"
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
      appVersion: this.$L('common.loading'),
    };
  },

  created() {
    // Get app version
    this.loadAppVersion();
  },

  methods: {
    loadAppVersion() {
      try {
        let version = 'v' + appVersion.getVersionNameSync();
        if (!__IS_RELEASE_BUILD__ && __GIT_COMMIT_HASH__) {
          version += ` (${__GIT_COMMIT_HASH__})`;
        }
        this.appVersion = version;
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

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="About IITC Prime">
    <StackLayout class="about-container">
      <Label class="app-name" text="IITC Prime" />
      <Label class="app-version" :text="'Version: ' + appVersion" />

      <Label class="app-description" textWrap="true">
        IITC Prime is a mobile client for Ingress Intel Total Conversion that provides an enhanced interface for the Ingress Intel Map.
      </Label>
    </StackLayout>
  </SettingsBase>
</template>

<script>
import SettingsBase from './SettingsBase';
import * as appVersion from '@nativescript/appversion';

export default {
  name: 'AboutView',

  components: {
    SettingsBase
  },

  data() {
    return {
      appVersion: 'Loading...'
    };
  },

  created() {
    // Get app version
    this.loadAppVersion();
  },

  methods: {
    loadAppVersion() {
      try {
        this.appVersion = appVersion.getVersionNameSync();
      } catch (error) {
        console.error('Error loading app version:', error);
        this.appVersion = 'Unknown';
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.about-container {
  padding: 24;
  text-align: center;
}

.app-logo {
  height: 100;
  margin-bottom: 24;
}

.app-name {
  font-size: 24;
  font-weight: bold;
  color: $on-surface;
  margin-bottom: 8;
}

.app-version {
  font-size: 16;
  color: $surface-variant;
  margin-bottom: 24;
}

.app-description {
  font-size: 14;
  color: $on-surface;
  text-align: center;
  margin-bottom: 24;
}
</style>

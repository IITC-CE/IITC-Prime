// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase title="Settings">
    <!-- Plugins section -->
    <SettingsSection title="IITC Management" />
    <SettingsItem
      type="nav"
      title="Plugins"
      :description="pluginsDescription"
      :targetScreen="pluginsScreen"
      :isFirst="true"
    />

    <SettingsItem
      type="nav"
      title="Update Channel"
      :description="updateChannelDescription"
      :targetScreen="updateChannelScreen"
      :isLast="true"
    />

    <!-- Map settings section -->
    <SettingsSection title="Map Settings" />
    <SettingsItem
      type="switch"
      title="Display user location on map"
      description="Show position marker and track location"
      :value="showLocation"
      @change="updateShowLocation"
      :isFirst="true"
    />

    <SettingsItem
      type="switch"
      title="Persistent zoom level"
      description="Don't change zoom level when locate button is pressed"
      :value="persistentZoom"
      @change="updatePersistentZoom"
      :isLast="true"
    />

    <!-- UI settings section -->
    <SettingsSection title="Interface" />
    <SettingsItem
      type="switch"
      title="Desktop Mode"
      description="Force desktop view in WebView"
      :value="desktopMode"
      @change="updateDesktopMode"
      :isFirst="true"
    />

    <SettingsItem
      type="switch"
      title="Fake User Agent"
      description="Appear as a desktop browser"
      :value="fakeUserAgent"
      @change="updateFakeUserAgent"
      :isLast="true"
    />

    <!-- Data Management section -->
    <SettingsSection title="Data management" />
    <SettingsItem
      type="action"
      title="Clear cookies"
      description="Remove all stored cookies and session data"
      @action="clearCookies"
      :isFirst="true"
      :isLast="true"
    />

    <!-- About section -->
    <SettingsSection title="Information" />
    <SettingsItem
      type="nav"
      title="About"
      description="Version and app information"
      :targetScreen="aboutScreen"
      :isFirst="true"
    />

    <SettingsItem
      type="nav"
      title="Open Source Licenses"
      description="View licenses of used libraries"
      :targetScreen="licensesScreen"
      :isLast="true"
    />
  </SettingsBase>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { markRaw } from 'vue';

import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import SettingsItem from './components/SettingsItem';
import PluginsView from './PluginsView';
import UpdateChannelView from './UpdateChannelView';
import AboutView from './AboutView';
import LicensesView from './LicensesView';
import { clearWebViewCookies } from '~/utils/webview/cookie-manager';
import { confirm, alert } from '~/utils/dialogs';

export default {
  name: 'SettingsView',

  components: {
    SettingsBase: markRaw(SettingsBase),
    SettingsSection: markRaw(SettingsSection),
    SettingsItem: markRaw(SettingsItem),
  },

  data() {
    return {
      pluginsScreen: PluginsView,
      updateChannelScreen: UpdateChannelView,
      aboutScreen: AboutView,
      licensesScreen: LicensesView,
    };
  },

  computed: {
    ...mapGetters('settings', [
      'isDesktopMode',
      'isFakeUserAgent',
      'isPersistentZoom',
      'isShowLocation',
    ]),
    ...mapGetters('manager', ['currentChannel', 'enabledPlugins']),

    desktopMode() {
      return this.isDesktopMode;
    },

    fakeUserAgent() {
      return this.isFakeUserAgent;
    },

    persistentZoom() {
      return this.isPersistentZoom;
    },

    showLocation() {
      return this.isShowLocation;
    },

    pluginsDescription() {
      const count = Object.keys(this.enabledPlugins).length;
      return `${count} plugins enabled`;
    },

    updateChannelDescription() {
      return `Current: ${this.currentChannel}`;
    },
  },

  methods: {
    ...mapActions('settings', ['setSetting']),
    ...mapActions('manager', ['loadUpdateChannel', 'loadPlugins']),

    async updateDesktopMode(value) {
      await this.setSetting({ key: 'desktopMode', value });
    },

    async updateFakeUserAgent(value) {
      await this.setSetting({ key: 'fakeUserAgent', value });
    },

    async updatePersistentZoom(value) {
      await this.setSetting({ key: 'persistentZoom', value });
    },

    async updateShowLocation(value) {
      await this.setSetting({ key: 'showLocation', value });
    },

    async loadChannelInfo() {
      await this.loadUpdateChannel();
    },

    async loadPluginsInfo() {
      await this.loadPlugins();
    },

    async clearCookies() {
      const confirmed = await confirm({
        title: 'Clear cookies',
        message:
          'This will clear all cookies and session data. You will need to log in again. Continue?',
        okButtonText: 'Clear',
        cancelButtonText: 'Cancel',
      });

      if (!confirmed) {
        return;
      }

      const success = await clearWebViewCookies();

      if (success) {
        await this.$store.dispatch('ui/reloadWebView');
        this.$navigateBack();
      } else {
        await alert({
          title: 'Error',
          message: 'Failed to clear cookies. Please try again.',
          okButtonText: 'OK',
        });
      }
    },
  },

  async mounted() {
    await this.loadChannelInfo();
    await this.loadPluginsInfo();
  },
};
</script>

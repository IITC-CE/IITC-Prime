// Copyright (C) 2021-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase :title="$L('settings.title')">
    <!-- Plugins section -->
    <SettingsSection :title="$L('settings.section.iitc_management')" />
    <SettingsItem
      type="nav"
      :title="$L('settings.plugins.title')"
      :description="pluginsDescription"
      :targetScreen="pluginsScreen"
      :isFirst="true"
    />

    <SettingsItem
      type="nav"
      :title="$L('settings.update_channel.title')"
      :description="updateChannelDescription"
      :targetScreen="updateChannelScreen"
      :isLast="true"
    />

    <!-- Map settings section -->
    <SettingsSection :title="$L('settings.section.map')" />
    <SettingsItem
      type="switch"
      :title="$L('settings.location.title')"
      :description="$L('settings.location.description')"
      :value="showLocation"
      @change="updateShowLocation"
      :isFirst="true"
    />

    <SettingsItem
      type="switch"
      :title="$L('settings.persistent_zoom.title')"
      :description="$L('settings.persistent_zoom.description')"
      :value="persistentZoom"
      @change="updatePersistentZoom"
      :isLast="true"
    />

    <!-- UI settings section -->
    <SettingsSection :title="$L('settings.section.interface')" />
    <SettingsItem
      type="switch"
      :title="$L('settings.desktop_mode.title')"
      :description="$L('settings.desktop_mode.description')"
      :value="desktopMode"
      @change="updateDesktopMode"
      :isFirst="true"
    />

    <SettingsItem
      type="switch"
      :title="$L('settings.zoom_controls.title')"
      :description="$L('settings.zoom_controls.description')"
      :value="zoomControl"
      @change="updateZoomControl"
    />

    <SettingsItem
      type="switch"
      :title="$L('settings.fake_ua.title')"
      :description="$L('settings.fake_ua.description')"
      :value="fakeUserAgent"
      @change="updateFakeUserAgent"
      :isLast="true"
    />

    <!-- Data Management section -->
    <SettingsSection :title="$L('settings.section.data')" />
    <SettingsItem
      type="nav"
      :title="$L('settings.backup.title')"
      :description="$L('settings.backup.description')"
      :targetScreen="backupScreen"
      :isFirst="true"
    />

    <SettingsItem
      type="action"
      :title="$L('settings.clear_cookies.title')"
      :description="$L('settings.clear_cookies.description')"
      @action="clearCookies"
      :isLast="true"
    />

    <!-- About section -->
    <SettingsSection :title="$L('settings.section.information')" />
    <SettingsItem
      type="nav"
      :title="$L('settings.about.title')"
      :description="$L('settings.about.description')"
      :targetScreen="aboutScreen"
      :isFirst="true"
    />

    <SettingsItem
      type="nav"
      :title="$L('settings.licenses.title')"
      :description="$L('settings.licenses.description')"
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
import BackupView from './BackupView';
import { clearWebViewCookies } from '~/utils/webview/cookie-manager';
import { confirm, alert } from '~/utils/dialogs';
import { goBack } from '~/utils/platform/navigation';

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
      backupScreen: BackupView,
    };
  },

  computed: {
    ...mapGetters('settings', [
      'isDesktopMode',
      'isZoomControl',
      'isFakeUserAgent',
      'isPersistentZoom',
      'isShowLocation',
    ]),
    ...mapGetters('manager', ['currentChannel', 'enabledPlugins']),

    desktopMode() {
      return this.isDesktopMode;
    },

    zoomControl() {
      return this.isZoomControl;
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
      return this.$L('settings.plugins.description', count);
    },

    updateChannelDescription() {
      return this.$L('settings.update_channel.description', this.currentChannel);
    },
  },

  methods: {
    ...mapActions('settings', ['setSetting']),
    ...mapActions('manager', ['loadUpdateChannel', 'loadPlugins']),

    async updateDesktopMode(value) {
      await this.setSetting({ key: 'desktopMode', value });
    },

    async updateZoomControl(value) {
      await this.setSetting({ key: 'zoomControl', value });
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
        title: this.$L('settings.clear_cookies.title'),
        message: this.$L('settings.clear_cookies.dialog.message'),
        okButtonText: this.$L('settings.clear_cookies.dialog.ok'),
        cancelButtonText: this.$L('dialog.cancel'),
      });

      if (!confirmed) {
        return;
      }

      const success = await clearWebViewCookies();

      if (success) {
        await this.$store.dispatch('ui/reloadWebView');
        goBack();
      } else {
        await alert({
          title: this.$L('dialog.error.title'),
          message: this.$L('settings.clear_cookies.error'),
          okButtonText: this.$L('dialog.ok'),
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

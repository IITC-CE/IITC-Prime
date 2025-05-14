//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="Settings">
    <!-- Plugins section -->
    <SettingsSection title="IITC Management">
      <SettingsNavItem
        title="Plugins"
        :description="pluginsDescription"
        :targetScreen="pluginsScreen"
      />

      <SettingsNavItem
        title="Update Channel"
        :description="updateChannelDescription"
        :targetScreen="updateChannelScreen"
      />
    </SettingsSection>

    <!-- Map settings section -->
    <SettingsSection title="Map Settings">
      <SettingsNavItem
        title="Location Settings"
        description="Configure GPS accuracy and tracking"
        :targetScreen="locationSettingsScreen"
      />

      <SettingsSwitch
        title="Persistent Zoom Level"
        description="Remember zoom level between sessions"
        :value="persistentZoom"
        @change="updatePersistentZoom"
      />
    </SettingsSection>

    <!-- UI settings section -->
    <SettingsSection title="Interface">
      <SettingsSwitch
        title="Desktop Mode"
        description="Force desktop view in WebView"
        :value="desktopMode"
        @change="updateDesktopMode"
      />

      <SettingsSwitch
        title="Fake User Agent"
        description="Hide app identity from websites"
        :value="fakeUserAgent"
        @change="updateFakeUserAgent"
      />
    </SettingsSection>

    <!-- About section -->
    <SettingsSection title="Information">
      <SettingsNavItem
        title="About IITC Prime"
        description="Version and app information"
        :targetScreen="aboutScreen"
      />
    </SettingsSection>
  </SettingsBase>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import SettingsNavItem from './components/SettingsNavItem';
import SettingsSwitch from './components/SettingsSwitch';

import PluginsView from './PluginsView';
import UpdateChannelView from './UpdateChannelView';
import LocationSettingsView from './LocationSettingsView';
import AboutView from './AboutView';

export default {
  name: 'SettingsView',

  components: {
    SettingsBase,
    SettingsSection,
    SettingsNavItem,
    SettingsSwitch
  },

  data() {
    return {
      pluginsScreen: PluginsView,
      updateChannelScreen: UpdateChannelView,
      locationSettingsScreen: LocationSettingsView,
      aboutScreen: AboutView,
      currentUpdateChannel: 'release',
      enabledPluginsCount: 0
    };
  },

  computed: {
    ...mapGetters('settings', [
      'isDesktopMode',
      'isFakeUserAgent',
      'isPersistentZoom'
    ]),

    desktopMode() {
      return this.isDesktopMode;
    },

    fakeUserAgent() {
      return this.isFakeUserAgent;
    },

    persistentZoom() {
      return this.isPersistentZoom;
    },

    pluginsDescription() {
      return `${this.enabledPluginsCount} plugins enabled`;
    },

    updateChannelDescription() {
      return `Current: ${this.currentUpdateChannel}`;
    }
  },

  methods: {
    ...mapActions('settings', ['setSetting']),
    ...mapActions('manager', ['getUpdateChannel', 'getEnabledPlugins']),

    async updateDesktopMode(value) {
      await this.setSetting({ key: 'desktopMode', value });
    },

    async updateFakeUserAgent(value) {
      await this.setSetting({ key: 'fakeUserAgent', value });
    },

    async updatePersistentZoom(value) {
      await this.setSetting({ key: 'persistentZoom', value });
    },

    async loadChannelInfo() {
      this.currentUpdateChannel = await this.getUpdateChannel();
    },

    async loadPluginsInfo() {
      const enabledPlugins = await this.getEnabledPlugins();
      this.enabledPluginsCount = Object.keys(enabledPlugins).length;
    }
  },

  async mounted() {
    await this.loadChannelInfo();
    await this.loadPluginsInfo();
  }
};
</script>

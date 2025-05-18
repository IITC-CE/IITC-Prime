//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="Settings">
    <!-- Plugins section -->
    <SectionHeader title="IITC Management" once="true" />
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

    <!-- Map settings section -->
    <SectionHeader title="Map Settings" once="true" />
    <SettingsSwitch
      title="Display user location on map"
      description="Show position marker and track location"
      :value="showLocation"
      @change="updateShowLocation"
    />

    <SettingsSwitch
      title="Persistent zoom level"
      description="Don't change zoom level when locate button is pressed"
      :value="persistentZoom"
      @change="updatePersistentZoom"
    />

    <!-- UI settings section -->
    <SectionHeader title="Interface" once="true" />
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

    <!-- About section -->
    <SectionHeader title="Information" once="true" />
    <SettingsNavItem
      title="About IITC Prime"
      description="Version and app information"
      :targetScreen="aboutScreen"
    />
  </SettingsBase>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SettingsBase from './SettingsBase';
import SectionHeader from './components/SectionHeader';
import SettingsNavItem from './components/SettingsNavItem';
import SettingsSwitch from './components/SettingsSwitch';

import PluginsView from './PluginsView';
import UpdateChannelView from './UpdateChannelView';
import AboutView from './AboutView';

export default {
  name: 'SettingsView',

  components: {
    SettingsBase,
    SectionHeader,
    SettingsNavItem,
    SettingsSwitch
  },

  data() {
    return {
      pluginsScreen: PluginsView,
      updateChannelScreen: UpdateChannelView,
      aboutScreen: AboutView,
      currentUpdateChannel: 'release',
      enabledPluginsCount: 0
    };
  },

  computed: {
    ...mapGetters('settings', [
      'isDesktopMode',
      'isFakeUserAgent',
      'isPersistentZoom',
      'isShowLocation'
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

    showLocation() {
      return this.isShowLocation;
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

    async updateShowLocation(value) {
      await this.setSetting({ key: 'showLocation', value });
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

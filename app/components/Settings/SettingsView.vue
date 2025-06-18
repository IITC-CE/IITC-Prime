//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="Settings">
    <!-- Plugins section -->
    <SettingsSection title="IITC Management" />
    <SettingsItem
      type="nav"
      title="Plugins"
      :description="pluginsDescription"
      :targetScreen="pluginsScreen"
    />

    <SettingsItem
      type="nav"
      title="Update Channel"
      :description="updateChannelDescription"
      :targetScreen="updateChannelScreen"
    />

    <!-- Map settings section -->
    <SettingsSection title="Map Settings" />
    <SettingsItem
      type="switch"
      title="Display user location on map"
      description="Show position marker and track location"
      :value="showLocation"
      @change="updateShowLocation"
    />

    <SettingsItem
      type="switch"
      title="Persistent zoom level"
      description="Don't change zoom level when locate button is pressed"
      :value="persistentZoom"
      @change="updatePersistentZoom"
    />

    <!-- UI settings section -->
    <SettingsSection title="Interface" />
    <SettingsItem
      type="switch"
      title="Desktop Mode"
      description="Force desktop view in WebView"
      :value="desktopMode"
      @change="updateDesktopMode"
    />

    <SettingsItem
      type="switch"
      title="Fake User Agent"
      description="Hide app identity from websites"
      :value="fakeUserAgent"
      @change="updateFakeUserAgent"
    />

    <!-- About section -->
    <SettingsSection title="Information" />
    <SettingsItem
      type="nav"
      title="About IITC Prime"
      description="Version and app information"
      :targetScreen="aboutScreen"
    />
  </SettingsBase>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import SettingsItem from './components/SettingsItem';

import PluginsView from './PluginsView';
import UpdateChannelView from './UpdateChannelView';
import AboutView from './AboutView';

export default {
  name: 'SettingsView',

  components: {
    SettingsBase,
    SettingsSection,
    SettingsItem,
  },

  data() {
    return {
      pluginsScreen: PluginsView,
      updateChannelScreen: UpdateChannelView,
      aboutScreen: AboutView
    };
  },

  computed: {
    ...mapGetters('settings', [
      'isDesktopMode',
      'isFakeUserAgent',
      'isPersistentZoom',
      'isShowLocation'
    ]),
    ...mapGetters('manager', [
      'currentChannel',
      'enabledPlugins'
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
      const count = Object.keys(this.enabledPlugins).length;
      return `${count} plugins enabled`;
    },

    updateChannelDescription() {
      return `Current: ${this.currentChannel}`;
    }
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
    }
  },

  async mounted() {
    await this.loadChannelInfo();
    await this.loadPluginsInfo();
  }
};
</script>

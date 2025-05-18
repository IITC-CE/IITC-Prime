//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <SettingsBase title="Update Channel">
    <!-- Channel selection - Using SectionHeader instead of SettingsSection -->
    <SectionHeader title="Channel" once="true" />
    <UpdateChannelSelector
      :currentChannel="currentChannel"
      @channelSelected="selectChannel"
    />

    <!-- Custom Channel URL -->
    <CustomChannelInput
      v-if="currentChannel === 'custom'"
      :customUrl="customUrl"
      @urlChanged="updateCustomUrl"
    />

    <!-- Update frequency -->
    <SectionHeader title="Update Frequency" once="true" />
    <UpdateIntervalSelector
      :currentChannel="currentChannel"
      :selectedInterval="selectedIntervalValue"
      @intervalSelected="updateInterval"
    />

    <!-- External plugins update frequency -->
    <ExternalPluginsIntervalSelector
      :selectedInterval="externalIntervalValue"
      @intervalSelected="updateExternalInterval"
    />

    <!-- Force update button -->
    <UpdateButton
      :isUpdating="isUpdating"
      :lastCheckTime="lastCheckTime"
      @update="runForceUpdate"
    />
  </SettingsBase>
</template>

<script>
import { mapActions } from 'vuex';
import SettingsBase from './SettingsBase';
import SectionHeader from './components/SectionHeader';
import UpdateChannelSelector from './components/UpdateChannel/UpdateChannelSelector';
import CustomChannelInput from './components/UpdateChannel/CustomChannelInput';
import UpdateIntervalSelector from './components/UpdateChannel/UpdateIntervalSelector';
import ExternalPluginsIntervalSelector from './components/UpdateChannel/ExternalPluginsIntervalSelector';
import UpdateButton from './components/UpdateChannel/UpdateButton';

export default {
  name: 'UpdateChannelView',

  components: {
    SettingsBase,
    SectionHeader,
    UpdateChannelSelector,
    CustomChannelInput,
    UpdateIntervalSelector,
    ExternalPluginsIntervalSelector,
    UpdateButton
  },

  data() {
    return {
      currentChannel: 'release',
      customUrl: '',
      selectedIntervalValue: '86400',
      externalIntervalValue: '86400',
      isUpdating: false,
      lastCheckTime: null
    };
  },

  methods: {
    ...mapActions('manager', [
      'getUpdateChannel',
      'setUpdateChannel',
      'getUpdateInterval',
      'setUpdateInterval',
      'getCustomChannelUrl',
      'setCustomChannelUrl',
      'forceUpdate'
    ]),

    /**
     * Select update channel
     */
    async selectChannel(channel) {
      if (this.currentChannel === channel) return;

      // Update UI
      this.currentChannel = channel;

      // Save to storage
      await this.setUpdateChannel(channel);

      // Load interval for this channel
      await this.loadChannelInterval();

      // Load custom URL if needed
      if (channel === 'custom') {
        await this.loadCustomUrl();
      }
    },

    /**
     * Load interval for current channel
     */
    async loadChannelInterval() {
      const interval = await this.getUpdateInterval(this.currentChannel);
      this.selectedIntervalValue = String(interval);
    },

    /**
     * Load external plugins update interval
     */
    async loadExternalInterval() {
      const interval = await this.getUpdateInterval('external');
      this.externalIntervalValue = String(interval);
    },

    /**
     * Update interval when changed
     */
    async updateInterval(interval) {
      this.selectedIntervalValue = interval;

      await this.setUpdateInterval({
        interval: Number(interval),
        channel: this.currentChannel
      });
    },

    /**
     * Update external plugins interval
     */
    async updateExternalInterval(interval) {
      this.externalIntervalValue = interval;
      await this.setUpdateInterval({
        interval: Number(interval),
        channel: 'external'
      });
    },

    /**
     * Load custom channel URL
     */
    async loadCustomUrl() {
      this.customUrl = await this.getCustomChannelUrl();
    },

    /**
     * Update custom URL
     */
    async updateCustomUrl(url) {
      this.customUrl = url;
      await this.setCustomChannelUrl(url);
    },

    /**
     * Run force update
     */
    async runForceUpdate() {
      this.isUpdating = true;

      try {
        await this.forceUpdate();
        this.lastCheckTime = Date.now();
      } catch (error) {
        console.error('Force update failed:', error);
      } finally {
        this.isUpdating = false;
      }
    }
  },

  async mounted() {
    // Load current channel
    this.currentChannel = await this.getUpdateChannel();

    // Load interval for current channel
    await this.loadChannelInterval();

    // Load external plugins interval
    await this.loadExternalInterval();

    // Load custom URL if needed
    if (this.currentChannel === 'custom') {
      await this.loadCustomUrl();
    }
  }
};
</script>

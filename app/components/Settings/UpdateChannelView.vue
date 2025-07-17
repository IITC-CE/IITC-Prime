// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase title="Update Channel">
    <!-- Channel selection -->
    <SettingsSection title="Channel" />
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
    <SettingsSection title="Update Frequency" />
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
import { mapActions, mapGetters } from 'vuex';
import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import UpdateChannelSelector from './components/UpdateChannel/UpdateChannelSelector';
import CustomChannelInput from './components/UpdateChannel/CustomChannelInput';
import UpdateIntervalSelector from './components/UpdateChannel/UpdateIntervalSelector';
import ExternalPluginsIntervalSelector from './components/UpdateChannel/ExternalPluginsIntervalSelector';
import UpdateButton from './components/UpdateChannel/UpdateButton';

export default {
  name: 'UpdateChannelView',

  components: {
    SettingsBase,
    SettingsSection,
    UpdateChannelSelector,
    CustomChannelInput,
    UpdateIntervalSelector,
    ExternalPluginsIntervalSelector,
    UpdateButton
  },

  data() {
    return {
      selectedIntervalValue: '86400',
      externalIntervalValue: '86400',
      isUpdating: false,
      lastCheckTime: null
    };
  },

  computed: {
    ...mapGetters('manager', ['currentChannel', 'customChannelUrl']),

    customUrl() {
      return this.customChannelUrl;
    }
  },

  methods: {
    ...mapActions('manager', [
      'loadUpdateChannel',
      'setUpdateChannel',
      'getUpdateInterval',
      'setUpdateInterval',
      'loadCustomChannelUrl',
      'setCustomChannelUrl',
      'forceUpdate'
    ]),

    /**
     * Select update channel
     */
    async selectChannel(channel) {
      if (this.currentChannel === channel) return;

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
      await this.loadCustomChannelUrl();
    },

    /**
     * Update custom URL
     */
    async updateCustomUrl(url) {
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
    await this.loadUpdateChannel();

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

// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase title="Update Channel">
    <template #headerRight>
      <ActionItem
        text="Update now"
        @tap="runForceUpdate"
        :isEnabled="!isUpdating"
        color="white"
        class="update-action-item"
      />
    </template>

    <!-- Channel selection -->
    <SettingsSection title="Channel" />
    <UpdateChannelSelector
      :currentChannel="currentChannel"
      @channelSelected="selectChannel"
    />

    <!-- Custom Channel URL -->
    <SettingsSection title="Custom URL" v-show="currentChannel === 'custom'" />
    <CustomChannelInput
      v-show="currentChannel === 'custom'"
      :customUrl="customUrl"
      @urlChanged="updateCustomUrl"
    />

    <!-- Update frequency -->
    <SettingsSection title="Update frequency" />
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

    <!-- Update Status -->
    <StackLayout class="update-status">
      <Label
        v-if="formattedLastCheckTime"
        :text="`Last check: ${formattedLastCheckTime}`"
        class="last-check-label"
      />
      <ActivityIndicator v-if="isUpdating" busy="true" class="update-indicator" />
    </StackLayout>
  </SettingsBase>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import {markRaw} from "vue";
import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import UpdateChannelSelector from './components/UpdateChannel/UpdateChannelSelector';
import CustomChannelInput from './components/UpdateChannel/CustomChannelInput';
import UpdateIntervalSelector from './components/UpdateChannel/UpdateIntervalSelector';
import ExternalPluginsIntervalSelector from './components/UpdateChannel/ExternalPluginsIntervalSelector';

export default {
  name: 'UpdateChannelView',

  components: {
    SettingsBase: markRaw(SettingsBase),
    SettingsSection: markRaw(SettingsSection),
    UpdateChannelSelector: markRaw(UpdateChannelSelector),
    CustomChannelInput: markRaw(CustomChannelInput),
    UpdateIntervalSelector: markRaw(UpdateIntervalSelector),
    ExternalPluginsIntervalSelector: markRaw(ExternalPluginsIntervalSelector),
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
    },

    // Formatted last check date
    formattedLastCheckTime() {
      if (!this.lastCheckTime) return '';

      const date = new Date(this.lastCheckTime);
      return date.toLocaleString();
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
      console.log("runForceUpdate called in UpdateChannelView");
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

<style scoped lang="scss">
@import '@/app';

.update-status {
  padding: 16;
  text-align: center;
}

.last-check-label {
  font-size: 14;
  color: $on-surface-dark;
  margin-bottom: 8;
}

.update-indicator {
  color: $primary;
  width: 24;
  height: 24;
  horizontal-align: center;
}

.update-action-item {
  color: white;
}
</style>

// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase :title="$L('update_channel.title')">
    <template #headerRight>
      <Label
        :text="$L('update_channel.update_now')"
        @tap="runForceUpdate"
        :isEnabled="!isUpdating"
        class="header-action"
      />
    </template>

    <!-- Channel selection -->
    <SettingsSection :title="$L('update_channel.section.channel')" />
    <UpdateChannelSelector :currentChannel="currentChannel" @channelSelected="selectChannel" />

    <!-- Custom Channel URL -->
    <SettingsSection
      :title="$L('update_channel.section.custom_url')"
      v-show="currentChannel === 'custom'"
    />
    <CustomChannelInput
      v-show="currentChannel === 'custom'"
      :customUrl="customUrl"
      @urlChanged="updateCustomUrl"
    />

    <!-- Update frequency -->
    <SettingsSection :title="$L('update_channel.section.frequency')" />
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
        :text="$L('update_channel.last_check', formattedLastCheckTime)"
        class="last-check-label"
      />
      <ActivityIndicator v-if="isUpdating" busy="true" class="update-indicator" />
    </StackLayout>
  </SettingsBase>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { markRaw } from 'vue';
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
      lastCheckTime: null,
    };
  },

  computed: {
    ...mapGetters('manager', ['currentChannel', 'customChannelUrl']),

    customUrl() {
      return this.customChannelUrl;
    },

    formattedLastCheckTime() {
      if (!this.lastCheckTime) return '';

      const diff = Math.floor((Date.now() - this.lastCheckTime) / 1000);
      if (diff < 60) return this.$L('update_channel.time.just_now');
      if (diff < 3600) return this.$L('update_channel.time.minutes_ago', Math.floor(diff / 60));
      if (diff < 86400) return this.$L('update_channel.time.hours_ago', Math.floor(diff / 3600));
      return this.$L('update_channel.time.days_ago', Math.floor(diff / 86400));
    },
  },

  methods: {
    ...mapActions('manager', [
      'loadUpdateChannel',
      'setUpdateChannel',
      'getUpdateInterval',
      'setUpdateInterval',
      'loadCustomChannelUrl',
      'setCustomChannelUrl',
      'forceUpdate',
      'getLastCheckTime',
    ]),

    /**
     * Select update channel
     */
    async selectChannel(channel) {
      if (this.currentChannel === channel) return;

      const data = await this.setUpdateChannel(channel);

      // Discard result if a newer tap already changed the channel
      if (this.currentChannel !== channel) return;

      this.selectedIntervalValue = String(data.interval);

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
        channel: this.currentChannel,
      });
    },

    /**
     * Update external plugins interval
     */
    async updateExternalInterval(interval) {
      this.externalIntervalValue = interval;
      await this.setUpdateInterval({
        interval: Number(interval),
        channel: 'external',
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
    },

    async loadLastCheckTime() {
      const seconds = await this.getLastCheckTime();
      if (seconds) this.lastCheckTime = seconds * 1000;
    },
  },

  async mounted() {
    await this.loadUpdateChannel();
    await Promise.all([
      this.loadChannelInterval(),
      this.loadExternalInterval(),
      this.loadLastCheckTime(),
      ...(this.currentChannel === 'custom' ? [this.loadCustomUrl()] : []),
    ]);
  },
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
  color: $on-surface-variant;
  margin-bottom: 8;
}

.update-indicator {
  color: $accent;
  width: 24;
  height: 24;
  horizontal-align: center;
}
</style>

// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <SettingsBase
    :title="$L('update_channel.title')"
    :actions="headerActions"
    @action="forceUpdate()"
  >
    <!-- Channel selection -->
    <SettingsSection :title="$L('update_channel.section.channel')" />
    <UpdateChannelSelector :currentChannel="currentChannel" @channelSelected="selectChannel" />

    <!-- Update status of the current channel -->
    <GridLayout v-if="statusText" columns="*, auto" class="update-status">
      <StackLayout col="0" verticalAlignment="center">
        <Label
          :text="statusText"
          :class="['status-label', { 'status-label--error': shownError }]"
          textWrap="true"
        />
        <Label v-if="shownError" :text="statusDetail" class="status-label" />
      </StackLayout>
      <!-- Hidden, not removed: the taller button keeps the height while a check runs -->
      <GridLayout col="1" verticalAlignment="center">
        <AppButton
          v-if="shownError"
          variant="plain"
          :text="$L('update_channel.retry')"
          :visibility="isChecking ? 'hidden' : 'visible'"
          @tap="forceUpdate()"
        />
        <ActivityIndicator
          busy="true"
          class="update-indicator"
          :visibility="isChecking ? 'visible' : 'hidden'"
        />
      </GridLayout>
    </GridLayout>

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
  </SettingsBase>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { markRaw } from 'vue';
import { statusErrorText } from '@/utils/manager/error-text';
import AppButton from '@/components/base/AppButton.vue';
import SettingsBase from './SettingsBase';
import SettingsSection from './components/SettingsSection';
import UpdateChannelSelector from './components/UpdateChannel/UpdateChannelSelector';
import CustomChannelInput from './components/UpdateChannel/CustomChannelInput';
import UpdateIntervalSelector from './components/UpdateChannel/UpdateIntervalSelector';
import ExternalPluginsIntervalSelector from './components/UpdateChannel/ExternalPluginsIntervalSelector';

export default {
  name: 'UpdateChannelView',

  components: {
    AppButton: markRaw(AppButton),
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
      // Ticks while the screen is open, so that relative times stay current
      now: Date.now(),
      shownStatus: null,
    };
  },

  computed: {
    headerActions() {
      return [{ id: 'update', text: this.$L('update_channel.update_now') }];
    },

    ...mapGetters('manager', ['currentChannel', 'customChannelUrl', 'channelStatus']),

    customUrl() {
      return this.customChannelUrl;
    },

    isChecking() {
      return !!this.channelStatus?.checking;
    },

    shownError() {
      return statusErrorText(this.shownStatus);
    },

    statusText() {
      const status = this.shownStatus;
      if (this.shownError) return this.$L('update_channel.check_failed', this.shownError);
      if (status?.lastCheck) {
        return this.$L('update_channel.last_check', this.timeAgo(status.lastCheck));
      }
      return this.isChecking ? this.$L('update_channel.checking') : '';
    },

    statusDetail() {
      if (this.isChecking) return this.$L('update_channel.checking');
      return this.$L('update_channel.next_attempt', this.timeUntil(this.shownStatus.nextCheck));
    },
  },

  watch: {
    // A new URL resets the check state, and every check flips `checking`:
    // keep the last result until the next one, so that the URL field below does not jump
    channelStatus: {
      handler(status) {
        if (status && !status.checking && (status.lastCheck || status.retry)) {
          this.shownStatus = status;
        }
      },
      immediate: true,
    },

    currentChannel() {
      this.shownStatus = null;
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

    /** Relative time of a past unix time in seconds */
    timeAgo(time) {
      const diff = Math.floor(this.now / 1000 - time);
      if (diff < 60) return this.$L('update_channel.time.just_now');
      if (diff < 3600) return this.$L('update_channel.time.minutes_ago', Math.floor(diff / 60));
      if (diff < 86400) return this.$L('update_channel.time.hours_ago', Math.floor(diff / 3600));
      return this.$L('update_channel.time.days_ago', Math.floor(diff / 86400));
    },

    /** Relative time of a future unix time in seconds */
    timeUntil(time) {
      const diff = Math.max(Math.ceil(time - this.now / 1000), 1);
      if (diff < 60) return this.$L('update_channel.time.in_seconds', diff);
      if (diff < 3600) return this.$L('update_channel.time.in_minutes', Math.ceil(diff / 60));
      return this.$L('update_channel.time.in_hours', Math.ceil(diff / 3600));
    },
  },

  async mounted() {
    this.clock = setInterval(() => (this.now = Date.now()), 1000);
    await this.loadUpdateChannel();
    await Promise.all([
      this.loadChannelInterval(),
      this.loadExternalInterval(),
      ...(this.currentChannel === 'custom' ? [this.loadCustomUrl()] : []),
    ]);
  },

  beforeUnmount() {
    clearInterval(this.clock);
  },
};
</script>

<style scoped lang="scss">
@use '@/variables' as *;

.update-status {
  padding: 8 16 0 16;
}

.status-label {
  font-size: 14;
  color: $on-surface-variant;
}

.status-label--error {
  color: $state-error;
}

.update-indicator {
  color: $accent;
  width: 20;
  height: 20;
  margin: 0 12;
}
</style>

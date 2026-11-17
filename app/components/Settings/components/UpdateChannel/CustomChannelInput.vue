// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout>
    <GridLayout
      columns="*, auto"
      class="list-item list-item--first list-item--last url-input-container"
    >
      <TextField
        ref="urlInput"
        col="0"
        class="url-input"
        v-model="url"
        :hint="$L('custom_channel.hint')"
        returnKeyType="done"
        @loaded="fixTextInputColors"
      />
      <Label
        col="1"
        class="ms url-status-icon"
        :class="urlStatusClass"
        :text="$filters.fonticon(urlStatusIcon)"
      />
    </GridLayout>

    <Label :text="$L('custom_channel.examples')" class="examples-label section-note" once="true" />
    <WrapLayout class="examples-container section-note">
      <StackLayout class="chip" v-on="pressFeedback" @tap="setExampleUrl('http://localhost:8000')">
        <Label text="localhost:8000" class="chip-text" once="true" />
      </StackLayout>
      <StackLayout
        class="chip"
        v-on="pressFeedback"
        @tap="setExampleUrl('https://iitc.app/build/artifact/PR')"
      >
        <Label text="iitc.app/build/artifact/PR" class="chip-text" once="true" />
      </StackLayout>
    </WrapLayout>
  </StackLayout>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { checkCustomChannelUrl } from 'lib-iitc-manager';
import { fixTextInputColors, pressFeedback } from '@/utils/platform/ui';

export default {
  name: 'CustomChannelInput',

  props: {
    customUrl: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      pressFeedback,
      url: this.customUrl,
      urlStatus: 'unknown', // 'success', 'error', 'unknown'
    };
  },

  computed: {
    ...mapGetters('manager', ['updateStatus']),

    // URL status icon based on validation state
    urlStatusIcon() {
      if (this.urlStatus === 'success') return 'ms-check';
      if (this.urlStatus === 'error') return 'ms-close';
      return 'ms-question-mark';
    },

    urlStatusClass() {
      return {
        'status-success': this.urlStatus === 'success',
        'status-error': this.urlStatus === 'error',
        'status-unknown': this.urlStatus === 'unknown',
      };
    },
  },

  watch: {
    url() {
      clearTimeout(this.checkTimer);
      this.checkTimer = setTimeout(() => this.checkCustomUrl(), 100);
    },
  },

  methods: {
    fixTextInputColors,
    ...mapActions('manager', ['forceUpdate']),

    /**
     * Save a changed URL and show whether it serves a channel
     */
    async checkCustomUrl() {
      this.urlStatus = 'unknown';
      if (!this.url) return;

      const enteredUrl = this.url;

      // Normalized only for checking and saving
      let urlToCheck = enteredUrl;
      if (!/^https?:\/\//i.test(urlToCheck)) {
        urlToCheck = 'http://' + urlToCheck;
      }

      // Saved even if it fails the check: the server may not be up yet
      if (urlToCheck !== this.customUrl) this.$emit('urlChanged', urlToCheck);

      const { ok } = await checkCustomChannelUrl(urlToCheck);

      // A slower check of an older value must not override a newer one
      if (this.url !== enteredUrl) return;

      this.urlStatus = ok ? 'success' : 'error';

      // A server that came up after its URL failed would otherwise wait out the retry pause
      const status = this.updateStatus;
      if (ok && status?.channel === 'custom' && status.internal.retry) {
        this.forceUpdate();
      }
    },

    /**
     * Set example URL
     */
    async setExampleUrl(url) {
      this.url = url;
      await this.$nextTick();
      this.$refs.urlInput?.nativeView?.setSelection(url.length);
    },
  },

  mounted() {
    // Check URL status on mount
    this.checkCustomUrl();
  },

  beforeUnmount() {
    clearTimeout(this.checkTimer);
  },
};
</script>

<style scoped lang="scss">
@use '@/variables' as *;

.url-input-container {
  margin-bottom: $spacing-s;
}

.url-input {
  margin: 0;
  width: 100%;
  border-radius: 0;
  border-bottom-width: 0;
  border-color: transparent;
  padding: 0;
  font-size: 14;
  color: $on-surface;
  placeholder-color: $on-surface-variant;
}

.url-status-icon {
  width: 24;
  text-align: center;
  vertical-align: center;

  &.status-success {
    color: $state-success;
  }

  &.status-error {
    color: $state-error;
  }

  &.status-unknown {
    color: $state-disabled;
  }
}

.examples-label {
  margin: 4 0;
  font-size: 14;
  color: $on-surface-variant;
}

.examples-container {
  margin: 0 (-$spacing-xxs);
}
</style>

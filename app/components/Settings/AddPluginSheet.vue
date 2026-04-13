// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="sheet-root" androidOverflowEdge="always">
    <FlexboxLayout class="sheet-content" androidOverflowEdge="always">
      <Label text="Add Plugin" class="sheet-title" />

      <!-- URL input -->
      <TextField
        ref="urlField"
        class="text-input url-field"
        hint="https://example.com/plugin.user.js"
        v-model="pluginUrl"
        autocorrect="false"
        autocapitalizationType="none"
        keyboardType="url"
        returnKeyType="go"
        @returnPress="loadPlugin"
        @loaded="fixTextInputColors"
      />

      <!-- Load button -->
      <MDButton
        class="btn-primary btn-load"
        text="Load from URL"
        :isEnabled="!!pluginUrl.trim() && !isLoading"
        @tap="loadPlugin"
      />

      <!-- Divider -->
      <FlexboxLayout class="divider-row" clipToBounds="true">
        <StackLayout class="divider-line" />
        <Label text="or" :class="['divider-text', { android: isAndroid }]" />
        <StackLayout class="divider-line" />
      </FlexboxLayout>
      <!-- Choose file -->
      <MDButton class="btn-primary btn-file" text="Choose from files" @tap="chooseFile" />

      <!-- Loading indicator -->
      <ActivityIndicator v-if="isLoading" busy="true" class="loading-indicator" />

      <!-- Error message -->
      <Label v-if="errorMessage" :text="errorMessage" class="error-message" textWrap="true" />
    </FlexboxLayout>
  </StackLayout>
</template>

<script>
import { isAndroid } from '@nativescript/core';
import { downloadPlugin, confirmAndInstallPlugin } from '@/utils/plugin-installer';
import { getClipboardTextIfMatches, fixTextInputColors } from '@/utils/platform';
import { selectFiles, readFileContent } from '@/utils/file-manager';

export default {
  name: 'AddPluginSheet',

  data() {
    return {
      isAndroid,
      pluginUrl: '',
      isLoading: false,
      errorMessage: '',
    };
  },

  methods: {
    fixTextInputColors,

    async checkClipboard() {
      const url = await getClipboardTextIfMatches(/\.user\.js/i);
      if (url) {
        this.pluginUrl = url;
      }
    },

    async loadPlugin() {
      const url = this.pluginUrl.trim();
      if (!url || this.isLoading) return;

      this.errorMessage = '';
      this.isLoading = true;

      try {
        const { code, filename } = await downloadPlugin(url);
        const installed = await confirmAndInstallPlugin(code, filename);
        if (installed) this.$closeBottomSheet();
      } catch (error) {
        console.error('Failed to add plugin:', error);
        this.errorMessage = error.message || 'Unknown error occurred';
      } finally {
        this.isLoading = false;
      }
    },

    async chooseFile() {
      if (this.isLoading) return;

      this.errorMessage = '';

      try {
        const files = await selectFiles({
          allowsMultipleSelection: false,
          acceptTypes: ['text/javascript', 'application/javascript'],
        });

        if (!files.length) return;

        this.isLoading = true;

        const { content: code, name: fileName } = await readFileContent(files[0].path);
        if (!code) {
          this.errorMessage = 'Failed to read file. The file may be empty or inaccessible.';
          return;
        }

        const installed = await confirmAndInstallPlugin(code, fileName);
        if (installed) this.$closeBottomSheet();
      } catch (error) {
        console.error('Failed to add plugin from file:', error);
        this.errorMessage = error.message || 'Unknown error occurred';
      } finally {
        this.isLoading = false;
      }
    },
  },

  mounted() {
    this.checkClipboard();
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.sheet-root {
  background-color: $surface;
  border-radius: $radius-large $radius-large 0 0;
}

.sheet-content {
  flex-direction: column;
  justify-content: flex-start;
  padding: $spacing-l;
  padding-bottom: $spacing-xl;
  background-color: $surface;
  border-radius: $radius-large $radius-large 0 0;
}

.sheet-title {
  color: $on-surface;
  font-size: $font-size-display;
  font-weight: 600;
  margin-bottom: $spacing-m;
}

.url-field {
  margin: 0;
}

.btn-load {
  margin-top: $spacing-s;
}

.divider-row {
  flex-direction: row;
  align-items: center;
  height: 24;
}

.divider-line {
  flex-grow: 1;
  height: 1;
  background-color: rgba(255, 255, 255, 0.15);
}

.divider-text {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin: 0 $spacing-m;
  height: 24;
}

.divider-text.android {
  line-height: 1;
}

.btn-file {
  margin-top: $spacing-s;
}

.loading-indicator {
  color: $primary;
  width: 40;
  height: 40;
  margin: $spacing-m 0;
}

.error-message {
  color: $state-error;
  font-size: $font-size-small;
  margin-top: $spacing-m;
}
</style>

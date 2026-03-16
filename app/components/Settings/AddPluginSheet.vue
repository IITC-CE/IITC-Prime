// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="sheet-content">
    <Label text="Add Plugin" class="sheet-title" />

    <!-- URL input -->
    <TextField
      ref="urlField"
      class="url-field"
      hint="https://example.com/plugin.user.js"
      v-model="pluginUrl"
      autocorrect="false"
      autocapitalizationType="none"
      keyboardType="url"
      returnKeyType="go"
      @returnPress="loadPlugin"
    />

    <!-- Load button -->
    <MDButton
      class="btn-primary btn-load"
      text="Load from URL"
      :isEnabled="!!pluginUrl.trim() && !isLoading"
      @tap="loadPlugin"
    />

    <!-- Divider -->
    <GridLayout columns="*, auto, *" class="divider-row">
      <StackLayout col="0" class="divider-line" />
      <Label col="1" text="— or —" class="divider-text" />
      <StackLayout col="2" class="divider-line" />
    </GridLayout>

    <!-- Choose file -->
    <MDButton class="btn-primary btn-file" text="Choose from files" @tap="chooseFile" />

    <!-- Loading indicator -->
    <ActivityIndicator v-if="isLoading" busy="true" class="loading-indicator" />

    <!-- Error message -->
    <Label v-if="errorMessage" :text="errorMessage" class="error-message" textWrap="true" />
  </StackLayout>
</template>

<script>
import { mapActions } from 'vuex';
import { ajaxGet, parseMeta } from 'lib-iitc-manager';
import { confirm, alert } from '@/utils/dialogs';
import * as Clipboard from 'nativescript-clipboard';

export default {
  name: 'AddPluginSheet',

  data() {
    return {
      pluginUrl: '',
      isLoading: false,
      errorMessage: '',
    };
  },

  methods: {
    ...mapActions('manager', ['addUserScripts']),

    async checkClipboard() {
      try {
        const text = await Clipboard.getText();
        if (text && text.includes('.user.js')) {
          this.pluginUrl = text.trim();
        }
      } catch (_) {}
    },

    async loadPlugin() {
      const url = this.pluginUrl.trim();
      if (!url || this.isLoading) return;

      this.errorMessage = '';
      this.isLoading = true;

      try {
        const code = await ajaxGet(url);
        if (!code) {
          this.errorMessage = 'Failed to download plugin. Check the URL and try again.';
          return;
        }

        const meta = parseMeta(code);
        if (!meta || !meta.name) {
          this.errorMessage =
            'Invalid userscript. The file must contain a valid ==UserScript== header.';
          return;
        }

        const filename = url.substr(url.lastIndexOf('/') + 1);
        if (filename) {
          meta.filename = filename;
        }

        const message = [
          `Name: ${meta.name}`,
          meta.description ? `Description: ${meta.description}` : null,
          meta.version ? `Version: ${meta.version}` : null,
          `Category: ${meta.category || 'Misc'}`,
        ]
          .filter(Boolean)
          .join('\n');

        const confirmed = await confirm({
          title: 'Add plugin?',
          message,
          okButtonText: 'Add',
          cancelButtonText: 'Cancel',
        });

        if (!confirmed) return;

        await this.addUserScripts([{ meta, code }]);
        this.$closeBottomSheet();
      } catch (error) {
        console.error('Failed to add plugin:', error);
        this.errorMessage = `Error: ${error.message || 'Unknown error occurred'}`;
      } finally {
        this.isLoading = false;
      }
    },

    async chooseFile() {
      await alert({
        title: 'Not implemented',
        message: 'Adding plugins from file is not yet supported.',
        okButtonText: 'OK',
      });
    },
  },

  mounted() {
    this.checkClipboard();
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.sheet-content {
  padding: $spacing-m;
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
  padding: $spacing-s;
  margin: 0;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: $radius-small;
  font-size: 14;
  height: 40;
  color: #ffffff;
  placeholder-color: #aaaaaa;
}

.btn-load {
  margin-top: $spacing-s;
}

.divider-row {
  margin: $spacing-s 0;
  vertical-alignment: center;
}

.divider-line {
  height: 1;
  background-color: rgba(255, 255, 255, 0.15);
  vertical-alignment: center;
}

.divider-text {
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin: 0 $spacing-m;
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

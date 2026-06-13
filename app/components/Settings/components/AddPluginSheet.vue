// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout
    class="sheet-root"
    androidOverflowEdge="dont-apply"
    @loaded="onSheetLoaded"
    @androidOverflowInset="onAndroidInset"
    :paddingTop="insetTop"
    :paddingBottom="insetBottom"
  >
    <FlexboxLayout class="sheet-content">
      <Label :text="$L('add_plugin.title')" class="sheet-title" />

      <!-- URL input -->
      <TextField
        ref="urlField"
        class="text-input url-field"
        :hint="$L('add_plugin.url_hint')"
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
        :text="$L('add_plugin.load_url')"
        :isEnabled="!!pluginUrl.trim()"
        @loaded="onLoadButtonLoaded"
        @tap="loadPlugin"
      />

      <!-- Divider -->
      <FlexboxLayout class="divider-row" clipToBounds="true">
        <StackLayout class="divider-line" />
        <Label :text="$L('add_plugin.or')" :class="['divider-text', { android: isAndroid }]" />
        <StackLayout class="divider-line" />
      </FlexboxLayout>
      <!-- Choose file -->
      <MDButton
        class="btn-primary btn-file"
        :text="$L('add_plugin.choose_file')"
        @tap="chooseFile"
      />

      <!-- Error message -->
      <Label v-if="errorMessage" :text="errorMessage" class="error-message" textWrap="true" />
    </FlexboxLayout>
  </StackLayout>
</template>

<script>
import { isAndroid, isIOS } from '@nativescript/core';
import {
  fixTextInputColors,
  getBottomSheetInsetRefs,
  applyBottomSheetInsets,
} from '@/utils/platform';
import { getClipboardURLIfMatches } from '~/utils/clipboard';
import { selectFiles } from '@/utils/file-manager';

export default {
  name: 'AddPluginSheet',

  data() {
    return {
      isAndroid,
      pluginUrl: '',
      errorMessage: '',
      insetTop: 0,
      insetBottom: 0,
    };
  },

  methods: {
    fixTextInputColors,

    onSheetLoaded(args) {
      this._insetRefs = getBottomSheetInsetRefs(args);
    },

    onAndroidInset(args) {
      const result = applyBottomSheetInsets(args, this._insetRefs, { translateForIme: true });
      if (result) {
        this.insetTop = result.insetTop;
        this.insetBottom = result.insetBottom;
      }
    },

    async checkClipboard() {
      const url = await getClipboardURLIfMatches(/\.user\.js/i);
      if (url) {
        this.pluginUrl = url;
      }
    },

    onLoadButtonLoaded(args) {
      if (isIOS) {
        args.object.ios.setTitleColorForState(UIColor.whiteColor, UIControlState.Disabled);
      }
    },

    loadPlugin() {
      const url = this.pluginUrl.trim();
      if (!url) return;
      this.$closeBottomSheet({ type: 'url', url });
    },

    async chooseFile() {
      this.errorMessage = '';

      try {
        const files = await selectFiles({
          allowsMultipleSelection: false,
          acceptTypes: ['text/javascript', 'application/javascript'],
        });

        if (!files.length) return;

        this.$closeBottomSheet({ type: 'file', path: files[0].path });
      } catch (error) {
        console.error('Failed to choose file:', error);
        this.errorMessage = error.message || this.$L('add_plugin.unknown_error');
      }
    },
  },

  mounted() {
    this.checkClipboard();
  },

  beforeUnmount() {
    this._insetRefs = null;
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

.error-message {
  color: $state-error;
  font-size: $font-size-small;
  margin-top: $spacing-m;
}
</style>

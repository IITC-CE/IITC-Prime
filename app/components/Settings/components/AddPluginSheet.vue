// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout
    class="sheet-root"
    androidOverflowEdge="dont-apply"
    @loaded="onSheetLoaded"
    @showingModally="configureIosSheet"
    @androidOverflowInset="onAndroidInset"
    :paddingBottom="insetBottom"
  >
    <!-- Android warns about a stretched ScrollView in a StackLayout -->
    <ScrollView verticalAlignment="top" iosContentInsetAdjustmentBehavior="always">
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
          @loaded="onUrlFieldLoaded"
        />

        <!-- Load button -->
        <AppButton
          class="btn-load"
          :text="$L('add_plugin.load_url')"
          :isEnabled="!!pluginUrl.trim()"
          @tap="loadPlugin"
        />

        <!-- Divider -->
        <FlexboxLayout class="divider-row" clipToBounds="true">
          <StackLayout class="divider-line" />
          <Label :text="$L('add_plugin.or')" :class="['divider-text', { android: isAndroid }]" />
          <StackLayout class="divider-line" />
        </FlexboxLayout>
        <!-- Choose file -->
        <AppButton class="btn-file" :text="$L('add_plugin.choose_file')" @tap="chooseFile" />

        <!-- Error message -->
        <Label v-if="errorMessage" :text="errorMessage" class="error-message" textWrap="true" />
      </FlexboxLayout>
    </ScrollView>
  </StackLayout>
</template>

<script>
import { Color, Utils, isAndroid, isIOS } from '@nativescript/core';
import {
  closeSheet,
  configureIosSheet,
  fixTextInputColors,
  getBottomSheetInsetRefs,
  applyBottomSheetInsets,
} from '@/utils/platform/ui';
import { getClipboardURLIfMatches } from '~/utils/clipboard';
import { selectFiles } from '@/utils/file-manager';
import AppButton from '@/components/base/AppButton.vue';

export default {
  name: 'AddPluginSheet',

  components: { AppButton },

  data() {
    return {
      isAndroid,
      pluginUrl: '',
      errorMessage: '',
      insetBottom: 0,
    };
  },

  methods: {
    configureIosSheet,

    onUrlFieldLoaded(args) {
      fixTextInputColors(args);
      // $ios-sheet-on-surface-variant: fixTextInputColors sets the placeholder over any CSS
      if (isIOS && Utils.SDK_VERSION >= 26) {
        args.object.style.placeholderColor = new Color('rgba(235, 235, 245, 0.6)');
      }
    },

    onSheetLoaded(args) {
      this._insetRefs = getBottomSheetInsetRefs(args);
    },

    onAndroidInset(args) {
      const insetBottom = applyBottomSheetInsets(args, this._insetRefs, { translateForIme: true });
      if (insetBottom !== null) this.insetBottom = insetBottom;
    },

    async checkClipboard() {
      const url = await getClipboardURLIfMatches(/\.user\.js/i);
      if (url) {
        this.pluginUrl = url;
      }
    },

    loadPlugin() {
      const url = this.pluginUrl.trim();
      if (!url) return;
      closeSheet(this, { type: 'url', url });
    },

    async chooseFile() {
      this.errorMessage = '';

      try {
        const files = await selectFiles({
          allowsMultipleSelection: false,
          acceptTypes: ['text/javascript', 'application/javascript'],
        });

        if (!files.length) return;

        closeSheet(this, { type: 'file', path: files[0].path });
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

.ns-ios .divider-text {
  color: $ios-sheet-on-surface-variant;
}

.ns-ios-15,
.ns-ios-16,
.ns-ios-17,
.ns-ios-18 {
  .divider-text {
    color: $on-surface-variant;
  }
}

.sheet-content {
  flex-direction: column;
  justify-content: flex-start;
  padding: $spacing-l;
  padding-bottom: $spacing-xl;
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

.btn-load,
.btn-file {
  margin: 0;
}

.btn-load {
  margin-top: $spacing-s;
}

.divider-row {
  flex-direction: row;
  align-items: center;
  height: 24;
  margin: $spacing-s 0;
}

.divider-line {
  flex-grow: 1;
  height: 1;
  background-color: rgba(255, 255, 255, 0.15);
}

.divider-text {
  color: $on-surface-variant;
  font-size: $font-size-small;
  margin: 0 $spacing-m;
  height: 24;
}

.divider-text.android {
  line-height: 1;
}

.error-message {
  color: $state-error;
  font-size: $font-size-small;
  margin-top: $spacing-m;
}
</style>

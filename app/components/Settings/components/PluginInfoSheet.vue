// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout
    class="sheet-root"
    androidOverflowEdge="dont-apply"
    @loaded="onSheetLoaded"
    @androidOverflowInset="onAndroidInset"
    :paddingBottom="insetBottom"
  >
    <ScrollView id="mainScrollView">
      <FlexboxLayout class="sheet-content">
        <!-- Header: icon + name / category -->
        <GridLayout class="plugin-header" columns="64, *" rows="auto">
          <AsyncSVGIcon v-if="isIconSVG" col="0" :src="pluginIcon" icon-class="plugin-icon" />
          <AsyncRasterIcon v-else col="0" :src="pluginIcon" icon-class="plugin-icon" />

          <StackLayout col="1" class="header-info">
            <Label :text="displayName" class="plugin-name" textWrap="true" />
            <Label
              v-if="!isLoading"
              :text="plugin.category || $L('plugin_info.default_category')"
              class="plugin-category"
            />
          </StackLayout>
        </GridLayout>

        <!-- Loading indicator -->
        <ActivityIndicator v-if="isLoading" busy="true" class="sheet-loading" />

        <!-- Load error notice -->
        <GridLayout v-if="hasLoadError" columns="auto, *" rows="auto" class="notice-block">
          <Label
            col="0"
            row="0"
            :text="$filters.fonticon('ms-error')"
            class="ms notice-icon notice-icon--error"
          />
          <Label col="1" row="0" :text="plugin.loadError" class="notice-text" textWrap="true" />
        </GridLayout>

        <!-- User / override notice -->
        <GridLayout v-if="showNotice" columns="auto, *" rows="auto" class="notice-block">
          <Label
            col="0"
            row="0"
            :text="$filters.fonticon('ms-info')"
            class="ms notice-icon"
            :class="isOverride ? 'notice-icon--warning' : 'notice-icon--user'"
          />
          <Label col="1" row="0" :text="noticeText" class="notice-text" textWrap="true" />
        </GridLayout>

        <!-- Details section -->
        <StackLayout v-if="hasDetails" class="details">
          <Label
            v-if="plugin.description"
            :text="plugin.description"
            class="detail-description"
            textWrap="true"
          />
          <FlexboxLayout v-if="plugin.version" class="detail-row">
            <Label :text="$L('plugin_info.version')" class="detail-label" />
            <Label :text="plugin.version" class="detail-value" />
          </FlexboxLayout>
          <FlexboxLayout v-if="plugin.author" class="detail-row">
            <Label :text="$L('plugin_info.author')" class="detail-label" />
            <Label :text="plugin.author" class="detail-value" textWrap="true" />
          </FlexboxLayout>
        </StackLayout>

        <!-- Action buttons -->
        <AppButton
          v-if="installMode && !isLoading && !hasLoadError"
          variant="filled"
          :text="$L('plugin_info.install')"
          class="btn-install"
          @tap="onInstall"
        />
        <AppButton
          v-if="plugin.homepageURL"
          :text="$L('plugin_info.open_homepage')"
          class="btn-action"
          @tap="onOpenHomepage"
        />
        <AppButton
          v-if="plugin.issueTracker"
          :text="$L('plugin_info.open_issue_tracker')"
          class="btn-action"
          @tap="onOpenIssueTracker"
        />
        <AppButton
          v-if="plugin.downloadURL"
          :text="$L('plugin_info.share_download')"
          class="btn-action"
          @tap="onShareDownload"
        />
        <AppButton
          v-if="plugin.updateURL"
          :text="$L('plugin_info.share_update')"
          class="btn-action"
          @tap="onShareUpdate"
        />
        <AppButton
          v-if="!installMode && (plugin.user || plugin.override)"
          destructive
          :text="
            plugin.override ? $L('plugin_info.remove_override') : $L('plugin_info.delete_plugin')
          "
          class="btn-delete"
          @tap="onDelete"
        />
      </FlexboxLayout>
    </ScrollView>
  </StackLayout>
</template>

<script>
import { Utils } from '@nativescript/core';
import { getUID } from 'lib-iitc-manager';
import { shareContent } from '@/utils/platform/system';
import { getBottomSheetInsetRefs, applyBottomSheetInsets } from '@/utils/platform/ui';
import AsyncSVGIcon from './plugins/AsyncSVGIcon.vue';
import AsyncRasterIcon from './plugins/AsyncRasterIcon.vue';
import AppButton from '@/components/base/AppButton.vue';

export default {
  name: 'PluginInfoSheet',

  components: {
    AsyncSVGIcon,
    AsyncRasterIcon,
    AppButton,
  },

  props: {
    plugin: {
      type: Object,
      required: true,
    },
    installMode: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      insetBottom: 0,
    };
  },

  computed: {
    isLoading() {
      return !!this.plugin.loading;
    },

    hasLoadError() {
      return !!this.plugin.loadError;
    },

    displayName() {
      if (this.isLoading) return this.$L('plugin_info.loading');
      return this.plugin.name || this.$L('plugin_info.unknown_name');
    },

    pluginIcon() {
      return this.plugin.icon64 || this.plugin.icon || '~/assets/icons/userscript-no-icon.svg';
    },

    isIconSVG() {
      const icon = this.plugin.icon64 || this.plugin.icon;
      if (!icon) return true;
      if (typeof icon === 'string' && icon.startsWith('data:image/svg+xml')) return true;
      if (typeof icon === 'string' && icon.trim().startsWith('<svg')) return true;
      if (typeof icon === 'string' && icon.toLowerCase().endsWith('.svg')) return true;
      return false;
    },

    hasDetails() {
      return !!(this.plugin.description || this.plugin.version || this.plugin.author);
    },

    // Whether installing this plugin would replace an official catalog plugin
    isOverride() {
      if (!this.installMode) return !!this.plugin.override;
      if (this.isLoading || this.hasLoadError) return false;
      const uid = getUID(this.plugin);
      if (!uid) return false;
      const existing = this.$store.getters['manager/plugins'][uid];
      return !!(existing && (existing.override || !existing.user));
    },

    showNotice() {
      // Install preview only warns about overriding an official plugin
      if (this.installMode) return this.isOverride;
      return !!(this.plugin.user || this.plugin.override);
    },

    noticeText() {
      return this.isOverride
        ? this.$L('plugin_info.override_notice')
        : this.$L('plugin_info.user_notice');
    },
  },

  methods: {
    onSheetLoaded(args) {
      this._insetRefs = getBottomSheetInsetRefs(args);
    },

    onAndroidInset(args) {
      const insetBottom = applyBottomSheetInsets(args, this._insetRefs);
      if (insetBottom !== null) this.insetBottom = insetBottom;
    },

    onOpenHomepage() {
      Utils.openUrl(this.plugin.homepageURL);
    },

    onOpenIssueTracker() {
      Utils.openUrl(this.plugin.issueTracker);
    },

    onShareDownload() {
      shareContent(this.plugin.downloadURL, 'url', this.plugin.name || 'Plugin');
    },

    onShareUpdate() {
      shareContent(this.plugin.updateURL, 'url', this.plugin.name || 'Plugin');
    },

    onInstall() {
      this.$closeBottomSheet('install');
    },

    onDelete() {
      this.$closeBottomSheet('delete');
    },
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
  background-color: $surface;
  padding: $spacing-l;
  padding-bottom: $spacing-xl;
  border-radius: $radius-large $radius-large 0 0;
}

.plugin-header {
  margin-bottom: $spacing-m;
}

.plugin-icon {
  width: 48;
  height: 48;
  horizontal-align: left;
  vertical-align: center;
}

.header-info {
  flex-grow: 1;
}

.plugin-name {
  color: $on-surface;
  font-size: $font-size-headline;
  font-weight: 600;
}

.plugin-category {
  color: $on-surface-variant;
  font-size: $font-size-small;
  margin-top: $spacing-xxs;
}

.sheet-loading {
  color: $accent;
  width: 40;
  height: 40;
  margin: $spacing-m auto;
  horizontal-align: center;
}

.notice-block {
  background-color: $surface-container;
  border-radius: $radius-medium;
  padding: $spacing-s $spacing-m;
  margin-bottom: $spacing-m;
}

.notice-icon {
  font-size: $icon-size-small;
  margin-right: $spacing-s;
  vertical-align: center;
  flex-shrink: 0;

  &--user {
    color: #6b7c3a;
  }

  &--warning {
    color: $state-warning;
  }

  &--error {
    color: $state-error;
  }
}

.notice-text {
  color: $on-surface-variant;
  font-size: $font-size-small;
}

.details {
  background-color: $surface-container;
  border-radius: $radius-medium;
  padding: $spacing-m;
  margin-bottom: $spacing-m;
}

.detail-description {
  color: $on-surface;
  font-size: $font-size;
  margin-bottom: $spacing-xs;
}

.detail-row {
  flex-direction: row;
  align-items: center;
  margin-top: $spacing-xs;
}

.detail-label {
  color: $on-surface-variant;
  font-size: $font-size-small;
  font-weight: 500;
  width: 60;
}

.detail-value {
  color: $on-surface;
  font-size: $font-size-small;
  flex-grow: 1;
}

.btn-install {
  margin: 0 0 $spacing-m 0;
}

.btn-action {
  margin: 0 0 $spacing-s 0;
}

.btn-delete {
  margin: 0;
}
</style>

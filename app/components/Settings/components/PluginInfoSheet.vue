// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="sheet-root" androidOverflowEdge="always">
    <ScrollView id="mainScrollView" androidOverflowEdge="always">
      <FlexboxLayout class="sheet-content">
        <!-- Header: icon + name / category -->
        <FlexboxLayout class="plugin-header">
          <AsyncSVGIcon v-if="isIconSVG" :src="pluginIcon" icon-class="plugin-icon" />
          <AsyncRasterIcon v-else :src="pluginIcon" icon-class="plugin-icon" />

          <StackLayout class="header-info">
            <Label :text="displayName" class="plugin-name" textWrap="true" />
            <Label v-if="!isLoading" :text="plugin.category || 'Misc'" class="plugin-category" />
          </StackLayout>
        </FlexboxLayout>

        <!-- Loading indicator -->
        <ActivityIndicator v-if="isLoading" busy="true" class="sheet-loading" />

        <!-- Load error notice -->
        <GridLayout v-if="hasLoadError" columns="auto, *" rows="auto" class="notice-block">
          <Label
            col="0" row="0"
            :text="$filters.fonticon('fa-exclamation-circle')"
            class="fa notice-icon notice-icon--error"
          />
          <Label col="1" row="0" :text="plugin.loadError" class="notice-text" textWrap="true" />
        </GridLayout>

        <!-- User / override notice -->
        <GridLayout v-if="plugin.user || plugin.override" columns="auto, *" rows="auto" class="notice-block">
          <Label
            col="0" row="0"
            :text="$filters.fonticon('fa-info-circle')"
            class="fa notice-icon"
            :class="plugin.override ? 'notice-icon--warning' : 'notice-icon--user'"
          />
          <Label
            col="1" row="0"
            :text="
              plugin.override
                ? 'This user plugin overrides an official plugin'
                : 'This plugin was installed by the user'
            "
            class="notice-text"
            textWrap="true"
          />
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
            <Label text="Version" class="detail-label" />
            <Label :text="plugin.version" class="detail-value" />
          </FlexboxLayout>
          <FlexboxLayout v-if="plugin.author" class="detail-row">
            <Label text="Author" class="detail-label" />
            <Label :text="plugin.author" class="detail-value" textWrap="true" />
          </FlexboxLayout>
        </StackLayout>

        <!-- Action buttons -->
        <MDButton
          v-if="installMode && !isLoading && !hasLoadError"
          text="Install"
          class="btn-install"
          @tap="onInstall"
        />
        <MDButton
          v-if="plugin.homepageURL"
          text="Open homepage"
          class="btn-primary btn-action"
          @tap="onOpenHomepage"
        />
        <MDButton
          v-if="plugin.supportURL"
          text="Open support page"
          class="btn-primary btn-action"
          @tap="onOpenSupport"
        />
        <MDButton
          v-if="plugin.downloadURL"
          text="Share download URL"
          class="btn-primary btn-action"
          @tap="onShareDownload"
        />
        <MDButton
          v-if="plugin.updateURL"
          text="Share update URL"
          class="btn-primary btn-action"
          @tap="onShareUpdate"
        />
        <MDButton v-if="plugin.user" text="Delete plugin" class="btn-delete" @tap="onDelete" />
      </FlexboxLayout>
    </ScrollView>
  </StackLayout>
</template>

<script>
import { Utils } from '@nativescript/core';
import { shareContent } from '@/utils/platform';
import AsyncSVGIcon from './plugins/AsyncSVGIcon.vue';
import AsyncRasterIcon from './plugins/AsyncRasterIcon.vue';

export default {
  name: 'PluginInfoSheet',

  components: {
    AsyncSVGIcon,
    AsyncRasterIcon,
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

  computed: {
    isLoading() {
      return !!this.plugin.loading;
    },

    hasLoadError() {
      return !!this.plugin.loadError;
    },

    displayName() {
      if (this.isLoading) return 'Loading...';
      return this.plugin.name || 'Unknown Plugin';
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
  },

  methods: {
    onOpenHomepage() {
      Utils.openUrl(this.plugin.homepageURL);
    },

    onOpenSupport() {
      Utils.openUrl(this.plugin.supportURL);
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
  flex-direction: row;
  align-items: center;
  margin-bottom: $spacing-m;
}

.plugin-icon {
  width: 48;
  height: 48;
  margin-right: $spacing-m;
  flex-shrink: 0;
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
  color: $on-surface-dark;
  font-size: $font-size-small;
  margin-top: $spacing-xxs;
}

.sheet-loading {
  color: $primary;
  width: 40;
  height: 40;
  margin: $spacing-m auto;
  horizontal-alignment: center;
}

.notice-block {
  background-color: $surface-container;
  border-radius: $radius-medium;
  padding: $spacing-s $spacing-m;
  margin-bottom: $spacing-m;
}

.notice-icon {
  font-size: 16;
  margin-right: $spacing-s;
  vertical-alignment: center;
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
  color: $on-surface-dark;
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
  color: $on-surface-dark;
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
  background-color: $primary;
  border-radius: $radius-small;
  margin: 0 0 $spacing-m 0;
  color: #ffffff;
  font-size: $font-size;
  ripple-color: rgba(255, 255, 255, 0.2);
}

.btn-action {
  margin: 0 0 $spacing-s 0;
}

.btn-delete {
  background-color: $state-error;
  border-radius: $radius-small;
  margin: 0;
  color: #ffffff;
  font-size: $font-size;
  ripple-color: rgba(255, 255, 255, 0.2);
}
</style>

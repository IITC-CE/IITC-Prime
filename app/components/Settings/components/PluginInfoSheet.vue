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
            <Label :text="plugin.name || 'Unknown Plugin'" class="plugin-name" textWrap="true" />
            <Label :text="plugin.category || 'Misc'" class="plugin-category" />
          </StackLayout>
        </FlexboxLayout>

        <!-- User / override notice -->
        <FlexboxLayout v-if="plugin.user || plugin.override" class="notice-block">
          <Label
            :text="$filters.fonticon('fa-info-circle')"
            class="fa notice-icon"
            :class="plugin.override ? 'notice-icon--warning' : 'notice-icon--user'"
          />
          <Label
            :text="
              plugin.override
                ? 'This user plugin overrides an official plugin'
                : 'This plugin was installed by the user'
            "
            class="notice-text"
            textWrap="true"
          />
        </FlexboxLayout>

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
  },

  computed: {
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

.notice-block {
  flex-direction: row;
  align-items: center;
  background-color: $surface-container;
  border-radius: $radius-medium;
  padding: $spacing-s $spacing-m;
  margin-bottom: $spacing-m;
}

.notice-icon {
  font-size: 16;
  margin-right: $spacing-s;
  flex-shrink: 0;

  &--user {
    color: #6b7c3a;
  }

  &--warning {
    color: $state-warning;
  }
}

.notice-text {
  color: $on-surface-dark;
  font-size: $font-size-small;
  flex-grow: 1;
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

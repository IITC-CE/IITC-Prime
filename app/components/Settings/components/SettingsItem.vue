// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout
    class="list-item list-item--big"
    :class="{
      'list-item--first': isFirst,
      'list-item--last': isLast,
      'list-item--spaced': spaced,
      'list-item--two-line': description,
    }"
    columns="*, auto"
    rows="*"
    v-on="type === 'switch' ? switchRowFeedback : pressFeedback"
    @tap="onTap"
  >
    <ContentView class="list-item-spacer" colSpan="2" />

    <StackLayout class="list-item-text" col="0" verticalAlignment="center">
      <Label
        :text="title"
        :class="['list-item-title settings-item-title', { 'settings-item-title--bold': bold }]"
        once="true"
      />
      <Label
        v-if="description"
        :text="description"
        class="list-item-subtitle settings-item-description"
        textWrap="true"
        once="true"
      />
    </StackLayout>

    <!-- Right side content based on type -->
    <StackLayout col="1" class="list-item-trailing" verticalAlignment="center">
      <!-- Navigation arrow -->
      <Label
        v-if="type === 'nav'"
        class="ms settings-nav-icon"
        :text="$filters.fonticon('ms-chevron-right')"
        once="true"
      />

      <!-- External link icon -->
      <Label
        v-else-if="type === 'link'"
        class="ms settings-nav-icon"
        :text="$filters.fonticon('ms-open-in-new')"
        once="true"
      />

      <!-- Switch toggle -->
      <AppSwitch v-else-if="type === 'switch'" :checked="value" @checkedChange="onSwitchChange" />
    </StackLayout>

    <ContentView v-if="isIOS && !isLast" colSpan="2" class="list-separator" />
  </GridLayout>
</template>

<script>
import { $navigateTo } from 'nativescript-vue';
import { Utils, isIOS } from '@nativescript/core';
import AppSwitch from '@/components/base/AppSwitch.vue';
import { pressFeedback, switchRowFeedback } from '@/utils/platform/ui';

export default {
  name: 'SettingsItem',

  components: {
    AppSwitch,
  },

  props: {
    // Basic props
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    // Type of item: 'nav', 'switch', 'action', 'value'
    type: {
      type: String,
      required: true,
      validator: value => ['nav', 'switch', 'action', 'value', 'link'].includes(value),
    },

    // Switch-specific props
    value: {
      type: Boolean,
      default: false,
    },

    // Navigation-specific props
    targetScreen: {
      type: Object,
      default: null,
    },
    navProps: {
      type: Object,
      default: () => ({}),
    },

    // Link-specific props
    url: {
      type: String,
      default: null,
    },

    // Position props
    isFirst: {
      type: Boolean,
      default: false,
    },
    isLast: {
      type: Boolean,
      default: false,
    },
    bold: {
      type: Boolean,
      default: false,
    },
    spaced: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return { isIOS, pressFeedback, switchRowFeedback };
  },

  methods: {
    onTap() {
      if (this.type === 'nav' && this.targetScreen) {
        // Handle navigation
        $navigateTo(this.targetScreen, {
          props: this.navProps,
          animated: true,
          transition: {
            name: 'slideLeft',
            duration: 300,
          },
        });
      } else if (this.type === 'link' && this.url) {
        Utils.openUrl(this.url);
      } else if (this.type === 'action') {
        // Emit custom action event
        this.$emit('action');
      } else if (this.type === 'switch' && !isIOS) {
        this.$emit('change', !this.value);
      }
    },

    onSwitchChange(args) {
      this.$emit('change', args.value);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.settings-item-title {
  font-weight: 500;
}

.settings-item-title--bold {
  font-weight: 700;
}

.list-item--spaced {
  margin-top: 12;
}

.settings-item-description {
  margin-top: 4;
}

.settings-nav-icon {
  color: $on-surface-variant;
  font-size: $icon-size-small;
  margin-right: 4;
  text-align: right;
  vertical-align: center;
}

.settings-value-text {
  color: $on-surface-variant;
  font-size: $font-size-small;
  margin-right: 4;
  vertical-align: center;
}
</style>

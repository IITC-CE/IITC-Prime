// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Page @navigatedTo="onNavigatedTo" @navigatedFrom="onNavigatedFrom">
    <ActionBar
      :title="title"
      flat="true"
      color="#ffffff"
      ios:backgroundColor="#143542"
      android:backgroundColor="#143542"
    >
      <NavigationButton
        v-if="isAndroid"
        @tap="goBack"
        text="Back"
        android.systemIcon="ic_menu_back"
      />
      <NavigationButton v-if="isIOS" @tap="goBack" text="Back" />
      <template v-if="$slots.headerRight && isIOS">
        <slot name="headerRight" ios.position="right"></slot>
      </template>
      <template v-if="$slots.headerRight && isAndroid">
        <slot name="headerRight" android.position="actionBar"></slot>
      </template>
    </ActionBar>

    <!-- Content -->
    <component
      :is="useScroll === 'true' ? 'ScrollView' : 'StackLayout'"
      :orientation="useScroll === 'true' ? 'vertical' : undefined"
      class="settings-container"
    >
      <StackLayout class="settings-content">
        <slot></slot>
      </StackLayout>
    </component>
  </Page>
</template>

<script>
import { Frame, isIOS, isAndroid } from '@nativescript/core';
import { attachBackHandler, detachBackHandler } from '@/utils/platform';

export default {
  name: 'SettingsBase',

  props: {
    title: {
      type: String,
      required: true,
    },
    useScroll: {
      type: String,
      required: false,
      default: 'true',
    },
  },

  data() {
    return {
      isIOS,
      isAndroid,
    };
  },

  methods: {
    goBack() {
      Frame.topmost().goBack();
    },

    // Forward navigation event to parent component
    onNavigatedTo(event) {
      // Attach back press handler when navigating TO this page
      attachBackHandler(this.goBack);
      this.$emit('navigatedTo', event);
    },

    // Handle navigation away from this page
    onNavigatedFrom(event) {
      // Detach back press handler when navigating FROM this page
      detachBackHandler();
      this.$emit('navigatedFrom', event);
    },
  },

  beforeUnmount() {
    detachBackHandler();
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

Page {
  background-color: $surface;
}

.settings-container {
  background-color: $surface;
}

.settings-content {
  padding-left: $spacing-m;
  padding-right: $spacing-m;
}
</style>

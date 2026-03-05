// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Page @navigatedTo="onNavigatedTo" @navigatedFrom="onNavigatedFrom" androidOverflowEdge="dont-apply" @androidOverflowInset="onAndroidInset">
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
      :paddingBottom="navBarHeight"
      class="settings-container"
    >
      <StackLayout class="settings-content">
        <slot></slot>
      </StackLayout>
    </component>
  </Page>
</template>

<script>
import { Frame, Utils, isIOS, isAndroid } from '@nativescript/core';
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
      navBarHeight: 0,
    };
  },

  methods: {
    onAndroidInset(args) {
      if (!isAndroid) return;
      const toDIP = px => Utils.layout.toDeviceIndependentPixels(px);
      this.navBarHeight = toDIP(args.inset.bottom ?? 0);

      // Apply status bar height as top padding to the native Toolbar
      const toolbar = this.$el?.nativeView?.actionBar?.nativeViewProtected;
      if (toolbar) {
        toolbar.setPaddingRelative(
          toolbar.getPaddingStart(),
          args.inset.top ?? 0,
          toolbar.getPaddingEnd(),
          toolbar.getPaddingBottom()
        );
      }

      args.inset.topConsumed = true;
      args.inset.bottomConsumed = true;
      args.inset.leftConsumed = true;
      args.inset.rightConsumed = true;
      args.inset.imeBottomConsumed = true;
    },

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

ActionBar {
  padding-top: 0;
}

.settings-container {
  background-color: $surface;
}

.settings-content {
  padding-left: $spacing-m;
  padding-right: $spacing-m;
  padding-bottom: $spacing-l;
}
</style>

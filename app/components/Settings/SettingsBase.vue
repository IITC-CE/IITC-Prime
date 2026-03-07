// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Page
    @navigatedTo="onNavigatedTo"
    @navigatedFrom="onNavigatedFrom"
    androidOverflowEdge="dont-apply"
    @androidOverflowInset="onAndroidInset"
  >
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
      <StackLayout class="settings-content" :style="contentInsetStyle">
        <slot :bottomPadding="contentBottomPadding"></slot>
      </StackLayout>
    </component>
  </Page>
</template>

<script>
import { Frame, Utils, isIOS, isAndroid } from '@nativescript/core';
import {
  attachBackHandler,
  detachBackHandler,
  parseAndroidInsets,
  getStatusBarHeight,
  getNavigationBarHeight,
} from '@/utils/platform';

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
      statusBarInset: 0,
      navBarInset: 0,
      leftInset: 0,
      rightInset: 0,
    };
  },

  computed: {
    contentBottomPadding() {
      return 24 + this.navBarInset; // $spacing-l + nav bar
    },

    contentInsetStyle() {
      const base = 16; // $spacing-m
      const style = {
        paddingLeft: base + this.leftInset,
        paddingRight: base + this.rightInset,
      };
      if (this.useScroll === 'true') {
        style.paddingBottom = this.contentBottomPadding;
      }
      return style;
    },
  },

  methods: {
    onAndroidInset(args) {
      if (!isAndroid || !args?.inset) return;
      const insets = parseAndroidInsets(args.inset);

      if (insets.top > 0) this.statusBarInset = insets.top;
      this.navBarInset = insets.bottom;
      this.leftInset = insets.left;
      this.rightInset = insets.right;

      // Apply status bar + side insets to native ActionBar toolbar
      const toolbar = this.$el?.nativeView?.actionBar?.nativeViewProtected;
      if (toolbar) {
        toolbar.setPaddingRelative(
          Utils.layout.toDevicePixels(this.leftInset),
          Utils.layout.toDevicePixels(this.statusBarInset),
          Utils.layout.toDevicePixels(this.rightInset),
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

    onNavigatedTo(event) {
      attachBackHandler(this.goBack);
      this.$emit('navigatedTo', event);
    },

    onNavigatedFrom(event) {
      detachBackHandler();
      this.$emit('navigatedFrom', event);
    },
  },

  created() {
    if (isAndroid) {
      this.statusBarInset = getStatusBarHeight();
      this.navBarInset = getNavigationBarHeight();
    }
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
}
</style>

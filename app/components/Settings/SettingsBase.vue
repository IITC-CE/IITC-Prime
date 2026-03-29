// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Page
    actionBarHidden="true"
    @navigatedTo="onNavigatedTo"
    @navigatedFrom="onNavigatedFrom"
    androidOverflowEdge="dont-apply"
    @androidOverflowInset="onAndroidInset"
  >
    <GridLayout rows="auto, *" class="page-root">
      <CustomActionBar row="0" :title="title" :style="actionBarStyle">
        <slot name="headerRight"></slot>
      </CustomActionBar>

      <!-- Content -->
      <component
        row="1"
        :is="useScroll === 'true' ? 'ScrollView' : 'StackLayout'"
        :orientation="useScroll === 'true' ? 'vertical' : undefined"
        class="settings-container"
      >
        <StackLayout class="settings-content" :style="contentInsetStyle">
          <slot :bottomPadding="contentBottomPadding"></slot>
        </StackLayout>
      </component>
    </GridLayout>
  </Page>
</template>

<script>
import { Frame, isIOS, isAndroid } from '@nativescript/core';
import { markRaw } from 'vue';
import {
  attachBackHandler,
  detachBackHandler,
  parseAndroidInsets,
  getStatusBarHeight,
  getNavigationBarHeight,
} from '@/utils/platform';
import CustomActionBar from './components/CustomActionBar';

export default {
  name: 'SettingsBase',

  components: {
    CustomActionBar: markRaw(CustomActionBar),
  },

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

    actionBarStyle() {
      return {
        paddingTop: this.statusBarInset,
        paddingLeft: this.leftInset,
        paddingRight: this.rightInset,
      };
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

      args.inset.topConsumed = true;
      args.inset.bottomConsumed = true;
      args.inset.leftConsumed = true;
      args.inset.rightConsumed = true;
      args.inset.imeBottomConsumed = true;
    },

    onNavigatedTo(event) {
      attachBackHandler(() => Frame.topmost().goBack());
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
    } else if (isIOS) {
      const window = UIApplication.sharedApplication?.keyWindow;
      if (window) {
        this.navBarInset = window.safeAreaInsets.bottom;
      }
    }
  },

  beforeUnmount() {
    detachBackHandler();
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.page-root {
  background-color: $surface;
}

.settings-container {
  background-color: $surface;
}

.settings-content {
}
</style>

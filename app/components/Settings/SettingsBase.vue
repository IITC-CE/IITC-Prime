// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Page
    statusBarStyle="light"
    :actionBarHidden="isAndroid"
    @loaded="onPageLoaded"
    @navigatingTo="onNavigatingTo"
    @navigatedTo="onNavigatedTo"
    @navigatedFrom="onNavigatedFrom"
    androidOverflowEdge="dont-apply"
    @androidOverflowInset="onAndroidInset"
  >
    <!-- iOS gets its search field from attachIosSearchController -->
    <ActionBar
      v-if="!isAndroid"
      :title="title"
      flat="true"
      color="#ffffff"
      backgroundColor="#0a2329"
    >
      <ActionItem
        v-for="action in actions"
        :key="action.id"
        ios:ios.position="right"
        :text="action.text"
        @tap="$emit('action', action.id)"
      />
    </ActionBar>

    <GridLayout rows="auto, *" class="settings-container">
      <MaterialTopAppBar
        v-if="isAndroid"
        row="0"
        :search="search"
        :title="title"
        :hint="searchHint"
        :actions="actions"
        :navigationText="$L('nav.back')"
        @loaded="onTopAppBarLoaded"
        @navigationTap="goBack"
        @actionTap="$emit('action', actions[$event.index].id)"
      />

      <component
        row="1"
        :is="useScroll === 'true' ? 'ScrollView' : 'StackLayout'"
        :orientation="useScroll === 'true' ? 'vertical' : undefined"
      >
        <!-- iOS safe-area expansion stretches scroll content that ends near the bottom -->
        <StackLayout :style="contentInsetStyle" :iosOverflowSafeAreaEnabled="useScroll !== 'true'">
          <slot :bottomPadding="contentBottomPadding"></slot>
        </StackLayout>
      </component>

      <MaterialSearchView
        v-if="isAndroid && search"
        row="0"
        rowSpan="2"
        :hint="searchHint"
        @loaded="onSearchViewLoaded"
        @textChange="$emit('update:searchText', $event.value)"
        @stateChange="onSearchStateChange"
      >
        <StackLayout :style="contentInsetStyle">
          <slot name="searchResults" :bottomPadding="contentBottomPadding"></slot>
        </StackLayout>
      </MaterialSearchView>
    </GridLayout>
  </Page>
</template>

<script>
import { isAndroid } from '@nativescript/core';
import { attachBackHandler, detachBackHandler, goBack } from '@/utils/platform/navigation';
import {
  parseAndroidInsets,
  getStatusBarHeight,
  getNavigationBarHeight,
  attachIosSearchController,
  styleIosNavigationBar,
} from '@/utils/platform/ui';

export default {
  name: 'SettingsBase',

  props: {
    title: {
      type: String,
      default: '',
    },
    useScroll: {
      type: String,
      required: false,
      default: 'true',
    },
    search: {
      type: Boolean,
      default: false,
    },
    searchText: {
      type: String,
      default: '',
    },
    searchHint: {
      type: String,
      default: 'Search...',
    },
    // [{ id, text }]: text buttons at the trailing end of the bar
    actions: {
      type: Array,
      default: () => [],
    },
  },

  // searchActiveChange: iOS only, Android shows the results in its own search view
  emits: ['navigatedTo', 'navigatedFrom', 'update:searchText', 'searchActiveChange', 'action'],

  data() {
    return {
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
    goBack,

    onBack() {
      if (this.searchView?.isShowing) {
        this.searchView.hide();
      } else {
        goBack();
      }
    },

    onPageLoaded({ object: page }) {
      styleIosNavigationBar(page);
    },

    onNavigatingTo({ object: page }) {
      if (this.search && !this.iosSearch) {
        this.iosSearch = attachIosSearchController(page, {
          hint: this.searchHint,
          text: this.searchText,
          onTextChange: text => {
            if (text !== this.searchText) this.$emit('update:searchText', text);
          },
          onActiveChange: active => this.$emit('searchActiveChange', active),
        });
      }
    },

    onTopAppBarLoaded({ object }) {
      this.topAppBar = object;
      this.updateTopAppBarInsets();
      this.searchView?.setupWithSearchBar(object);
    },

    onSearchViewLoaded({ object }) {
      this.searchView = object;
      this.updateTopAppBarInsets();
      if (this.topAppBar) object.setupWithSearchBar(this.topAppBar);
    },

    // The query only lives while the search is open
    onSearchStateChange({ state }) {
      if (state === 'HIDDEN') {
        this.searchView.clearText();
        this.topAppBar?.bar?.clearText();
      }
    },

    updateTopAppBarInsets() {
      const insets = { top: this.statusBarInset, left: this.leftInset, right: this.rightInset };
      this.topAppBar?.setInsets(insets);
      this.searchView?.setInsets(insets);
    },

    onAndroidInset(args) {
      if (!isAndroid || !args?.inset) return;
      const insets = parseAndroidInsets(args.inset);

      if (insets.top > 0) this.statusBarInset = insets.top;
      this.navBarInset = insets.bottom;
      this.leftInset = insets.left;
      this.rightInset = insets.right;
      this.updateTopAppBarInsets();

      args.inset.topConsumed = true;
      args.inset.bottomConsumed = true;
      args.inset.leftConsumed = true;
      args.inset.rightConsumed = true;
      args.inset.imeBottomConsumed = true;
    },

    onNavigatedTo(event) {
      attachBackHandler(this.onBack);
      this.$emit('navigatedTo', event);
    },

    onNavigatedFrom(event) {
      detachBackHandler();
      this.$emit('navigatedFrom', event);
    },
  },

  created() {
    // On iOS the scroll views keep their content above the home indicator themselves
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

.settings-container {
  background-color: $surface;
}
</style>

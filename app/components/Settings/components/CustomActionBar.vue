// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="action-bar-wrapper">
    <!-- Search mode -->
    <GridLayout v-if="search" columns="*, auto" class="search-row">
      <GridLayout col="0" columns="48, *, auto" class="search-bar">
        <MDRipple col="0" class="back-button" @tap="goBack">
          <Label class="fa back-icon" :text="$filters.fonticon('fa-arrow-left')" />
        </MDRipple>
        <TextField
          ref="searchField"
          col="1"
          class="search-input"
          :hint="searchHint"
          :text="searchText"
          @textChange="$emit('update:searchText', $event.value)"
          @focus="onSearchFocus"
          @blur="onSearchBlur"
          @tap="onSearchFocus"
          returnKeyType="search"
        />
        <MDRipple
          col="2"
          :class="['clear-button', searchActive ? 'fade-in' : 'fade-out']"
          @tap="clearSearch"
        >
          <Label class="fa clear-icon" :text="$filters.fonticon('fa-times')" />
        </MDRipple>
      </GridLayout>
      <StackLayout
        v-if="$slots.default"
        ref="slotContainer"
        col="1"
        orientation="horizontal"
        verticalAlignment="center"
      >
        <slot></slot>
      </StackLayout>
    </GridLayout>

    <!-- Normal mode -->
    <GridLayout v-else columns="48, *, auto" class="normal-bar">
      <MDRipple col="0" class="back-button" @tap="goBack">
        <Label class="fa back-icon" :text="$filters.fonticon('fa-arrow-left')" />
      </MDRipple>
      <Label col="1" :text="title" class="action-bar-title" />
      <StackLayout col="2" orientation="horizontal" verticalAlignment="center">
        <slot></slot>
      </StackLayout>
    </GridLayout>
  </StackLayout>
</template>

<script>
import { Frame, Screen } from '@nativescript/core';

const ANIMATION_DURATION = 300;

export default {
  name: 'CustomActionBar',

  props: {
    title: {
      type: String,
      default: '',
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
  },

  emits: ['update:searchText'],

  data() {
    return {
      searchFocused: false,
    };
  },

  computed: {
    searchActive() {
      return this.searchFocused || !!this.searchText;
    },
  },

  watch: {
    searchActive(active) {
      this.animateSlot(active);
    },
  },

  methods: {
    goBack() {
      Frame.topmost().goBack();
    },

    onSearchFocus() {
      this.searchFocused = true;
    },

    onSearchBlur() {
      this.searchFocused = false;
    },

    clearSearch() {
      this.$emit('update:searchText', '');
      this.searchFocused = false;
      const field = this.$refs.searchField?.nativeView;
      if (field) {
        field.dismissSoftInput();
        if (field.android) {
          field.android.setFocusableInTouchMode(false);
          field.android.clearFocus();
          field.android.setFocusableInTouchMode(true);
        }
      }
    },

    animateSlot(hide) {
      const view = this.$refs.slotContainer?.nativeView;
      if (!view) return;

      const currentWidth = view.getMeasuredWidth() / Screen.mainScreen.scale;
      if (hide) this.slotOriginalWidth = currentWidth;

      const fromWidth = currentWidth;
      const toWidth = hide ? 0 : (this.slotOriginalWidth || 0);
      const fromOpacity = hide ? 1 : 0;
      const toOpacity = hide ? 0 : 1;
      const startTime = Date.now();

      const step = () => {
        const progress = Math.min((Date.now() - startTime) / ANIMATION_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        view.width = fromWidth + (toWidth - fromWidth) * eased;
        view.opacity = fromOpacity + (toOpacity - fromOpacity) * eased;

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.action-bar-wrapper {
  background-color: $surface;
}

.search-row {
  margin: $spacing-xs $spacing-s;
}

.search-bar {
  background-color: $surface-bright;
  border-radius: $radius-full;
}

.back-button {
  width: 48;
  height: 48;
  border-radius: 24;
  vertical-alignment: center;
  ripple-color: $ripple;
}

.back-icon {
  font-size: 20;
  color: $on-surface;
  text-align: center;
  vertical-alignment: center;
}

.action-bar-title {
  font-size: $font-size-headline;
  font-weight: 500;
  color: $on-surface;
  padding: $spacing-m 0;
  vertical-alignment: center;
}

.search-input {
  font-size: $font-size;
  color: $on-surface;
  placeholder-color: $on-surface-dark;
  background-color: transparent;
  border-bottom-width: 0;
  border-color: transparent;
  vertical-alignment: center;
  padding: 0;
  margin: 0;
}

.clear-button {
  width: 48;
  height: 48;
  border-radius: 24;
  vertical-alignment: center;
  ripple-color: $ripple;
  opacity: 0;
}

.fade-in {
  animation-name: fade-in;
  animation-duration: 0.3;
  animation-fill-mode: forwards;
}

.fade-out {
  animation-name: fade-out;
  animation-duration: 0.3;
  animation-fill-mode: forwards;
}

.clear-icon {
  font-size: 16;
  color: $on-surface-dark;
  text-align: center;
  vertical-alignment: center;
}
</style>

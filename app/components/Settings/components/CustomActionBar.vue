// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="action-bar-wrapper">
    <!-- Search mode -->
    <GridLayout v-if="search" columns="48, *, auto" class="search-bar">
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
        returnKeyType="search"
      />
      <MDRipple
        v-show="searchText"
        col="2"
        class="clear-button"
        @tap="$emit('update:searchText', '')"
      >
        <Label class="fa clear-icon" :text="$filters.fonticon('fa-times')" />
      </MDRipple>
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
import { Frame } from '@nativescript/core';

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

  methods: {
    goBack() {
      Frame.topmost().goBack();
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.action-bar-wrapper {
  background-color: $surface;
}

.search-bar {
  background-color: $surface-bright;
  border-radius: $radius-full;
  margin: $spacing-xs $spacing-s;
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
}

.clear-icon {
  font-size: 16;
  color: $on-surface-dark;
  text-align: center;
  vertical-alignment: center;
}
</style>

// Copyright (C) 2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout columns="48, *, auto" class="custom-action-bar">
    <MDRipple col="0" class="back-button" @tap="goBack">
      <Label class="fa back-icon" :text="$filters.fonticon('fa-arrow-left')" />
    </MDRipple>
    <Label col="1" :text="title" class="action-bar-title" />
    <StackLayout col="2" orientation="horizontal" verticalAlignment="center">
      <slot></slot>
    </StackLayout>
  </GridLayout>
</template>

<script>
import { Frame } from '@nativescript/core';

export default {
  name: 'CustomActionBar',

  props: {
    title: {
      type: String,
      required: true,
    },
  },

  methods: {
    goBack() {
      Frame.topmost().goBack();
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

.custom-action-bar {
  background-color: $surface;
  height: auto;
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
</style>

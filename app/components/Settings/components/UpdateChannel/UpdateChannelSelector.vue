// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout rows="auto" columns="*, *, *" class="channel-selector">
    <MDRipple
      col="0"
      class="list-item list-item--top-left list-item--bottom-left channel-button"
      :class="{ active: currentChannel === 'release' }"
      @tap="$emit('channelSelected', 'release')"
    >
      <Label text="Release" once="true" class="channel-button-text" />
    </MDRipple>
    <MDRipple
      col="1"
      class="list-item channel-button"
      :class="{ active: currentChannel === 'beta' }"
      @tap="$emit('channelSelected', 'beta')"
    >
      <Label text="Beta" once="true" class="channel-button-text" />
    </MDRipple>
    <MDRipple
      col="2"
      class="list-item list-item--top-right list-item--bottom-right channel-button"
      :class="{ active: currentChannel === 'custom' }"
      @tap="$emit('channelSelected', 'custom')"
    >
      <Label text="Custom" once="true" class="channel-button-text" />
    </MDRipple>
  </GridLayout>
</template>

<script>
import { MDButton } from '@nativescript-community/ui-material-button';

export default {
  name: 'UpdateChannelSelector',

  components: {
    MDButton
  },

  props: {
    currentChannel: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.channel-selector {
  padding-bottom: $spacing-m;
}

.channel-button {
  margin: 0;
  background-color: $elevation-level1;
  color: $on-surface;
  vertical-align: center;
  text-align: center;

  &.active {
    background-color: $primary;
    color: $on-primary;
  }
}

.channel-button-text {
  text-transform: uppercase;
  padding-bottom: 4;
}
</style>

// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <GridLayout rows="auto" columns="*, *, *" class="channel-selector">
    <MDButton
      col="0"
      class="channel-button"
      :class="{ active: currentChannel === 'release' }"
      text="Release"
      @tap="$emit('channelSelected', 'release')"
    />
    <MDButton
      col="1"
      class="channel-button"
      :class="{ active: currentChannel === 'beta' }"
      text="Beta"
      @tap="$emit('channelSelected', 'beta')"
    />
    <MDButton
      col="2"
      class="channel-button"
      :class="{ active: currentChannel === 'custom' }"
      text="Custom"
      @tap="$emit('channelSelected', 'custom')"
    />
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
  margin: 8 16;
}

.channel-button {
  margin: 0 4;
  background-color: $surface-variant;
  color: $on-surface;
  border-radius: 4;
  font-size: 14;

  &.active {
    background-color: $primary;
    color: $on-primary;
  }
}
</style>

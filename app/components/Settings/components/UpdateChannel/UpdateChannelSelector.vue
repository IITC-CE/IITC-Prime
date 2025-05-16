//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

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

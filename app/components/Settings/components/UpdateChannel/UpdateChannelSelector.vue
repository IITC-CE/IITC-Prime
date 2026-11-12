// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout>
    <GridLayout
      v-for="(option, index) in channelOptions"
      :key="option.id"
      class="list-item list-item--big list-item--two-line"
      :class="{
        'list-item--first': index === 0,
        'list-item--last': index === channelOptions.length - 1,
      }"
      columns="auto, *, auto"
      v-on="pressFeedback"
      @tap="$emit('channelSelected', option.id)"
    >
      <ContentView class="list-item-spacer" colSpan="3" />
      <RadioMark
        :col="isIOS ? 2 : 0"
        :checked="currentChannel === option.id"
        class="channel-mark"
        verticalAlignment="center"
      />
      <StackLayout col="1" class="list-item-text" verticalAlignment="center">
        <Label :text="option.title" class="list-item-title" />
        <Label :text="option.subtitle" class="list-item-subtitle" textWrap="true" />
      </StackLayout>
      <ContentView
        v-if="isIOS && index < channelOptions.length - 1"
        colSpan="3"
        class="list-separator"
      />
    </GridLayout>
  </StackLayout>
</template>

<script>
import { isIOS } from '@nativescript/core';
import { pressFeedback } from '@/utils/platform/ui';

export default {
  name: 'UpdateChannelSelector',

  props: {
    currentChannel: {
      type: String,
      required: true,
    },
  },

  data() {
    return { isIOS, pressFeedback };
  },

  computed: {
    channelOptions() {
      return [
        {
          id: 'release',
          title: this.$L('update_channel.release'),
          subtitle: this.$L('update_channel.release_sub'),
        },
        {
          id: 'beta',
          title: this.$L('update_channel.beta'),
          subtitle: this.$L('update_channel.beta_sub'),
        },
        {
          id: 'custom',
          title: this.$L('update_channel.custom'),
          subtitle: this.$L('update_channel.custom_sub'),
        },
      ];
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/app';

// The radio drawable is padded by 6: the circle 18 from the row edge and the text, the text on
// the M3 keyline at 56
.ns-android .channel-mark {
  margin-left: -4;
  margin-right: 12;
}
</style>

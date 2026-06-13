// Copyright (C) 2025-2026 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <StackLayout class="channel-selector">
    <MDRipple
      v-for="option in channelOptions"
      :key="option.id"
      class="channel-card"
      :class="{ 'channel-card--active': currentChannel === option.id }"
      @tap="$emit('channelSelected', option.id)"
    >
      <GridLayout columns="auto, *">
        <GridLayout
          col="0"
          class="radio-circle"
          :class="{ 'radio-circle--active': currentChannel === option.id }"
        >
          <StackLayout v-if="currentChannel === option.id" class="radio-dot" />
        </GridLayout>
        <StackLayout col="1">
          <Label :text="option.title" class="channel-title" />
          <Label :text="option.subtitle" class="channel-subtitle" textWrap="true" />
        </StackLayout>
      </GridLayout>
    </MDRipple>
  </StackLayout>
</template>

<script>
export default {
  name: 'UpdateChannelSelector',

  props: {
    currentChannel: {
      type: String,
      required: true,
    },
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

.channel-selector {
  padding-bottom: $spacing-m;
}

.channel-card {
  border-radius: $radius-large;
  border-width: 1;
  border-color: transparent;
  background-color: $surface-container;
  padding: $spacing-m;
  margin-bottom: $spacing-s;
  ripple-color: $ripple;

  &--active {
    background-color: $accent-container;
    border-color: $accent-border;
  }
}

.radio-circle {
  width: 20;
  height: 20;
  border-radius: 10;
  border-width: 1.5;
  border-color: $on-surface-variant;
  vertical-alignment: center;
  margin-right: $spacing-m;

  &--active {
    background-color: $accent;
    border-color: $accent;
  }
}

.radio-dot {
  width: 7;
  height: 7;
  border-radius: 4;
  background-color: $surface;
  horizontal-alignment: center;
  vertical-alignment: center;
}

.channel-title {
  font-size: $font-size-title;
  font-weight: bold;
  color: $on-surface;
  vertical-alignment: center;
}

.channel-subtitle {
  font-size: $font-size-small;
  color: $on-surface-variant;
  margin-top: $spacing-xxs;
}
</style>

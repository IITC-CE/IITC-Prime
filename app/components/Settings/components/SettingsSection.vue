// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Label :text="title" class="settings-section-title" once="true" />
</template>

<script>
export default {
  name: 'SettingsSection',

  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.settings-section-title {
  padding: $spacing-s $spacing-m;
  margin-top: $spacing-xs;
  color: $primary-light;
  font-size: $font-size-small;
  font-weight: bold;
  text-transform: uppercase;
}
</style>

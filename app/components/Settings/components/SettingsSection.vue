// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

<template>
  <Label :text="title" class="section-header" once="true" />
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
</style>

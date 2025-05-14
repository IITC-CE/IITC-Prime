//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout class="settings-section">
    <Label :text="title" class="settings-section-title" />
    <slot></slot>
  </StackLayout>
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

.settings-section {
  margin-bottom: 16;
}

.settings-section-title {
  padding: 8 16;
  color: $primary-light;
  font-size: $font-size-small;
  font-weight: bold;
  text-transform: uppercase;
}
</style>

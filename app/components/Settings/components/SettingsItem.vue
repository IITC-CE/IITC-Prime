//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <GridLayout
    class="settings-item"
    columns="*, auto"
    rows="auto"
    @tap="$emit('tap')"
  >
    <StackLayout col="0" verticalAlignment="center">
      <Label :text="title" class="settings-item-title" />
      <Label
        v-if="description"
        :text="description"
        class="settings-item-description"
        textWrap="true"
      />
    </StackLayout>

    <ContentView col="1" verticalAlignment="center">
      <slot name="right"></slot>
    </ContentView>
  </GridLayout>
</template>

<script>
export default {
  name: 'SettingsItem',

  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.settings-item {
  padding: 12 16;
  background-color: $surface-bright;
  border-bottom-width: 1;
  border-bottom-color: $surface-variant;
}

.settings-item-title {
  color: $on-surface;
  font-size: $font-size;
  font-weight: 500;
}

.settings-item-description {
  color: $surface-variant;
  font-size: $font-size-small;
  margin-top: 4;
}
</style>

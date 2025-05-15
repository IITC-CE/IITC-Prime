//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout
    class="category-tag"
    :class="{ active: isActive, 'has-new': hasNew }"
    @tap="$emit('tap')"
  >
    <Label :text="name" class="tag-label" />
    <ContentView v-if="hasNew" class="new-indicator" />
  </StackLayout>
</template>

<script>
export default {
  name: 'CategoryTag',

  props: {
    name: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    hasNew: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped lang="scss">
@import '@/app';

.category-tag {
  margin: 4;
  padding: 6 12;
  border-radius: 16;
  background-color: $surface-variant;
  border-width: 1;
  border-color: $surface-variant;
}

.category-tag.active {
  background-color: $primary-light;
  border-color: $primary;
}

.tag-label {
  color: $on-surface;
  font-size: $font-size-small;
}

.category-tag.active .tag-label {
  color: $on-primary;
  font-weight: bold;
}

.new-indicator {
  position: absolute;
  top: -3;
  right: -3;
  width: 7;
  height: 7;
  border-radius: 4;
  background-color: yellow;
  border-width: 1;
  border-color: rgba(0, 0, 0, 0.1);
}
</style>

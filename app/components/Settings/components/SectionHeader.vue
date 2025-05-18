//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <Label :text="title" class="section-header-title" once="true" />
</template>

<script>
export default {
  name: 'SectionHeader',

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

.section-header-title {
  padding: 8 16;
  color: $primary-light;
  font-size: $font-size-small;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 0;
}
</style>

<template>
  <StackLayout class="appbar_wrapper">
    <FlexboxLayout class="appbar_container" @tap="runIITC"></FlexboxLayout>
  </StackLayout>
</template>

<script>
  import { eventBus } from '~/app'

  export default {
    data() {
      return {}
    },
    methods: {
      runIITC() {
        eventBus.$emit('init-iitc')
      }
    }
  }
</script>

<style scoped lang="scss">
  @import '../app';

  .appbar_wrapper {
    left: 0;
    height: 200gd;
    padding: 12gd 12gd 0 12gd;
  }

  .appbar_container {
    width: 100%;
    height: 48gd;
    background-color: $accent;
    border-color: rgba(255, 255, 255, 0.2);
    border-width: 1px;
    border-radius: 8gd;
    box-shadow: 0 1gd 4gd rgba(0, 0, 0, 0.6);
  }
</style>

<template>
  <StackLayout class="appbar_wrapper">
    <FlexboxLayout class="appbar_container"></FlexboxLayout>
  </StackLayout>
</template>

<script>
  export default {
    data() {
      return {}
    },
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
    border-radius: 8gd;
    box-shadow: 0 1gd 4gd rgba(0, 0, 0, 0.6);
  }
</style>

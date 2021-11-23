<template>
  <StackLayout class="appbar_wrapper">
    <FlexboxLayout class="appbar_container" @tap="runIITC"></FlexboxLayout>
  </StackLayout>
</template>

<script>
  import Vue from 'vue';
  import { NativeScriptVue } from 'nativescript-vue';
  import LayersView from './LayersView';

  export default Vue.extend({
    data() {
      return {}
    },
    methods: {
      runIITC() {
        const options = {};
        this.$showBottomSheet(LayersView, {
          transparent: true,
          skipCollapsedState: true,
          closeCallback: (args) => {
            console.log('bottom sheet closed', args);
          }
        });
      }
    }
  });
</script>

<style scoped lang="scss">
  @import '../app';

  .appbar_wrapper {
    left: 0;
    height: 200;
    padding: 12 12 0 12;
  }

  .appbar_container {
    width: 100%;
    height: 48;
    background-color: $base;
    border-color: $complementary;
    border-width: 1;
    border-radius: 8;
    box-shadow: 0 1 4 rgba(0, 0, 0, 0.6);
  }
</style>

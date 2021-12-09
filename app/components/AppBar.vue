//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <StackLayout class="appbar_wrapper" :width="appbar_width">
    <FlexboxLayout class="appbar_container">
      <AppBarButton name="fa-bars"></AppBarButton>

      <FlexboxLayout class="expander"></FlexboxLayout>

      <AppBarButton name="fa-search"></AppBarButton>
      <AppBarButton name="fa-location-arrow"></AppBarButton>
      <AppBarButton @tap="openLayersView" name="fa-layer-group"></AppBarButton>
    </FlexboxLayout>
  </StackLayout>
</template>

<script>
  import Vue from 'vue';
  import { NativeScriptVue } from 'nativescript-vue';
  import LayersView from './LayersView';

  import AppBarButton from './AppBarButton';

  export default {
    data() {
      return {
        appbar_width: this.$store.state.appbar_width,
        bgColor: false
      }
    },
    components: { AppBarButton },
    methods: {
      openLayersView() {
        console.log(this.appbar_width);
        this.$showBottomSheet(LayersView, {
          transparent: true,
          skipCollapsedState: true,
          closeCallback: (args) => {
            console.log('bottom sheet closed', args);
          }
        });
      }
    },

    async created() {
      this.store_unsubscribe = this.$store.subscribeAction({
        after: async (action, state) => {
          switch (action.type) {
            case "setAppBarWidth":
              this.appbar_width = action.payload;
              break;
          }
        }
      })
    },

    onDestroy() {
      this.store_unsubscribe();
    }
  };
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

  .expander {
    width: 100%;
  }
</style>

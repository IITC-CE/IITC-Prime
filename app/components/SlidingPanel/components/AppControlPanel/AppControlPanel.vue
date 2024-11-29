//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <FlexboxLayout
    class="app-control-panel"
    width="100%"
    :height="maxHeight"
    flexDirection="column">

    <!-- buttons -->
    <FlexboxLayout class="appbar_container">
      <AppBarButton @tap="openQuickAccessView" icon="fa-bars"></AppBarButton>

      <FlexboxLayout class="expander"></FlexboxLayout>

      <AppBarButton icon="fa-search"></AppBarButton>
      <AppBarButton icon="fa-location-arrow"></AppBarButton>
      <AppBarButton @tap="openLayersView" icon="fa-layer-group"></AppBarButton>
    </FlexboxLayout>

    <!-- content -->
    <StackLayout
      class="panel-body"
      flexGrow="1">
      <Label text="content" />
    </StackLayout>
  </FlexboxLayout>
</template>

<script>
import AppBarButton from "@/components/AppBarButton.vue";
import QuickAccessView from "@/components/QuickAccessView.vue";
import LayersView from "@/components/LayersView.vue";
import userLocation from "@/utils/user-location";

export default {
  name: 'AppControlPanel',

  components: { AppBarButton },

  props: {
    maxHeight: {
      type: Number,
      required: true
    }
  },

  data() {
    return {
      location: new userLocation(),
    }
  },

  methods: {
    openQuickAccessView() {
      if (this.$store.state.is_opened_bottom_sheet) return;
      this.$store.dispatch('setIsOpenedBottomSheet', true);
      this.$showBottomSheet(QuickAccessView, {
        transparent: true,
        skipCollapsedState: true,
        closeCallback: () => {
          this.$store.dispatch('setIsOpenedBottomSheet', false);
        }
      });
    },
    openLayersView() {
      if (this.$store.state.is_opened_bottom_sheet) return;
      this.$store.dispatch('setIsOpenedBottomSheet', true);
      this.$showBottomSheet(LayersView, {
        transparent: true,
        skipCollapsedState: true,
        closeCallback: () => {
          this.$store.dispatch('setIsOpenedBottomSheet', false);
        }
      });
    },
    onLocate() {
      this.location.locate();
    }
  },
}
</script>

<style scoped lang="scss">
@import '@/app';

.app-control-panel {
  background-color: $base;
  color: $text;
  border-radius: 10 10 0 0;
  border-color: $complementary;
  border-top-width: 1;
}

.panel-header {
  height: 50;
  justify-content: space-around;
}

.panel-body {
}

.expander {
  width: 100%;
}
</style>

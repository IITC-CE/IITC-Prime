//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout :width="panelWidth">
    <FlexboxLayout
      ref="panel"
      class="sliding-panel"
      :top="panelCurrentTop"
      :height="panelHeight"
      @pan="handlePanGesture">

      <AppControlPanel
        :max-height="appControlPanelMaxHeight"
      />

    </FlexboxLayout>
    <MapStateBar
      :top="screenHeight - mapStateBarHeight"
      width="100%"
      :height="mapStateBarHeight"
      class="map-state-bar"
    />
  </AbsoluteLayout>
</template>

<script>
import AppControlPanel from './components/AppControlPanel/AppControlPanel.vue';
import MapStateBar from "./MapStateBar.vue";
import { slideAnimationMixin } from "./mixins/slideAnimation";
import { panelPositionMixin } from "./mixins/panelPosition";
import { panelGestureMixin } from "./mixins/panelGesture";

export default {
  name: 'SlidingPanel',

  mixins: [slideAnimationMixin, panelPositionMixin, panelGestureMixin],

  components: {
    AppControlPanel,
    MapStateBar
  },

  data() {
    return {
      // Screen dimensions
      screenHeight: this.$store.state.ui.screenHeight,

      // Map state bar
      mapStateBarHeight: 46,

      // Panel configuration
      panelVisibleHeight: 110,
      panelHeight: 0,
      panelWidth: this.$store.state.ui.slidingPanelWidth,
    };
  },

  methods: {
    handleScreenHeightChange(newHeight) {
      this.screenHeight = newHeight;
      this.updatePanelPositions();
    },
  },

  computed: {
    appControlPanelMaxHeight() {
      return this.panelHeight - this.mapStateBarHeight;
    }
  },

  created() {
    this.updatePanelPositions();

    this.store_unsubscribe = this.$store.subscribeAction({
      after: async (action, state) => {
        switch (action.type) {
          case "ui/setScreenHeight":
            this.handleScreenHeightChange(action.payload);
            break;
          case "ui/setSlidingPanelWidth":
            this.panelWidth = action.payload;
            break;
        }
      }
    })
  },

  onDestroy() {
    this.store_unsubscribe();
  },
};
</script>

<style scoped lang="scss">
.sliding-panel {
  width: 100%;
}
</style>

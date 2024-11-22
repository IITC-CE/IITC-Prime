//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout :width="panelWidth">
    <FlexboxLayout
      ref="panel"
      class="sliding-panel"
      :top="panelCurrentTop"
      :height="panelHeight"
      @pan="onPan">

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
import AppControlPanel from './AppControlPanel.vue';
import MapStateBar from "./MapStateBar.vue";
import { slideAnimationMixin } from "./mixins/slideAnimation";
import { panelPositionMixin } from "./mixins/panelPosition";
import { PanelPositions } from "@/components/SlidingPanel/constants/panelPositions";

export default {
  name: 'SlidingPanel',

  mixins: [slideAnimationMixin, panelPositionMixin],

  components: {
    AppControlPanel,
    MapStateBar
  },

  data() {
    return {
      // Screen dimensions
      screenHeight: this.$store.state.screen_height,

      // Map state bar
      mapStateBarHeight: 46,

      // Panel configuration
      panelVisibleHeight: 110,
      panelHeight: 0,
      panelWidth: this.$store.state.sliding_panel_width,
    };
  },

  methods: {
    onPan(args) {
      if (this.isAnimating) {
        this.cancelAnimation();
      }

      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      if (args.state === 1) { // Pan start
        this.startTop = panel.top;
        this.panelCurrentTop = panel.top;
      } else if (args.state === 2) { // Pan in progress
        const newTop = this.startTop + args.deltaY;

        // Limit panel movement within bounds
        if (newTop >= PanelPositions.TOP.value && newTop <= PanelPositions.BOTTOM.value) {
          panel.top = newTop;
          this.panelCurrentTop = newTop;
        }
      } else if (args.state === 3) { // Pan end
        this.panelCurrentTop = panel.top;
        this.snapPanel();
      }
    },

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
          case "setScreenHeight":
            this.handleScreenHeightChange(action.payload);
            break;
          case "setSlidingPanelWidth":
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

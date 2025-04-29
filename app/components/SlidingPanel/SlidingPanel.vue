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
import { layoutService } from '~/utils/layout-service';

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
      screenHeight: this._getScreenHeight(),

      // Map state bar
      mapStateBarHeight: 46,

      // Panel configuration
      panelVisibleHeight: 110,
      panelHeight: 0,
      panelWidth: this._getPanelWidth(),
    };
  },

  methods: {
    /**
     * Get screen height from best available source
     */
    _getScreenHeight() {
      if (layoutService.isInitialized) {
        return layoutService.dimensions.availableHeight;
      }
      return this.$store.state.ui.screenHeight;
    },

    /**
     * Get panel width from best available source
     */
    _getPanelWidth() {
      if (layoutService.isInitialized) {
        return layoutService.dimensions.panelWidth;
      }
      return this.$store.state.ui.slidingPanelWidth;
    },

    /**
     * Handle layout changes from layout service
     */
    handleLayoutChange(event) {
      const { dimensions } = event;

      // Update with the measured height directly
      this.screenHeight = dimensions.availableHeight;
      this.panelWidth = dimensions.panelWidth;

      this.updatePanelPositions();
    },
  },

  computed: {
    appControlPanelMaxHeight() {
      return this.panelHeight - this.mapStateBarHeight;
    }
  },

  created() {
    // Initialize panel positions
    this.updatePanelPositions();

    // Subscribe to layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChange);

    // Keep store subscription for backward compatibility
    this.store_unsubscribe = this.$store.subscribeAction({
      after: async (action, state) => {
        switch (action.type) {
          case "ui/setScreenHeight":
            if (!layoutService.isInitialized) {
              this.screenHeight = action.payload;
              this.updatePanelPositions();
            }
            break;
          case "ui/setSlidingPanelWidth":
            if (!layoutService.isInitialized) {
              this.panelWidth = action.payload;
            }
            break;
        }
      }
    });
  },

  beforeDestroy() {
    if (this.store_unsubscribe) {
      this.store_unsubscribe();
    }

    if (this.removeLayoutListener) {
      this.removeLayoutListener();
    }
  }
};
</script>

<style scoped lang="scss">
.sliding-panel {
  width: 100%;
}
</style>

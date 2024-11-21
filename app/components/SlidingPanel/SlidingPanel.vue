//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout class="layer">
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
import { CoreTypes } from "@nativescript/core";
import { Animation } from "@nativescript/core";

import AppControlPanel from './AppControlPanel.vue';
import MapStateBar from "./MapStateBar.vue";

// Panel position constants
const PanelPosition = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom'
};

export default {
  name: 'SlidingPanel',

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
      appControlPanelMaxHeight: 0,

      // Position constants
      position: PanelPosition.BOTTOM,
      positions: {
        top: 50,           // Top position
        middle: 0,         // Will be calculated: screenHeight/2
        bottom: 0          // Will be calculated: screenHeight - panelVisibleHeight
      },

      // Current panel state
      panelCurrentTop: 0,
      startTop: 0,
      lastTop: undefined,

      // Snap thresholds
      snapThresholds: {
        middleToBottom: 0, // Will be calculated
        topToMiddle: 0     // Will be calculated
      },

      // Animation control
      animationRunning: false,
      animationSet: undefined,
    };
  },

  methods: {
    moveToPosition(position) {
      let targetTop;
      switch (position) {
        case PanelPosition.TOP:
          targetTop = this.positions.top;
          break;
        case PanelPosition.MIDDLE:
          targetTop = this.positions.middle;
          break;
        case PanelPosition.BOTTOM:
          targetTop = this.positions.bottom;
          break;
      }
      this.animatePanel(targetTop);
    },

    snapPanel() {
      // Determine target position based on current location and movement
      let targetTop = this.positions.middle;
      let targetPosition = PanelPosition.MIDDLE;

      if (this.lastTop === this.positions.top &&
          this.panelCurrentTop < this.positions.middle &&
          this.panelCurrentTop - this.positions.top >= this.snapThresholds.topToMiddle) {
        targetTop = this.positions.middle;
        targetPosition = PanelPosition.MIDDLE;
      } else if (this.lastTop === this.positions.bottom &&
                this.panelCurrentTop > this.positions.middle &&
                this.positions.bottom - this.panelCurrentTop >= this.snapThresholds.middleToBottom) {
        targetTop = this.positions.middle;
        targetPosition = PanelPosition.MIDDLE;
      } else if (this.panelCurrentTop >= this.positions.middle &&
                this.panelCurrentTop - this.positions.middle >= this.snapThresholds.middleToBottom) {
        targetTop = this.positions.bottom;
        targetPosition = PanelPosition.BOTTOM;
      } else if (this.panelCurrentTop < this.positions.middle &&
                this.positions.middle - this.panelCurrentTop >= this.snapThresholds.topToMiddle) {
        targetTop = this.positions.top;
        targetPosition = PanelPosition.TOP;
      }

      this.position = targetPosition;

      this.lastTop = targetTop;
      this.animatePanel(targetTop);
    },

    animatePanel(targetTop) {
      const panelNativeView = this.$refs.panel?.nativeView;

      if (panelNativeView && !this.animationRunning) {
        this.animationRunning = true;
        const translateY = targetTop - this.panelCurrentTop;

        // Animate panel movement
        this.animationSet = new Animation([
          {
            target: panelNativeView,
            translate: { x: 0, y: translateY },
            duration: 300,
            curve: CoreTypes.AnimationCurve.easeInOut,
          }
        ])

        this.animationSet.play()
          .then(() => {
            if (this.animationRunning) {
              this.panelCurrentTop = targetTop;
              this.animationRunning = false;
            }
            panelNativeView.translateY = 0;
          })
          .catch((error) => {
            console.error("Animation error:", error);
            this.animationRunning = false;
          });
      }
    },

    onPan(args) {
      if (this.animationRunning) {
        this.animationRunning = false;
        this.animationSet.cancel();
      }

      if (args.state === 1) { // Pan start
        this.startTop = this.panelCurrentTop;
      } else if (args.state === 2) { // Pan in progress
        const newTop = this.startTop + args.deltaY;

        // Limit panel movement within bounds
        if (newTop >= this.positions.top && newTop <= this.positions.bottom) {
          this.panelCurrentTop = newTop;
          this.$refs.panel.nativeView.translateY = 0;
          this.$refs.panel.nativeView.top = newTop;
        }
      } else if (args.state === 3) { // Pan end
        this.snapPanel();
      }
    },

    updatePanelPositions() {
      // Update key points
      this.positions.bottom = this.screenHeight - this.panelVisibleHeight;
      this.positions.middle = this.screenHeight / 2;

      // Recalculate snap thresholds
      this.snapThresholds.middleToBottom = (this.positions.bottom - this.positions.middle) / 5;
      this.snapThresholds.topToMiddle = (this.positions.middle - this.positions.top) / 5;

      // Set initial panel configuration
      this.panelHeight = this.screenHeight - this.positions.top;
      this.lastTop = this.positions.bottom;
      this.panelCurrentTop = this.positions.bottom;

      // Move the panel to the current position
      this.moveToPosition(this.position);
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

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout class="layer">
    <GridLayout
      ref="panel"
      class="sliding-panel"
      rows="auto, *"
      :top="panelCurrentTop"
      :height="panelHeight"
      @pan="onPan">

      <StackLayout orientation="horizontal" row="0">
        <Button text="button 1" />
        <Button text="button 2" />
        <Button text="button 3" />
      </StackLayout>

      <StackLayout row="1">
        <Label text="content" />

      </StackLayout>
    </GridLayout>
  </AbsoluteLayout>
</template>

<script>
import { Screen } from '@nativescript/core/platform';
import { CoreTypes } from "@nativescript/core";
import { Animation } from "@nativescript/core";

// Panel position constants
const PanelPosition = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom'
};

export default {
  name: 'SlidingPanel',

  props: {
    // Current panel position (controlled from parent)
    position: {
      type: String,
      default: PanelPosition.BOTTOM,
      validator: (value) => Object.values(PanelPosition).includes(value)
    }
  },

  data() {
    return {
      // Screen dimensions
      screenHeight: Screen.mainScreen.heightDIPs,

      // Panel configuration
      panelVisibleHeight: 60,
      panelHeight: 0,

      // Position constants
      positions: {
        top: 50,           // Top position
        middle: 0,         // Will be calculated: bottom position - middleOffset
        bottom: 0          // Will be calculated: screenHeight - panelVisibleHeight
      },

      middleOffset: 200,   // Offset from bottom for middle position

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

  watch: {
    // Watch for position changes from parent
    position(newPosition) {
      this.moveToPosition(newPosition);
    }
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

      if (this.lastTop === this.positions.top &&
          this.panelCurrentTop < this.positions.middle &&
          this.panelCurrentTop - this.positions.top >= this.snapThresholds.topToMiddle) {
        targetTop = this.positions.middle;
      } else if (this.lastTop === this.positions.bottom &&
                this.panelCurrentTop > this.positions.middle &&
                this.positions.bottom - this.panelCurrentTop >= this.snapThresholds.middleToBottom) {
        targetTop = this.positions.middle;
      } else if (this.panelCurrentTop >= this.positions.middle &&
                this.panelCurrentTop - this.positions.middle >= this.snapThresholds.middleToBottom) {
        targetTop = this.positions.bottom;
      } else if (this.panelCurrentTop < this.positions.middle &&
                this.positions.middle - this.panelCurrentTop >= this.snapThresholds.topToMiddle) {
        targetTop = this.positions.top;
      }

      this.lastTop = targetTop;
      this.animatePanel(targetTop);

      // Emit current position to parent
      const position = this.getPositionByTop(targetTop);
      this.$emit('update:position', position);
    },

    getPositionByTop(top) {
      if (top === this.positions.top) return PanelPosition.TOP;
      if (top === this.positions.middle) return PanelPosition.MIDDLE;
      return PanelPosition.BOTTOM;
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
  },

  created() {
    // Calculate initial positions and thresholds
    this.positions.bottom = this.screenHeight - this.panelVisibleHeight;
    this.positions.middle = this.positions.bottom - this.middleOffset;

    // Calculate snap thresholds (1/5 of distance between positions)
    this.snapThresholds.middleToBottom = (this.positions.bottom - this.positions.middle) / 5;
    this.snapThresholds.topToMiddle = (this.positions.middle - this.positions.top) / 5;

    // Set initial panel configuration
    this.panelHeight = this.screenHeight - this.positions.top;
    this.lastTop = this.positions.bottom;
    this.panelCurrentTop = this.positions.bottom;
  },
};
</script>

<style scoped lang="scss">
.sliding-panel {
  background-color: #ccc;
  width: 100%;
  border-top-width: 1;
  border-color: black;
  position: absolute;
}
</style>

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
      :panel-ref="this"
    />
  </AbsoluteLayout>
</template>

<script>
import AppControlPanel from './components/AppControlPanel/AppControlPanel.vue';
import MapStateBar from "./MapStateBar.vue";
import { panelControllerMixin } from "./mixins/panelController";
import { layoutService } from '~/utils/layout-service';
import { PanelPositions } from './constants/panelPositions';
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  name: 'SlidingPanel',

  mixins: [panelControllerMixin],

  components: {
    AppControlPanel,
    MapStateBar
  },

  props: {
    /**
     * Controls if the panel is currently visible in the UI
     * Used to ensure state synchronization when visibility changes
     */
    isVisible: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      screenHeight: this._getScreenHeight(),
      lastCommandTimestamp: 0,
      panelCurrentTop: 0
    };
  },

  computed: {
    appControlPanelMaxHeight() {
      return this.panelHeight - this.mapStateBarHeight;
    },

    ...mapState({
      activePanel: state => state.ui.activePanel,
      panelCommand: state => state.ui.panelCommand,
      isPanelOpen: state => state.ui.isPanelOpen,
      storePanelPosition: state => state.ui.panelPosition,
      panelPositionValue: state => state.ui.panelPositionValue,
      panelPositionValues: state => state.ui.panelPositionValues,
      mapStateBarHeight: state => state.ui.mapStateBarHeight,
      panelHeight: state => state.ui.panelHeight,
      panelWidth: state => state.ui.slidingPanelWidth,
      panelVisibleHeight: state => state.ui.panelVisibleHeight,
      isLandscapeOrientation: state => state.ui.isLandscapeOrientation
    }),

    ...mapGetters({
      isPanelClosed: 'ui/isPanelClosed',
      getPanelPositionValue: 'ui/getPanelPositionValue'
    }),

    // Check if panel is closed
    isPanelClosedLocal() {
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return true;

      const tolerance = 10;
      const bottomValue = PanelPositions.BOTTOM.value;

      return Math.abs(panel.top - bottomValue) < tolerance;
    }
  },

  watch: {
    // Watch for panel commands
    panelCommand: {
      handler(command) {
        if (!command || !command.action || command.timestamp <= this.lastCommandTimestamp) {
          return;
        }

        this.lastCommandTimestamp = command.timestamp;

        switch (command.action) {
          case 'open':
            this.handleOpenCommand();
            break;

          case 'close':
            this.handleCloseCommand();
            break;
        }
      },
      deep: true
    },

    /**
     * Handle panel visibility changes
     * Force panel to closed state when becoming visible after debug mode
     * This ensures consistent behavior when exiting debug mode
     */
    isVisible(newValue, oldValue) {
      // Only handle the case when panel becomes visible after being hidden
      if (newValue && !oldValue) {
        // Force panel to closed state when reappearing after debug mode
        this.$nextTick(() => {
          // Update store state
          this.setPanelOpenState(false);

          // Force correct DOM position
          const panel = this.$refs.panel?.nativeView;
          if (panel) {
            const targetTop = PanelPositions.BOTTOM.value;
            panel.top = targetTop;
            this.panelCurrentTop = targetTop;
          }

          // Reset position tracking
          this.position = 'BOTTOM';
          this.lastTop = PanelPositions.BOTTOM.value;

          this.setPanelPosition({
            position: 'BOTTOM',
            value: PanelPositions.BOTTOM.value
          });
        });
      }
    },

    // Sync store panel position with local state
    storePanelPosition(newPosition) {
      // Only update if different to avoid loops
      if (this.position !== newPosition) {
        this.position = newPosition;
      }
    }
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      setPanelOpenState: 'ui/setPanelOpenState',
      closePanel: 'ui/closePanel',
      setPanelPosition: 'ui/setPanelPosition',
      setPanelPositionValues: 'ui/setPanelPositionValues',
      setLandscapeOrientation: 'ui/setLandscapeOrientation',
      setMapStateBarHeight: 'ui/setMapStateBarHeight',
      setPanelHeight: 'ui/setPanelHeight',
      setScreenHeight: 'ui/setScreenHeight',
      setSlidingPanelWidth: 'ui/setSlidingPanelWidth',
      setPanelVisibleHeight: 'ui/setPanelVisibleHeight',
      storeUpdatePanelPositions: 'ui/updatePanelPositions'
    }),

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
     * Handle layout changes from layout service
     */
    handleLayoutChange(event) {
      const { dimensions } = event;

      // Update local screen height
      this.screenHeight = dimensions.availableHeight;

      // Update store dimensions
      this.setScreenHeight(dimensions.availableHeight);
      this.setSlidingPanelWidth(dimensions.panelWidth);
      this.setMapStateBarHeight(46); // Fixed value

      // Handle orientation change
      const previousOrientation = this.isLandscapeOrientation;
      this.setLandscapeOrientation(dimensions.isLandscape);

      if (previousOrientation !== dimensions.isLandscape) {
        // When changing orientation, close the panel
        this.closePanel();

        if (dimensions.isLandscape && this.position === 'MIDDLE') {
          this.moveToPosition('TOP');
        }
      }

      // Update panel dimensions and positions
      this.updatePanelPositions();
    },

    /**
     * Update panel positions based on screen dimensions
     */
    updatePanelPositions() {
      // Calculate positions
      const bottomPosition = this.screenHeight - this.panelVisibleHeight;
      const middlePosition = this.screenHeight / 2;
      const topPosition = 50; // Fixed

      // Update position values locally first
      PanelPositions.BOTTOM.value = bottomPosition;
      PanelPositions.MIDDLE.value = middlePosition;
      PanelPositions.TOP.value = topPosition;

      // Update snap thresholds
      this.snapThresholds = {
        middleToBottom: (bottomPosition - middlePosition) / 5,
        topToMiddle: (middlePosition - topPosition) / 5
      };

      // Update state machine
      this.updateStateMachineSettings();

      // Update local position tracking
      this.lastTop = bottomPosition;

      // If panel is at bottom, update local current top
      if (this.position === 'BOTTOM') {
        this.panelCurrentTop = bottomPosition;

        // Also update DOM directly if component is mounted
        if (this.$refs.panel?.nativeView) {
          this.$refs.panel.nativeView.top = bottomPosition;
        }
      }

      // Update position values in store
      this.setPanelPositionValues({
        BOTTOM: bottomPosition,
        MIDDLE: middlePosition,
        TOP: topPosition
      });

      // Update panel dimensions in store
      this.setPanelHeight(this.screenHeight - topPosition);

      // Update panel position in store if needed
      if (this.storePanelPosition === 'BOTTOM') {
        this.setPanelPosition({
          position: 'BOTTOM',
          value: bottomPosition
        });
      }
    },

    /**
     * Handle open panel command
     */
    async handleOpenCommand() {
      // Skip if panel is already open or animation is in progress
      if (!this.isPanelClosedLocal || this.isAnimationLocked) {
        return;
      }

      // Get target position from state machine based on orientation
      const targetPosition = this.stateMachine.getOpenPosition();

      // Use the unified moveToPosition method
      await this.moveToPosition(targetPosition);

      // If active panel is not set, default to 'quick'
      if (this.activePanel === null) {
        await this.setActivePanel('quick');
      }
    },

    /**
     * Handle close panel command
     */
    async handleCloseCommand() {
      // Skip if panel is already closed
      if (this.isPanelClosedLocal || this.isAnimationLocked) {
        return;
      }

      // Use the unified moveToPosition method
      await this.moveToPosition('BOTTOM');

      // Update panel open state and active panel
      await this.setPanelOpenState(false);
      await this.setActivePanel('quick');
    }
  },

  created() {
    // Initialize store values
    this.setMapStateBarHeight(46);
    this.setPanelVisibleHeight(110);

    // Initialize panel positions
    this.updatePanelPositions();

    // Initialize local panel position from calculated bottom position
    this.panelCurrentTop = PanelPositions.BOTTOM.value;

    // Initialize state machine with current state
    this.position = 'BOTTOM';

    // Initialize orientation
    this.setLandscapeOrientation(layoutService.dimensions.isLandscape);

    // Listen for layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChange);
  },

  mounted() {
    // Ensure panel is at correct position when mounted
    this.$nextTick(() => {
      const panel = this.$refs.panel?.nativeView;
      if (panel) {
        panel.top = this.panelCurrentTop;
      }
    });
  },

  beforeDestroy() {
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

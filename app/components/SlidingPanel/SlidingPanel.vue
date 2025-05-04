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
      // Screen dimensions
      screenHeight: this._getScreenHeight(),

      // Map state bar
      mapStateBarHeight: 46,

      // Panel configuration
      panelVisibleHeight: 110,
      panelHeight: 0,
      panelWidth: this._getPanelWidth(),

      // Track if screen is in landscape orientation
      isLandscapeOrientation: false,

      // Track last processed command
      lastCommandTimestamp: 0
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
      storePanelPositionValue: state => state.ui.panelPositionValue,
      panelPositionValues: state => state.ui.panelPositionValues
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

            // Update position in Vuex
            this.setPanelPosition({
              position: 'BOTTOM',
              value: targetTop
            });
          }

          // Reset position tracking
          this.position = 'BOTTOM';
          this.lastTop = PanelPositions.BOTTOM.value;
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
      setLandscapeOrientation: 'ui/setLandscapeOrientation'
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

      // Update local dimensions
      this.screenHeight = dimensions.availableHeight;
      this.panelWidth = dimensions.panelWidth;

      // Update store dimensions
      this.$store.dispatch('ui/setScreenHeight', dimensions.availableHeight);
      this.$store.dispatch('ui/setSlidingPanelWidth', dimensions.panelWidth);

      // Handle orientation change
      const previousOrientation = this.isLandscapeOrientation;
      this.isLandscapeOrientation = dimensions.isLandscape;
      this.setLandscapeOrientation(dimensions.isLandscape);

      if (previousOrientation !== dimensions.isLandscape) {
        this.updatePanelTransitions();

        // When changing orientation, close the panel
        this.closePanel();

        if (dimensions.isLandscape && this.position === 'MIDDLE') {
          this.moveToPosition('TOP');
        }
      }

      // Update panel dimensions and positions
      this.updatePanelPositions();
      this.updateStorePositions();
    },

    /**
     * Update panel position values in store
     */
    updateStorePositions() {
      // Calculate position values based on screen size
      const positionValues = {
        TOP: PanelPositions.TOP.value,
        MIDDLE: PanelPositions.MIDDLE.value,
        BOTTOM: PanelPositions.BOTTOM.value
      };

      // Update store with current position values
      this.setPanelPositionValues(positionValues);

      // Also update current position value if needed
      this.setPanelPosition({
        position: this.position,
        value: positionValues[this.position]
      });
    },

    /**
     * Update panel transitions based on screen orientation
     */
    updatePanelTransitions() {
      if (this.isLandscapeOrientation) {
        // In landscape mode, only allow transitions between TOP and BOTTOM
        PanelPositions.TOP.allowedTransitions = ['BOTTOM'];
        PanelPositions.BOTTOM.allowedTransitions = ['TOP'];
        PanelPositions.MIDDLE.allowedTransitions = [];
      } else {
        // In portrait mode, allow all transitions
        PanelPositions.TOP.allowedTransitions = ['MIDDLE', 'BOTTOM'];
        PanelPositions.MIDDLE.allowedTransitions = ['TOP', 'BOTTOM'];
        PanelPositions.BOTTOM.allowedTransitions = ['MIDDLE', 'TOP'];
      }
    },

    /**
     * Update panel positions based on screen dimensions
     */
    updatePanelPositions() {
      const screenHeight = this.screenHeight;

      // Update position values
      PanelPositions.BOTTOM.value = screenHeight - this.panelVisibleHeight;
      PanelPositions.MIDDLE.value = screenHeight / 2;

      // Calculate snap thresholds
      this.snapThresholds = {
        middleToBottom: (PanelPositions.BOTTOM.value - PanelPositions.MIDDLE.value) / 5,
        topToMiddle: (PanelPositions.MIDDLE.value - PanelPositions.TOP.value) / 5
      };

      // Update panel dimensions
      this.panelHeight = screenHeight - PanelPositions.TOP.value;
      this.lastTop = PanelPositions.BOTTOM.value;
      this.panelCurrentTop = PanelPositions.BOTTOM.value;
    },

    /**
     * Handle open panel command
     */
    async handleOpenCommand() {
      // Skip if panel is already open or animation is in progress
      if (!this.isPanelClosedLocal || this.isAnimationLocked) {
        return;
      }

      // Target position depends on orientation
      const targetPosition = this.isLandscapeOrientation ? 'TOP' : 'MIDDLE';

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
    // Initialize panel positions
    this.updatePanelPositions();
    this.updateStorePositions();

    // Initialize orientation
    this.isLandscapeOrientation = layoutService.dimensions.isLandscape;
    this.setLandscapeOrientation(layoutService.dimensions.isLandscape);

    // Set up panel transitions
    this.updatePanelTransitions();

    // Listen for layout changes
    this.removeLayoutListener = layoutService.addLayoutChangeListener(this.handleLayoutChange);
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

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

<template>
  <AbsoluteLayout :width="panelWidth">
    <GridLayout
      ref="panel"
      class="sliding-panel"
      :top="panelCurrentTop"
      :height="panelHeight"
      rows="*"
      columns="*"
      @pan="handlePanGesture">

      <AppControlPanel
        :max-height="appControlPanelMaxHeight"
        verticalAlignment="top"
        row="0"
        col="0"
      />

    </GridLayout>
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
import AppControlPanel from '@/components/AppControlPanel/AppControlPanel.vue';
import MapStateBar from "./MapStateBar.vue";
import { panelControllerMixin } from "./mixins/panelController";
import { performanceOptimizationMixin, optimizeMapState } from '~/utils/performance-optimization';
import { layoutService } from '~/utils/layout-service';
import { PanelPositions } from './constants/panelPositions';
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  name: 'SlidingPanel',

  mixins: [performanceOptimizationMixin, panelControllerMixin],

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
      panelCurrentTop: 0,
      snapThresholds: {
        middleToBottom: 0,
        topToMiddle: 0
      }
    };
  },

  computed: {
    appControlPanelMaxHeight() {
      const currentPanelHeight = this.screenHeight - this.panelCurrentTop;
      return currentPanelHeight - this.mapStateBarHeight;
    },

    ...mapState(optimizeMapState({
      activePanel: 'ui.activePanel',
      panelCommand: 'ui.panelCommand',
      panelHeight: 'ui.panelHeight',
      panelWidth: 'ui.slidingPanelWidth',
      mapStateBarHeight: 'ui.mapStateBarHeight',
      panelVisibleHeight: 'ui.panelVisibleHeight',
      isLandscapeOrientation: 'ui.isLandscapeOrientation',
      isPanelOpen: 'ui.panelState.isOpen',
      storePanelPosition: 'ui.panelState.position',
      storeSnapThresholds: 'ui.panelState.snapThresholds'
    })),

    ...mapGetters({
      isPanelClosed: 'ui/isPanelClosed',
      getPanelPositionValue: 'ui/getPanelPositionValue'
    }),

    // Check if panel is closed
    isPanelClosedLocal() {
      const panel = this.getPanelElement();
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
     */
    isVisible(newValue, oldValue) {
      // Only handle the case when panel becomes visible after being hidden
      if (newValue && !oldValue) {
        // Force panel to closed state when reappearing after debug mode
        this.$nextTick(() => {
          // Update store state
          this.setPanelOpenState(false);

          // Force correct DOM position
          const panel = this.getPanelElement();
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
    },

    // Sync snap thresholds from store to local state
    storeSnapThresholds: {
      handler(newThresholds) {
        this.snapThresholds = { ...newThresholds };
        this.updateStateMachineSettings();
      },
      deep: true
    }
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      closePanel: 'ui/closePanel',

      // Updated actions for new store structure
      setPanelOpenState: 'ui/setPanelOpenState',
      setPanelPosition: 'ui/setPanelPosition',
      updatePanelPositions: 'ui/updatePanelPositions',
      updatePanelThresholds: 'ui/updatePanelThresholds',
      updatePanelConfig: 'ui/updatePanelConfig',
      updatePanelState: 'ui/updatePanelState',
      setLandscapeOrientation: 'ui/setLandscapeOrientation',
      recalculatePanelLayout: 'ui/recalculatePanelLayout',
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

      // Update global screen dimensions
      this.updatePanelConfig({ key: 'screenHeight', value: dimensions.availableHeight });
      this.updatePanelConfig({ key: 'slidingPanelWidth', value: dimensions.panelWidth });
      this.updatePanelConfig({ key: 'mapStateBarHeight', value: 46 }); // Fixed value

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

      // Recalculate panel layout
      this.recalculatePanelLayout();

      // Update local positions
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
        const panel = this.getPanelElement();
        if (panel) {
          panel.top = bottomPosition;
        }
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
    }
  },

  created() {
    // Initialize store values
    this.updatePanelConfig({ key: 'mapStateBarHeight', value: 46 });
    this.updatePanelConfig({ key: 'panelVisibleHeight', value: 110 });

    // Initialize panel positions
    this.recalculatePanelLayout();
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
      const panel = this.getPanelElement();
      if (panel) {
        panel.top = this.panelCurrentTop;
      }
    });
  },

  beforeDestroy() {
    try {
      if (this.removeLayoutListener) {
        this.removeLayoutListener();
      }

      if (this.panelControllerCleanup) {
        this.panelControllerCleanup();
      }

      this.performanceCleanup();
    } catch (error) {
      console.error('Error during SlidingPanel cleanup:', error);
    }
  }
};
</script>

<style scoped lang="scss">
.sliding-panel {
  width: 100%;
}
</style>

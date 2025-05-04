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
import { slideAnimationMixin } from "./mixins/slideAnimation";
import { panelPositionMixin } from "./mixins/panelPosition";
import { panelGestureMixin } from "./mixins/panelGesture";
import { layoutService } from '~/utils/layout-service';
import { PanelPositions } from './constants/panelPositions';
import { mapState, mapActions } from 'vuex';

export default {
  name: 'SlidingPanel',

  mixins: [slideAnimationMixin, panelPositionMixin, panelGestureMixin],

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
      lastCommandTimestamp: 0,

      // Animation lock flag
      isAnimationLocked: false
    };
  },

  computed: {
    appControlPanelMaxHeight() {
      return this.panelHeight - this.mapStateBarHeight;
    },

    ...mapState({
      activePanel: state => state.ui.activePanel,
      panelCommand: state => state.ui.panelCommand,
      isPanelOpen: state => state.ui.isPanelOpen
    }),

    // Check if panel is closed
    isPanelClosed() {
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

          // Reset state machine to ensure correct gesture handling
          this.stateMachine.forceState('BOTTOM');
          this.position = 'BOTTOM';
          this.lastTop = PanelPositions.BOTTOM.value;
        });
      }
    }
  },

  methods: {
    ...mapActions({
      setActivePanel: 'ui/setActivePanel',
      setPanelOpenState: 'ui/setPanelOpenState',
      closePanel: 'ui/closePanel'
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

      this.screenHeight = dimensions.availableHeight;
      this.panelWidth = dimensions.panelWidth;

      const previousOrientation = this.isLandscapeOrientation;
      this.isLandscapeOrientation = dimensions.isLandscape;

      if (previousOrientation !== this.isLandscapeOrientation) {
        this.updatePanelTransitions();

        // When changing orientation, close the panel
        this.closePanel();

        if (this.isLandscapeOrientation && this.position === 'MIDDLE') {
          this.moveToPosition('TOP');
        }
      }

      this.updatePanelPositions();
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
     * Handle open panel command
     */
    async handleOpenCommand() {
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      // Get exact panel position
      const currentTop = panel.top;
      const bottomValue = PanelPositions.BOTTOM.value;
      const tolerance = 10;

      // Check if panel is closed
      const isPanelClosed = Math.abs(currentTop - bottomValue) < tolerance;

      // Only open if panel is completely closed
      if (!isPanelClosed) {
        // Don't change panel position if it's already open
        return;
      }

      // Prevent multiple animations
      if (this.isAnimationLocked) {
        return;
      }

      this.isAnimationLocked = true;

      try {
        // Target position depends on orientation
        const targetPosition = this.isLandscapeOrientation ? 'TOP' : 'MIDDLE';

        // Cancel any current animations
        this.cancelAnimation();

        // Get target top position
        const targetTop = PanelPositions[targetPosition].value;

        // Animate panel
        const newTop = await this.animatePanel(panel, panel.top, targetTop);

        // Update position
        panel.top = targetTop;
        this.panelCurrentTop = targetTop;

        // Update state machine
        this.stateMachine.forceState(targetPosition);
        this.position = targetPosition;
        this.lastTop = targetTop;

        // Update panel open state
        await this.setPanelOpenState(true);

        // If active panel is not set, default to 'quick'
        if (this.activePanel === null) {
          await this.setActivePanel('quick');
        }
      } catch (error) {
        console.error('Error opening panel:', error);
      } finally {
        setTimeout(() => {
          this.isAnimationLocked = false;
        }, 50);
      }
    },

    /**
     * Handle close panel command
     */
    async handleCloseCommand() {
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      // Skip if panel already closed
      if (this.isPanelClosed) {
        return;
      }

      // Prevent multiple animations
      if (this.isAnimationLocked) {
        return;
      }

      this.isAnimationLocked = true;

      try {
        // Cancel any current animations
        this.cancelAnimation();

        // Get target position
        const targetTop = PanelPositions.BOTTOM.value;

        // Animate panel
        const newTop = await this.animatePanel(panel, panel.top, targetTop);

        // Update position
        panel.top = targetTop;
        this.panelCurrentTop = targetTop;

        // Update state machine
        this.stateMachine.forceState('BOTTOM');
        this.position = 'BOTTOM';
        this.lastTop = targetTop;

        // Update panel open state and active panel
        await this.setPanelOpenState(false);
        await this.setActivePanel('quick');
      } catch (error) {
        console.error('Error closing panel:', error);
      } finally {
        setTimeout(() => {
          this.isAnimationLocked = false;
        }, 50);
      }
    },

    /**
     * Handle pan gesture on panel
     */
    handlePanGesture(args) {
      if (this.isAnimationLocked) {
        return;
      }

      this.$options.mixins[2].methods.handlePanGesture.call(this, args);
    }
  },

  created() {
    // Initialize panel positions
    this.updatePanelPositions();

    // Initialize orientation
    this.isLandscapeOrientation = layoutService.dimensions.isLandscape;

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

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { CoreTypes, Animation } from "@nativescript/core";
import { PanelPositions } from '../constants/panelPositions';
import { PanelStateMachine } from '../state/panelStateMachine';

// Configuration for pan gesture resistance
const PANEL_CONSTANTS = {
  RESISTANCE_FACTOR: 0.1, // Panel moves 10x slower when out of bounds
  MAX_OVERFLOW: 10,       // Maximum DIP beyond boundaries
};

/**
 * Panel controller mixin
 * Unified mixin that handles panel animation, position management and gestures
 */
export const panelControllerMixin = {
  data() {
    return {
      // Panel state machine
      stateMachine: new PanelStateMachine(),

      // Gesture handling
      startTop: 0,              // Starting position for gestures

      // Animation state
      isAnimating: false,       // Flag to track ongoing animation
      animationSet: undefined,  // Current animation reference
      isAnimationLocked: false, // Flag to prevent simultaneous animations

      // External gesture tracking
      externalPanStarted: false,
      externalStartDeltaY: 0
    };
  },

  computed: {
    // Get current position ID
    position: {
      get() {
        return this.stateMachine.currentState;
      },
      set(newPosition) {
        this.stateMachine.setState(newPosition);
      }
    },

    // Get last stable position for transitions
    lastTop: {
      get() {
        return this.stateMachine.lastPosition;
      },
      set(newPosition) {
        this.stateMachine.lastPosition = newPosition;
      }
    }
  },

  methods: {
    /**
     * Animate panel to a new position
     * @param {Object} element - The panel DOM element
     * @param {number} fromTop - Starting top position
     * @param {number} targetTop - Target top position
     * @returns {Promise<number>} Final top position
     */
    async animatePanel(element, fromTop, targetTop) {
      if (!element) {
        return Promise.resolve(fromTop);
      }

      // Skip if positions are the same
      if (Math.abs(fromTop - targetTop) < 1) {
        return Promise.resolve(targetTop);
      }

      try {
        // Lock animation to prevent interference
        this.isAnimating = true;

        // Force element into a consistent starting state
        element.translateY = 0;
        element.top = fromTop;

        // Ensure our local tracking is consistent
        this.panelCurrentTop = fromTop;

        // Calculate amount to move
        const translateY = targetTop - fromTop;

        // Create animation
        this.animationSet = new Animation([{
          target: element,
          translate: { x: 0, y: translateY },
          duration: 300,
          curve: CoreTypes.AnimationCurve.easeInOut,
        }]);

        // Play animation and wait for completion
        await this.animationSet.play();

        // Set final position with direct manipulation
        element.translateY = 0;
        element.top = targetTop;

        // Ensure our tracking matches the final position
        this.panelCurrentTop = targetTop;

        // Sync position to store only after animation completes
        this.setPanelPosition({
          position: this.position,
          value: targetTop
        });

        return targetTop; // Return the end position to update the state
      } catch (error) {
        console.error('Animation error:', error);
        return fromTop; // Return the initial position in case of an error
      } finally {
        this.isAnimating = false;
        this.animationSet = undefined;
      }
    },

    /**
     * Cancel current animation
     */
    cancelAnimation() {
      if (this.animationSet && this.isAnimating) {
        this.animationSet.cancel();
        this.animationSet = undefined;
        this.isAnimating = false;
      }
    },

    /**
     * Snap panel to the nearest position after a gesture
     */
    snapPanel() {
      // Skip if animation is locked
      if (this.isAnimationLocked) {
        return;
      }

      // Get panel element
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      // Make sure we're working with the actual current position
      const actualPanelTop = panel.top;
      this.panelCurrentTop = actualPanelTop;

      // Use state machine to determine next state
      const nextState = this.stateMachine.determineNextState(actualPanelTop);

      // Get target position
      const targetTop = PanelPositions[nextState].value;

      // Update position tracking
      this.position = nextState;
      this.lastTop = targetTop;

      // Animate panel to target position
      this.animatePanel(
        panel,
        actualPanelTop,
        targetTop
      ).then(() => {
        // Update panel open state
        const isPanelOpen = nextState !== 'BOTTOM';
        this.setPanelOpenState(isPanelOpen);

        // Update active panel
        if (!isPanelOpen) {
          this.setActivePanel('quick');
        } else if (this.activePanel === null) {
          this.setActivePanel('quick');
        }
      }).catch(error => {
        console.error('Error during panel snap:', error);
      });
    },

    /**
     * Move panel to a specific position
     * @param {string} position - Target position ID ('TOP', 'MIDDLE', 'BOTTOM')
     */
    async moveToPosition(position) {
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      // Skip if animation is locked
      if (this.isAnimationLocked) {
        return;
      }

      this.isAnimationLocked = true;

      try {
        // Adjust position based on orientation
        if (this.isLandscapeOrientation && position === 'MIDDLE') {
          position = 'TOP';
        }

        // Update state tracking
        this.position = position;

        // Get target position
        const targetTop = PanelPositions[position].value;

        // Get actual current position from the DOM
        const actualPanelTop = panel.top;

        // Animate panel directly to the target
        const newTop = await this.animatePanel(panel, actualPanelTop, targetTop);

        // Update state after animation completes
        this.lastTop = newTop;

        // Update panel open state
        const isPanelOpen = position !== 'BOTTOM';
        this.setPanelOpenState(isPanelOpen);

        // If panel is closed, active panel is 'quick'
        if (!isPanelOpen) {
          this.setActivePanel('quick');
        }
      } catch (error) {
        console.error('Error during panel move:', error);
      } finally {
        setTimeout(() => {
          this.isAnimationLocked = false;
        }, 50);
      }
    },

    /**
     * Calculates panel position with resistance effect when dragged beyond boundaries
     */
    calculateResistancePosition(newTop, topBoundary, bottomBoundary) {
      if (newTop >= topBoundary && newTop <= bottomBoundary) {
        return newTop;
      }

      const isOverTop = newTop < topBoundary;
      const boundary = isOverTop ? topBoundary : bottomBoundary;
      const overflow = Math.abs(newTop - boundary);
      const resistance = Math.min(
        overflow * PANEL_CONSTANTS.RESISTANCE_FACTOR,
        PANEL_CONSTANTS.MAX_OVERFLOW
      );

      return boundary + (isOverTop ? -resistance : resistance);
    },

    /**
     * Handle pan gesture on panel
     */
    handlePanGesture(args) {
      if (!this.$refs.panel?.nativeView || this.isAnimationLocked) {
        return;
      }

      const panel = this.$refs.panel.nativeView;

      // Cancel any ongoing animation
      if (this.isAnimating) {
        this.cancelAnimation();
      }

      // Get boundaries from current position values
      const topBoundary = PanelPositions.TOP.value;
      const bottomBoundary = PanelPositions.BOTTOM.value;

      switch (args.state) {
        case 1: // Pan start
          this.startTop = panel.top;
          this.panelCurrentTop = panel.top;
          break;

        case 2: // Pan in progress
          const newTop = this.startTop + args.deltaY;
          const finalTop = this.calculateResistancePosition(
            newTop,
            topBoundary,
            bottomBoundary
          );

          panel.top = finalTop;
          this.panelCurrentTop = finalTop;
          break;

        case 3: // Pan end
          this.panelCurrentTop = panel.top;
          this.snapPanel();
          break;
      }
    },

    /**
     * Handle pan gestures from MapStateBar
     */
    handleExternalPanGesture(args) {
      if (!this.$refs.panel?.nativeView || this.isAnimationLocked) {
        return;
      }

      const panel = this.$refs.panel.nativeView;

      // Cancel any ongoing animation
      if (this.isAnimating) {
        this.cancelAnimation();
      }

      // Get boundaries from current position values
      const topBoundary = PanelPositions.TOP.value;
      const bottomBoundary = PanelPositions.BOTTOM.value;

      switch (args.state) {
        case 1: // Pan start
          this.externalPanStarted = true;
          this.startTop = panel.top;
          this.panelCurrentTop = panel.top;
          this.externalStartDeltaY = args.deltaY;
          break;

        case 2: // Pan in progress
          if (!this.externalPanStarted) {
            // If we somehow missed the start event
            this.externalPanStarted = true;
            this.startTop = panel.top;
            this.externalStartDeltaY = args.deltaY;
          }

          // Calculate adjusted delta for external pan
          const adjustedDeltaY = args.deltaY - this.externalStartDeltaY;
          const newTop = this.startTop + adjustedDeltaY;

          // Apply resistance if needed
          const finalTop = this.calculateResistancePosition(
            newTop,
            topBoundary,
            bottomBoundary
          );

          // Update panel position
          panel.top = finalTop;
          this.panelCurrentTop = finalTop;
          break;

        case 3: // Pan end
          this.externalPanStarted = false;
          this.panelCurrentTop = panel.top;
          this.snapPanel();
          break;
      }
    },

    /**
     * Update state machine when orientation changes
     */
    updateStateMachineSettings() {
      this.stateMachine.setOrientation(this.isLandscapeOrientation);
      this.stateMachine.setSnapThresholds(this.snapThresholds);
    }
  },

  watch: {
    isLandscapeOrientation() {
      this.updateStateMachineSettings();
    },

    snapThresholds: {
      handler() {
        this.updateStateMachineSettings();
      },
      deep: true
    }
  }
};

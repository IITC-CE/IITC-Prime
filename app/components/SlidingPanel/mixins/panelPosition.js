//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { PanelPositions } from '../constants/panelPositions';
import { PanelStateMachine } from '../state/panelStateMachine';

export const panelPositionMixin = {
  data() {
    return {
      position: PanelPositions.BOTTOM.id,
      panelCurrentTop: 0,
      startTop: 0,
      lastTop: undefined,
      snapThresholds: {
        middleToBottom: 0,
        topToMiddle: 0
      },
      stateMachine: new PanelStateMachine(),
      // Flag to control programmatic panel opening
      isProgrammaticOpen: false
    };
  },

  methods: {
    updatePanelPositions() {
      const screenHeight = this.screenHeight;

      PanelPositions.BOTTOM.value = screenHeight - this.panelVisibleHeight;
      PanelPositions.MIDDLE.value = screenHeight / 2;

      this.snapThresholds = {
        middleToBottom: (PanelPositions.BOTTOM.value - PanelPositions.MIDDLE.value) / 5,
        topToMiddle: (PanelPositions.MIDDLE.value - PanelPositions.TOP.value) / 5
      };

      this.panelHeight = screenHeight - PanelPositions.TOP.value;
      this.lastTop = PanelPositions.BOTTOM.value;
      this.panelCurrentTop = PanelPositions.BOTTOM.value;
    },

    snapPanel() {
      // Prevent user gestures from interrupting programmatic opening
      if (this.isProgrammaticOpen) {
        return;
      }

      // Use state machine to determine next state
      const nextState = this.stateMachine.determineNextState(
        this.panelCurrentTop,
        this.lastTop,
        PanelPositions.MIDDLE.value,
        this.snapThresholds
      );

      // Perform transition
      let targetTop;
      if (this.stateMachine.transition(nextState)) {
        this.position = nextState;
        targetTop = PanelPositions[nextState].value;
        this.lastTop = targetTop;
      } else {
        // If transition failed, snap to last valid position
        targetTop = this.lastTop || PanelPositions[this.position].value;
      }

      // Animate panel to target position
      this.animatePanel(
        this.$refs.panel?.nativeView,
        this.panelCurrentTop,
        targetTop
      ).then(newTop => {
        this.panelCurrentTop = newTop;

        // Determine if panel is open after snap
        const isPanelOpen = nextState !== 'BOTTOM';
        this.setPanelOpenState(isPanelOpen);

        // If panel is closed, active panel is 'quick' (but all buttons inactive)
        if (!isPanelOpen) {
          this.setActivePanel('quick');
        } else if (this.activePanel === null) {
          // If panel is open but no active panel, set to 'quick'
          this.setActivePanel('quick');
        }
      }).catch(error => {
        console.error('Error during panel snap:', error);
      });
    },

    /**
     * Move panel to position with proper state update
     */
    async moveToPosition(position) {
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      // In landscape mode, MIDDLE becomes TOP
      if (this.isLandscapeOrientation && position === 'MIDDLE') {
        position = 'TOP';
      }

      // Check if transition is possible
      if (!this.stateMachine.canTransition(position)) {
        // If direct transition is not possible, try intermediate steps
        if (this.position === 'TOP' && position === 'BOTTOM') {
          // First to MIDDLE, then to BOTTOM
          await this.moveToPosition('MIDDLE');
          return this.moveToPosition('BOTTOM');
        }

        if (this.position === 'BOTTOM' && position === 'TOP') {
          // First to MIDDLE, then to TOP
          await this.moveToPosition('MIDDLE');
          return this.moveToPosition('TOP');
        }

        return;
      }

      try {
        // Update state machine
        this.stateMachine.transition(position);
        this.position = position;

        // Get target position
        const targetTop = PanelPositions[position].value;

        // Animate panel
        const newTop = await this.animatePanel(panel, panel.top, targetTop);

        // Update state
        this.panelCurrentTop = newTop;
        this.lastTop = newTop;

        // Update panel open state
        const isPanelOpen = position !== 'BOTTOM';
        this.setPanelOpenState(isPanelOpen);

        // If panel is closed, active panel is 'quick' (but all buttons inactive)
        if (!isPanelOpen) {
          this.setActivePanel('quick');
        }
      } catch (error) {
        console.error('Error during panel move:', error);
      }
    }
  }
};

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
      // Initialize state machine
      stateMachine: new PanelStateMachine()
    };
  },

  created() {
    // Initialize state machine with positions
    this.stateMachine.init(PanelPositions);
  },

  methods: {
    updatePanelPositions() {
      PanelPositions.BOTTOM.value = this.screenHeight - this.panelVisibleHeight;
      PanelPositions.MIDDLE.value = this.screenHeight / 2;

      this.snapThresholds = {
        middleToBottom: (PanelPositions.BOTTOM.value - PanelPositions.MIDDLE.value) / 5,
        topToMiddle: (PanelPositions.MIDDLE.value - PanelPositions.TOP.value) / 5
      };

      this.panelHeight = this.screenHeight - PanelPositions.TOP.value;
      this.lastTop = PanelPositions.BOTTOM.value;
      this.panelCurrentTop = PanelPositions.BOTTOM.value;

      this.moveToPosition(this.position);
    },

    snapPanel() {
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

      this.animatePanel(
        this.$refs.panel?.nativeView,
        this.panelCurrentTop,
        targetTop
      );
    },

    async moveToPosition(position) {
      const panel = this.$refs.panel?.nativeView;
      if (!panel) return;

      // Check if transition is allowed
      if (this.stateMachine.transition(position)) {
        const targetTop = this.stateMachine.getCurrentPosition();
        const newTop = await this.animatePanel(
          panel,
          panel.top,
          targetTop
        );
        this.panelCurrentTop = newTop;
      }
    },
  }
};

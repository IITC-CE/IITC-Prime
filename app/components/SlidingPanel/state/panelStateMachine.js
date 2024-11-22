//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

// State machine for managing panel positions and transitions
export class PanelStateMachine {
  constructor() {
    // Define available states and their transitions
    this.states = {
      TOP: {
        allowedTransitions: ['MIDDLE', 'BOTTOM'],
        getValue: () => this.positions.TOP.value,
      },
      MIDDLE: {
        allowedTransitions: ['TOP', 'BOTTOM'],
        getValue: () => this.positions.MIDDLE.value,
      },
      BOTTOM: {
        allowedTransitions: ['MIDDLE', 'TOP'],
        getValue: () => this.positions.BOTTOM.value,
      }
    };

    // Reference to position values
    this.positions = null;

    // Current state
    this.currentState = 'BOTTOM';
  }

  // Initialize with position values reference
  init(positions) {
    this.positions = positions;
  }

  // Check if transition is allowed
  canTransition(targetState) {
    return this.states[this.currentState].allowedTransitions.includes(targetState);
  }

  // Get current position value
  getCurrentPosition() {
    return this.states[this.currentState].getValue();
  }

  // Perform state transition
  transition(targetState) {
    if (this.canTransition(targetState)) {
      this.currentState = targetState;
      return true;
    }
    return false;
  }

  // Determine next state based on current position and movement
  determineNextState(currentTop, lastTop, middleValue, snapThresholds) {
    // Start from previous position (lastTop)
    if (lastTop === this.positions.TOP.value) {
      // Moving from TOP position
      if (currentTop < middleValue) {
        return currentTop - this.positions.TOP.value >= snapThresholds.topToMiddle
          ? 'MIDDLE'
          : 'TOP';
      } else {
        return 'BOTTOM';
      }
    }

    if (lastTop === this.positions.BOTTOM.value) {
      // Moving from BOTTOM position
      if (currentTop > middleValue) {
        return this.positions.BOTTOM.value - currentTop >= snapThresholds.middleToBottom
          ? 'MIDDLE'
          : 'BOTTOM';
      } else {
        return 'TOP';
      }
    }

    // Default behavior - snap to closest position
    if (currentTop >= middleValue) {
      return currentTop - middleValue >= snapThresholds.middleToBottom
        ? 'BOTTOM'
        : 'MIDDLE';
    } else {
      return middleValue - currentTop >= snapThresholds.topToMiddle
        ? 'TOP'
        : 'MIDDLE';
    }
  }
}

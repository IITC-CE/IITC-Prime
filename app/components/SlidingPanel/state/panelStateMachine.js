//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { PanelPositions, PanelPositionHelpers } from '../constants/panelPositions';

// State machine for managing panel positions and transitions
export class PanelStateMachine {
  constructor() {
    this.currentState = PanelPositions.BOTTOM.id;
  }

  // Get current position value
  getCurrentPosition() {
    return PanelPositionHelpers.getPositionValue(this.currentState);
  }

  // Check if transition is allowed
  canTransition(targetState) {
    return PanelPositionHelpers.canTransition(this.currentState, targetState);
  }

  // Perform state transition
  transition(targetState) {
    if (this.canTransition(targetState)) {
      this.currentState = targetState;
      return true;
    }
    return false;
  }

  // Force state without checking transitions
  forceState(targetState) {
    if (PanelPositions[targetState]) {
      this.currentState = targetState;
      return true;
    }
    return false;
  }

  // Determine next state based on position and movement
  determineNextState(currentTop, lastTop, middleValue, snapThresholds) {
    const positions = PanelPositions;

    // From TOP position
    if (lastTop === positions.TOP.value) {
      if (currentTop < middleValue) {
        return currentTop - positions.TOP.value >= snapThresholds.topToMiddle
          ? positions.MIDDLE.id
          : positions.TOP.id;
      } else {
        return positions.BOTTOM.id;
      }
    }

    // From BOTTOM position
    if (lastTop === positions.BOTTOM.value) {
      if (currentTop > middleValue) {
        return positions.BOTTOM.value - currentTop >= snapThresholds.middleToBottom
          ? positions.MIDDLE.id
          : positions.BOTTOM.id;
      } else {
        return positions.TOP.id;
      }
    }

    // Default behavior - snap to closest position
    if (currentTop >= middleValue) {
      return currentTop - middleValue >= snapThresholds.middleToBottom
        ? positions.BOTTOM.id
        : positions.MIDDLE.id;
    } else {
      return middleValue - currentTop >= snapThresholds.topToMiddle
        ? positions.TOP.id
        : positions.MIDDLE.id;
    }
  }
}

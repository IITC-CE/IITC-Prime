// Copyright (C) 2024-2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

import { PanelPositions } from '../constants/panelPositions';

/**
 * PanelStateMachine
 * Handles state transitions and decision logic for sliding panel
 */
export class PanelStateMachine {
  constructor() {
    this.currentState = 'BOTTOM';
    this.lastPosition = null;
    this.snapThresholds = {
      middleToBottom: 0,
      topToMiddle: 0
    };
    this.isLandscapeOrientation = false;
  }

  /**
   * Set current state without validation
   */
  setState(state) {
    this.currentState = state;
    this.lastPosition = PanelPositions[state].value;
  }

  /**
   * Set orientation mode
   */
  setOrientation(isLandscape) {
    this.isLandscapeOrientation = isLandscape;
  }

  /**
   * Update snap thresholds for transition decisions
   */
  setSnapThresholds(thresholds) {
    this.snapThresholds = {...thresholds};
  }

  /**
   * Get position value for current state
   */
  getCurrentPositionValue() {
    return PanelPositions[this.currentState].value;
  }

  /**
   * Determine if panel is currently closed
   */
  isPanelClosed() {
    return this.currentState === 'BOTTOM';
  }

  /**
   * Get target position for panel opening command
   */
  getOpenPosition() {
    return this.isLandscapeOrientation ? 'TOP' : 'MIDDLE';
  }

  /**
   * Determine next state based on current position and movement
   * Uses sensitivity thresholds to make transitions easier
   */
  determineNextState(currentTop) {
    const { topToMiddle, middleToBottom } = this.snapThresholds;
    const positions = PanelPositions;

    // If in landscape orientation, only consider TOP and BOTTOM
    if (this.isLandscapeOrientation) {
      // Use sensitivity threshold - only need to move 1/5 of the way
      const sensitivity = (positions.BOTTOM.value - positions.TOP.value) / 5;

      if (this.lastPosition === positions.TOP.value) {
        // Moving from TOP
        return (currentTop - positions.TOP.value) > sensitivity ? 'BOTTOM' : 'TOP';
      } else if (this.lastPosition === positions.BOTTOM.value) {
        // Moving from BOTTOM
        return (positions.BOTTOM.value - currentTop) > sensitivity ? 'TOP' : 'BOTTOM';
      } else {
        // No context, use midpoint
        return currentTop < (positions.TOP.value + positions.BOTTOM.value) / 2 ? 'TOP' : 'BOTTOM';
      }
    }

    // For portrait mode with three positions (TOP, MIDDLE, BOTTOM)
    const middleValue = positions.MIDDLE.value;

    // Use the last stable position to provide context for the movement
    if (this.lastPosition === positions.TOP.value) {
      // Moving from TOP
      if (currentTop < middleValue) {
        // Between TOP and MIDDLE - only need to move 1/5 of the way to snap
        return currentTop - positions.TOP.value > topToMiddle ? 'MIDDLE' : 'TOP';
      } else {
        // Past MIDDLE heading toward BOTTOM
        return 'BOTTOM';
      }
    } else if (this.lastPosition === positions.BOTTOM.value) {
      // Moving from BOTTOM
      if (currentTop > middleValue) {
        // Between MIDDLE and BOTTOM - only need to move 1/5 of the way to snap
        return positions.BOTTOM.value - currentTop > middleToBottom ? 'MIDDLE' : 'BOTTOM';
      } else {
        // Past MIDDLE heading toward TOP
        return 'TOP';
      }
    } else if (this.lastPosition === positions.MIDDLE.value) {
      // Moving from MIDDLE
      if (currentTop < positions.MIDDLE.value) {
        // Moving toward TOP - need to move 1/5 of the way
        return middleValue - currentTop > topToMiddle ? 'TOP' : 'MIDDLE';
      } else {
        // Moving toward BOTTOM - need to move 1/5 of the way
        return currentTop - middleValue > middleToBottom ? 'BOTTOM' : 'MIDDLE';
      }
    } else {
      // No last position context, use nearest point
      const distToTop = Math.abs(currentTop - positions.TOP.value);
      const distToMiddle = Math.abs(currentTop - positions.MIDDLE.value);
      const distToBottom = Math.abs(currentTop - positions.BOTTOM.value);

      const minDist = Math.min(distToTop, distToMiddle, distToBottom);

      if (minDist === distToTop) return 'TOP';
      if (minDist === distToMiddle) return 'MIDDLE';
      return 'BOTTOM';
    }
  }
}

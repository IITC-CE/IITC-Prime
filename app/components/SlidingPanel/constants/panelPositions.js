// Copyright (C) 2024 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

export const PanelPositions = {
  TOP: {
    id: 'TOP',
    value: 50,
    allowedTransitions: ['MIDDLE', 'BOTTOM']
  },
  MIDDLE: {
    id: 'MIDDLE',
    value: 0, // Will be calculated: screenHeight/2
    allowedTransitions: ['TOP', 'BOTTOM']
  },
  BOTTOM: {
    id: 'BOTTOM',
    value: 0, // Will be calculated: screenHeight - panelVisibleHeight
    allowedTransitions: ['MIDDLE', 'TOP']
  }
};

// Helper functions for working with positions
export const PanelPositionHelpers = {
  getPositionValue(positionId) {
    return PanelPositions[positionId].value;
  },

  canTransition(fromPosition, toPosition) {
    return PanelPositions[fromPosition].allowedTransitions.includes(toPosition);
  },
};

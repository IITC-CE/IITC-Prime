//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

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

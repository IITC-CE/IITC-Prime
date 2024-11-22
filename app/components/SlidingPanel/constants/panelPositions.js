//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

export const PanelPositions = {
  TOP: {
    id: 'TOP',
    value: 50,
  },
  MIDDLE: {
    id: 'MIDDLE',
    value: 0, // Will be calculated: screenHeight/2
  },
  BOTTOM: {
    id: 'BOTTOM',
    value: 0, // Will be calculated: screenHeight - panelVisibleHeight
  }
};

//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { PanelPositions } from '../constants/panelPositions';

// Configuration
export const PANEL_CONSTANTS = {
  RESISTANCE_FACTOR: 0.1, // Panel moves 10x slower when out of bounds
  MAX_OVERFLOW: 10, // Maximum DIP beyond boundaries
};

export const panelGestureMixin = {
  methods: {
    /**
     * Calculates the final position of the panel with resistance effect
     * @param {number} newTop - New top position before resistance
     * @param {number} topBoundary - Upper boundary (TOP position)
     * @param {number} bottomBoundary - Lower boundary (BOTTOM position)
     * @returns {number} Final position after applying resistance
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
     * Handles pan gesture events for the sliding panel
     * @param {Object} args - Pan gesture event arguments
     */
    handlePanGesture(args) {
      if (!this.$refs.panel?.nativeView) {
        return;
      }

      const panel = this.$refs.panel.nativeView;

      // Cancel any ongoing animation
      if (this.isAnimating) {
        this.cancelAnimation();
      }

      switch (args.state) {
        case 1: // Pan start
          this.startTop = panel.top;
          this.panelCurrentTop = panel.top;
          break;

        case 2: // Pan in progress
          const newTop = this.startTop + args.deltaY;
          const finalTop = this.calculateResistancePosition(
            newTop,
            PanelPositions.TOP.value,
            PanelPositions.BOTTOM.value
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
  },
};

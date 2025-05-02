//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { Animation } from "@nativescript/core";
import { LOG_COLORS } from '../constants/logStyles';

export default {
  data() {
    return {
      activeAnimation: null,
      restoreTimeout: null,
      touchedView: null,
      isProcessingTouch: false
    };
  },

  methods: {
    // Reset touch state and cancel all animations
    resetTouchState() {
      // Cancel timeout if exists
      if (this.restoreTimeout) {
        clearTimeout(this.restoreTimeout);
        this.restoreTimeout = null;
      }

      // Cancel animation if exists
      if (this.activeAnimation) {
        this.activeAnimation.cancel();
        this.activeAnimation = null;
      }

      // Reset touched view directly
      if (this.touchedView) {
        this.touchedView.backgroundColor = LOG_COLORS.TRANSPARENT_BG;
        this.touchedView = null;
      }

      // Reset processing flag
      this.isProcessingTouch = false;
    },

    // Handle touch events on log items
    onLogTouch(args) {
      const view = args.object;

      switch (args.action) {
        case 'down':
          // Skip if already processing touch
          if (this.isProcessingTouch) {
            return;
          }

          // Set processing flag to prevent parallel operations
          this.isProcessingTouch = true;

          // Reset previous state
          this.resetTouchState();

          // Just re-set the processing flag since resetTouchState cleared it
          this.isProcessingTouch = true;

          // Apply highlight
          this.touchedView = view;
          view.backgroundColor = LOG_COLORS.HIGHLIGHT_BG;

          // Set timeout for auto-restore
          this.restoreTimeout = setTimeout(() => {
            this.restoreLogItem();
          }, 1000);
          break;

        case 'up':
        case 'cancel':
          // Only restore if this is the current touched view
          if (view === this.touchedView) {
            this.restoreLogItem();
          }
          break;
      }
    },

    // Restore log item to original appearance with animation
    restoreLogItem() {
      // Skip if no view is being touched
      if (!this.touchedView) {
        this.isProcessingTouch = false;
        return;
      }

      // Cancel timeout if exists
      if (this.restoreTimeout) {
        clearTimeout(this.restoreTimeout);
        this.restoreTimeout = null;
      }

      // Cancel animation if exists
      if (this.activeAnimation) {
        this.activeAnimation.cancel();
        this.activeAnimation = null;
      }

      // Store references before clearing
      const viewRef = this.touchedView;
      this.touchedView = null;

      // Create animation
      const restoreAnimation = new Animation([
        {
          target: viewRef,
          backgroundColor: LOG_COLORS.TRANSPARENT_BG,
          duration: 200
        }
      ]);

      // Store animation reference
      this.activeAnimation = restoreAnimation;

      // Play animation and handle completion
      restoreAnimation.play()
        .then(() => {
          this.activeAnimation = null;
          this.isProcessingTouch = false;
        })
        .catch(e => {
          // On error, reset directly
          viewRef.backgroundColor = LOG_COLORS.TRANSPARENT_BG;
          this.activeAnimation = null;
          this.isProcessingTouch = false;
        });
    }
  },

  // Cleanup when component is destroyed
  beforeDestroy() {
    this.resetTouchState();
  }
};

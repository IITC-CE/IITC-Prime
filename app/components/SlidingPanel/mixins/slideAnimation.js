//@license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3

import { CoreTypes } from "@nativescript/core";
import { Animation } from "@nativescript/core";

export const slideAnimationMixin = {
  data() {
    return {
      isAnimating: false,
      animationSet: undefined,
    };
  },

  methods: {
    async animatePanel(element, fromTop, targetTop) {
      if (!element) {
        return Promise.resolve(fromTop);
      }

      // Skip if positions are the same
      if (Math.abs(fromTop - targetTop) < 1) {
        return Promise.resolve(targetTop);
      }

      try {
        this.isAnimating = true;
        const translateY = targetTop - fromTop;

        // Set initial position
        element.translateY = 0;
        element.top = fromTop;

        // Create animation
        this.animationSet = new Animation([{
          target: element,
          translate: { x: 0, y: translateY },
          duration: 300,
          curve: CoreTypes.AnimationCurve.easeInOut,
        }]);

        // Play animation and wait for completion
        await this.animationSet.play();

        // Set final position
        element.translateY = 0;
        element.top = targetTop;

        return targetTop; // Return the end position to update the state
      } catch (error) {
        console.error('Animation error:', error);
        return fromTop; // Return the initial position in case of an error
      } finally {
        this.isAnimating = false;
        this.animationSet = undefined;
      }
    },

    /**
     * Cancel current animation
     */
    cancelAnimation() {
      if (this.animationSet && this.isAnimating) {
        this.animationSet.cancel();
        this.animationSet = undefined;
        this.isAnimating = false;
      }
    }
  }
};

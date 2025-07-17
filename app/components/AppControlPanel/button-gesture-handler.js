// Copyright (C) 2025 IITC-CE - GPL-3.0 with Store Exception - see LICENSE and COPYING.STORE

/**
 * Button gesture handler utility for AppControl buttons
 * Provides pan/tap conflict prevention and memory management
 */
export function createButtonGestureHandler(options = {}) {
  const {
    panThreshold = 15,
    panEndDelay = 100
  } = options;

  // Internal state
  let isPanning = false;
  let currentPanId = null;
  const timers = new Set();

  /**
   * Handle pan gesture with improved detection
   */
  function handlePan(event, emitFn) {
    // Calculate total movement distance
    const distance = Math.abs(event.deltaX) + Math.abs(event.deltaY);

    // Handle different pan gesture states
    switch (event.state) {
      // Pan start
      case 1:
        currentPanId = Date.now();
        isPanning = false;
        break;

      // Pan in progress
      case 2:
        // If distance exceeds threshold, consider it a pan gesture
        if (distance > panThreshold && !isPanning) {
          isPanning = true;
        }
        break;

      // Pan end
      case 3:
        // Delay to prevent tap triggering after pan
        const timerId = setTimeout(() => {
          isPanning = false;
        }, panEndDelay);
        timers.add(timerId);
        break;
    }

    // Emit pan event only if it's a real pan gesture
    if (isPanning && distance > panThreshold) {
      event.panId = currentPanId;
      emitFn('pan', event);
    }
  }

  /**
   * Handle tap gesture with conflict prevention
   */
  function handleTap(event, emitFn, isActive, isToggleable = true) {
    // Ignore taps during pan gesture
    if (isPanning) {
      return;
    }

    // Emit tap event
    emitFn('tap', event);

    // For toggleable buttons, emit appropriate event
    if (isToggleable) {
      const action = isActive ? 'deactivate' : 'activate';
      emitFn(action);
    }
  }

  /**
   * Cleanup function to prevent memory leaks
   */
  function cleanup() {
    timers.forEach(timerId => clearTimeout(timerId));
    timers.clear();
    isPanning = false;
    currentPanId = null;
  }

  /**
   * Get current panning state
   */
  function getIsPanning() {
    return isPanning;
  }

  return {
    handlePan,
    handleTap,
    cleanup,
    getIsPanning
  };
}

/**
 * Vue mixin for button gesture handling
 */
export const buttonGestureHandlerMixin = {
  data() {
    return {
      _buttonGestureHandler: null
    };
  },

  created() {
    this._buttonGestureHandler = createButtonGestureHandler({
      panThreshold: this.panThreshold || 15,
      panEndDelay: 100
    });
  },

  beforeUnmount() {
    if (this._buttonGestureHandler) {
      this._buttonGestureHandler.cleanup();
    }
  },

  methods: {
    /**
     * Handle pan gesture - wrapper for gesture handler
     */
    handleButtonPan(event) {
      if (this._buttonGestureHandler) {
        this._buttonGestureHandler.handlePan(event, this.$emit.bind(this));
      }
    },

    /**
     * Handle tap gesture - wrapper for gesture handler
     */
    handleButtonTap(event) {
      if (this._buttonGestureHandler) {
        this._buttonGestureHandler.handleTap(
          event,
          this.$emit.bind(this),
          this.isActive,
          this.isToggleable !== false
        );
      }
    },

    /**
     * Check if currently panning
     */
    isCurrentlyPanning() {
      return this._buttonGestureHandler ?
        this._buttonGestureHandler.getIsPanning() : false;
    }
  }
};
